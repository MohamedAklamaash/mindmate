import os
import yaml
import json
import logging
from typing import Optional, Dict, Any, Union, List
from pydantic import BaseModel, ValidationError
from google import genai
from google.genai import types
from structures import Analysis, Summarise, Category
from custom_promt import *
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)


class ChatCompletionBase:
    def __init__(self, config_path: str):
        self._config_path = config_path
        self.config = self._load_config(config_path)
        self.model_name = self.config.get('model_name')
        self.api_key = os.environ.get('GOOGLE_API_KEY') or self.config.get('api_key')
        self.client = self._initialize_client()
        try:
            self._update_config_with_context_window_silent()
        except Exception as e:
            logger.warning(f"Failed to update config with context window: {e}")

    def _update_config_with_context_window_silent(self):
        try:
            if 'model_context_window' in self.config:
                return
            context_info = self.get_model_context_window()
            self.config['model_context_window'] = context_info
            with open(self._config_path, 'w') as f:
                yaml.dump(self.config, f, default_flow_style=False, indent=2)
        except Exception as e:
            logger.warning(f"Silent config update failed: {e}")

    def _load_config(self, config_path: str) -> Dict[str, Any]:
        with open(config_path, 'r') as f:
            return yaml.safe_load(f)

    def _initialize_client(self):
        if not self.api_key:
            raise ValueError("API key not found")
        return genai.Client(api_key=self.api_key)

    def invoke_model(self, input: Any, request_format: Optional[Dict[str, Any]] = None, **kwargs) -> Union[str, Any]:
        if hasattr(input, '__class__') and input.__class__.__name__ == 'Analysis':
            question_info = input.memory.get('question_info') if isinstance(input.memory, dict) else None
            messages = input.memory.get('messages') if isinstance(input.memory, dict) else None
            previous_summary = input.memory.get('previous_summary') if isinstance(input.memory, dict) else None
            previous_insights = input.memory.get('previous_insights') if isinstance(input.memory, dict) else None
            content = f"{input.specialised_prompt}\n\nUser Query: {input.user_query}\n\nPrevious Conversation Messages: {messages}\n\nPrevious Summary: {previous_summary}\n\nPrevious Insights: {previous_insights}\n\nQuestion Info: {question_info}"
            system_prompt = SYSTEM_PROMPT_ANALYSIS
        elif hasattr(input, '__class__') and input.__class__.__name__ == 'Summarise':
            content = f"Chat History: {input.chat_history}"
            system_prompt = SYSTEM_PROMPT_SUMMARISE
        elif hasattr(input, '__class__') and input.__class__.__name__ == 'Category':
            content = f"User Message: {input.user_message}\nConversation History: {input.chat_history}"
            system_prompt = ""
        else:
            content = str(input)
            system_prompt = "You are a helpful and supportive mental wellness assistant."

        system_prompt_override = kwargs.pop('system_prompt_override', None)
        effective_system_prompt = system_prompt_override or system_prompt
        generation_config = self._prepare_generation_config(effective_system_prompt, request_format, **kwargs)

        try:
            response = self._make_api_call(content, generation_config)
            if request_format:
                return self._process_structured_response(response)
            return self._process_text_response(response)
        except Exception as e:
            logger.exception("invoke_model error")
            raise Exception(f"Error invoking model: {str(e)}")

    def _prepare_generation_config(self, system_prompt: str, request_format=None, **kwargs):
        config_params = {
            "temperature": self.config.get('temperature', 0.7),
            "top_p": self.config.get('top_p', 1.0),
            "top_k": self.config.get('top_k', 40),
            "candidate_count": self.config.get('candidate_count', 1),
            "presence_penalty": self.config.get('presence_penalty', 0.0),
            "frequency_penalty": self.config.get('frequency_penalty', 0.0),
        }
        config_params.update(kwargs)
        generation_config = types.GenerateContentConfig(
            temperature=config_params["temperature"],
            top_p=config_params["top_p"],
            top_k=config_params["top_k"],
            candidate_count=config_params["candidate_count"],
            presence_penalty=config_params["presence_penalty"],
            frequency_penalty=config_params["frequency_penalty"],
        )
        generation_config.system_instruction = system_prompt
        if request_format:
            mime_type = request_format.get('mime_type', 'application/json')
            generation_config.response_mime_type = mime_type
            schema = request_format['schema']
            if hasattr(schema, '__origin__') and schema.__origin__ is list:
                generation_config.response_schema = schema.__args__[0]
            else:
                generation_config.response_schema = schema
        return generation_config

    def _make_api_call(self, content: str, generation_config):
        return self.client.models.generate_content(
            model=self.model_name,
            config=generation_config,
            contents=content
        )

    def _process_text_response(self, response) -> str:
        return response.text

    def _process_structured_response(self, response):
        try:
            return response.parsed
        except Exception as e:
            raise ValidationError(f"Failed to parse structured response: {e}")

    def get_model_info(self) -> Dict[str, Any]:
        return {"provider": "Google", "model": self.model_name, "client_type": "Google GenAI"}

    def get_model_context_window(self) -> Dict[str, Any]:
        model_contexts = {
            "gemini-1.5-flash": {"max_input_tokens": 1048576, "max_output_tokens": 8192, "context_window": "1M tokens"},
            "gemini-1.5-pro": {"max_input_tokens": 1048576, "max_output_tokens": 8192, "context_window": "1M tokens"},
            "gemini-2.0-flash": {"max_input_tokens": 1048576, "max_output_tokens": 8192, "context_window": "1M tokens"},
            "gemini-2.0-flash-exp": {"max_input_tokens": 1048576, "max_output_tokens": 8192, "context_window": "1M tokens"},
            "gemini-2.5-flash": {"max_input_tokens": 1048576, "max_output_tokens": 8192, "context_window": "1M tokens"},
            "gemini-2.5-pro": {"max_input_tokens": 1048576, "max_output_tokens": 8192, "context_window": "1M tokens"},
            "gemini-1.0-pro": {"max_input_tokens": 32768, "max_output_tokens": 8192, "context_window": "32K tokens"},
        }
        ctx = model_contexts.get(self.model_name, {
            "max_input_tokens": 1048576, "max_output_tokens": 8192, "context_window": "1M tokens"
        })
        return {
            "model_name": self.model_name,
            "context_window": ctx["context_window"],
            "max_input_tokens": ctx["max_input_tokens"],
            "max_output_tokens": ctx["max_output_tokens"],
            "note": ctx.get("note", "Known model")
        }

    def get_safe_input_tokens(self, buffer_percentage: float = 0.1) -> int:
        max_input_tokens = self.get_model_context_window()['max_input_tokens']
        return max_input_tokens - int(max_input_tokens * buffer_percentage)
