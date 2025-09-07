import yaml
import json
import logging
from datetime import datetime
from typing import Optional, Dict, Any, Union, List
from abc import ABC, abstractmethod
from pydantic import BaseModel, ValidationError
from google import genai
from google.genai import types
from structures import Analysis, Summarise, Category
from custom_promt import *

if not logging.getLogger().handlers:
    logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class ChatCompletionBase(ABC):
    """
    Base class for chat completion models.
    Supports config initialization, model invocation, and optional Pydantic request formatting.
    """
    
    def __init__(self, config_path: str):
        """
        Initialize the chat completion model with configuration from a YAML file.
        
        Args:
            config_path (str): Path to the configuration YAML file
        """
        self._config_path = config_path  # Store config path for later use
        self.config = self._load_config(config_path)
        self.model_name = self.config.get('model_name')
        self.api_key = self.config.get('api_key')
        self.client = self._initialize_client()
        
        # Automatically update config with context window info on initialization
        try:
            self._update_config_with_context_window_silent()
        except Exception as e:
            logger.warning(f"Failed to update config with context window during initialization: {e}")
    
    def _update_config_with_context_window_silent(self) -> None:
        """
        Silently update the config file with context window info without raising exceptions.
        Used during initialization to avoid breaking object creation.
        """
        try:
            # Check if context window info already exists in config
            if 'model_context_window' in self.config:
                logger.info("Context window info already exists in config, skipping update")
                return
            
            # Get context window info
            context_info = self.get_model_context_window()
            
            # Update config with context window info
            self.config['model_context_window'] = context_info
            
            # Write updated config back to file
            with open(self._config_path, 'w') as file:
                yaml.dump(self.config, file, default_flow_style=False, indent=2)
            
            logger.info(f"Updated config file with context window info: {context_info['context_window']}")
            
        except Exception as e:
            logger.warning(f"Silent config update failed: {e}")
            # Don't raise exception to avoid breaking initialization
        
    def _load_config(self, config_path: str) -> Dict[str, Any]:
        """
        Load configuration from YAML file.
        
        Args:
            config_path (str): Path to the configuration file
            
        Returns:
            Dict[str, Any]: Configuration dictionary
            
        Raises:
            FileNotFoundError: If config file doesn't exist
            yaml.YAMLError: If config file is invalid
        """
        try:
            with open(config_path, 'r') as file:
                config = yaml.safe_load(file)
            return config
        except FileNotFoundError:
            raise FileNotFoundError(f"Configuration file not found: {config_path}")
        except yaml.YAMLError as e:
            raise yaml.YAMLError(f"Invalid YAML in configuration file: {e}")
    
    def _initialize_client(self) -> Any:
        """
        Initialize the Google GenAI client based on the configuration.
        
        Returns:
            Any: Initialized Google GenAI client object
        """
        if not self.api_key:
            raise ValueError("API key not found in configuration")
        
        return genai.Client(api_key=self.api_key)
    
    def invoke_model(
        self,
        input: Any,
        request_format: Optional[Dict[str, Any]] = None,
        **kwargs
    ) -> Union[str, Any]:
        """
        Invoke the Gemini model with the given inputs.
        
        Args:
            input (Any): Input data - can be Analysis or Summarise Pydantic model
            request_format (Optional[Dict[str, Any]]): Dict with 'type' and 'schema' for structured output
            **kwargs: Additional parameters for the model call
            
        Returns:logger
            Union[str, Any]: Model response (string or structured object)
        """
        
        # Determine input type and prepare content accordingly
        if hasattr(input, '__class__') and input.__class__.__name__ == 'Analysis':
            # For Analysis: combine specialised_prompt, user_query, and memory
            if input.memory has question_info:
                logger.info("chat.invoke_model.call input_type=Analysis question_info=True")
                messages=input.memory['messages']
                previous_context = input.memory['previous_context']
                previous_insights = input.memory['previous_insights']
                question_info = input.memory['question_info']
            else:
                messages = input.memory['messages']
                previous_context = input.memory['previous_context']
                previous_insights = input.memory['previous_insights']
                question_info = None

            content = f"{input.specialised_prompt}\n\nUser Query: {input.user_query}\n\nMessages: {messages}\n\nPrevious Context: {previous_context}\n\nPrevious Insights: {previous_insights}\n\nQuestion Info: {question_info}"
            system_prompt = SYSTEM_PROMPT_ANALYSIS
            
        elif hasattr(input, '__class__') and input.__class__.__name__ == 'Summarise':
            # For Summarise: use only chat_history
            content = f"Chat History: {input.chat_history}"
            system_prompt = SYSTEM_PROMPT_SUMMARISE
            
        elif hasattr(input, '__class__') and input.__class__.__name__ == 'Category':
            # For Category: rely on external system_prompt_override; only provide content
            content = (
                f"User Message: {input.user_message}\n"
                f"Conversation History: {input.chat_history}"
            )
            system_prompt = ""
        else:
            # Use a default system message for normal usage of the model
            content = str(input)
            system_prompt = "You are a helpful and supportive mental wellness assistant. Respond to the user's message appropriately."
        
        # Prepare generation config with system prompt
        # Allow callers to override the system_prompt when needed (e.g., strict classifier)
        system_prompt_override = kwargs.pop('system_prompt_override', None)
        effective_system_prompt = system_prompt_override or system_prompt
        generation_config = self._prepare_generation_config(effective_system_prompt, request_format, **kwargs)
        
        # Make the API call
        try:
            logger.info(
                f"chat.invoke_model.call input_type={getattr(input, '__class__', type(input)).__name__} structured={bool(request_format)}"
            )
            response = self._make_api_call(content, generation_config)
            
            # Process response based on format
            if request_format:
                logger.info("chat.invoke_model.success_structured")
                return self._process_structured_response(response)
            else:
                logger.info("chat.invoke_model.success_text")
                return self._process_text_response(response)
                
        except Exception as e:
            logger.exception("chat.invoke_model.error")
            raise Exception(f"Error invoking model: {str(e)}")
    
    def _prepare_generation_config(
        self,
        system_prompt: str,
        request_format: Optional[Dict[str, Any]] = None,
        **kwargs
    ) -> types.GenerateContentConfig:
        """
        Prepare the generation configuration for Gemini API.
        
        Args:
            request_format (Optional[Dict[str, Any]]): Dict with 'type' and 'schema' for structured output
            **kwargs: Additional parameters
            
        Returns:
            types.GenerateContentConfig: Configured generation config
        """
        # Get required parameters from config
        config_params = {
            "temperature": self.config.get('temperature', 0.7),
            "top_p": self.config.get('top_p', 1.0),
            "top_k": self.config.get('top_k', 40),
            "candidate_count": self.config.get('candidate_count', 1),
            "presence_penalty": self.config.get('presence_penalty', 0.0),
            "frequency_penalty": self.config.get('frequency_penalty', 0.0),
        }
        
        # Override with any kwargs
        config_params.update(kwargs)
        # Create base config with all parameters
        generation_config = types.GenerateContentConfig(
            temperature=config_params["temperature"],
            top_p=config_params["top_p"],
            top_k=config_params["top_k"],
            candidate_count=config_params["candidate_count"],
            presence_penalty=config_params["presence_penalty"],
            frequency_penalty=config_params["frequency_penalty"],
        )
        
        # Add system instruction from global constant
        generation_config.system_instruction = system_prompt
        
        # Handle structured output if request_format is provided
        if request_format:
            if not isinstance(request_format, dict) or 'type' not in request_format or 'schema' not in request_format:
                raise ValueError("request_format must be a dict with 'type' and 'schema' keys")
            
            # Set response MIME type based on type or use default
            mime_type = request_format.get('mime_type', 'application/json')
            generation_config.response_mime_type = mime_type
            
            # Handle schema properly for Gemini API
            schema = request_format['schema']
            if hasattr(schema, '__origin__') and schema.__origin__ is list:
                # Handle List[Type] case
                generation_config.response_schema = schema.__args__[0]
            else:
                generation_config.response_schema = schema
        return generation_config
    
    def _make_api_call(
        self, 
        content: str, 
        generation_config: types.GenerateContentConfig
    ) -> Any:
        """
        Make the actual API call to the Gemini model.
        
        Args:
            content (str): Input content
            generation_config (types.GenerateContentConfig): Generation configuration
            
        Returns:
            Any: Raw API response
        """
        return self.client.models.generate_content(
            model=self.model_name,
            config=generation_config,
            contents=content
        )
    
    def _process_text_response(self, response: Any) -> str:
        """
        Process text response from the model.
        
        Args:
            response: Raw API response
            
        Returns:
            str: Processed text response
        """
        return response.text
    
    def _process_structured_response(
        self, 
        response: Any,
    ) -> Any:
        """
        Process structured response from the model.
        
        Args:
            response: Raw API response

        Returns:
            Any: Processed structured response
        """
        try:
            return response.parsed
        except Exception as e:
            raise ValidationError(f"Failed to parse structured response: {e}")
    
    def get_model_info(self) -> Dict[str, Any]:
        """
        Get information about the model.

        Returns:
            Dict[str, Any]: Model information
        """
        return {
            "provider": "Google",
            "model": self.model_name,
            "client_type": "Google GenAI"
        }
    
    def get_model_context_window(self) -> Dict[str, Any]:
        """
        Get the context window and token limits for the current model.
        
        Returns:
            Dict[str, Any]: Model context window information including max input tokens
        """
        # Google Gemini model context windows (as of 2024)
        model_contexts = {
            "gemini-1.5-flash": {
                "max_input_tokens": 1048576,  # 1M tokens
                "max_output_tokens": 8192,
                "context_window": "1M tokens"
            },
            "gemini-1.5-pro": {
                "max_input_tokens": 1048576,  # 1M tokens
                "max_output_tokens": 8192,
                "context_window": "1M tokens"
            },
            "gemini-2.0-flash": {
                "max_input_tokens": 1048576,  # 1M tokens
                "max_output_tokens": 8192,
                "context_window": "1M tokens"
            },
            "gemini-2.0-flash-exp": {
                "max_input_tokens": 1048576,  # 1M tokens
                "max_output_tokens": 8192,
                "context_window": "1M tokens"
            },
            "gemini-2.0-pro": {
                "max_input_tokens": 1048576,  # 1M tokens
                "max_output_tokens": 8192,
                "context_window": "1M tokens"
            },
            "gemini-2.5-flash": {
                "max_input_tokens": 1048576,  # 1M tokens
                "max_output_tokens": 8192,
                "context_window": "1M tokens"
            },
            "gemini-2.5-pro": {
                "max_input_tokens": 1048576,  # 1M tokens
                "max_output_tokens": 8192,
                "context_window": "1M tokens"
            },
            "gemini-1.0-pro": {
                "max_input_tokens": 32768,  # 32K tokens
                "max_output_tokens": 8192,
                "context_window": "32K tokens"
            },
            "gemini-1.0-pro-vision": {
                "max_input_tokens": 32768,  # 32K tokens
                "max_output_tokens": 8192,
                "context_window": "32K tokens"
            }
        }
        
        # Get context info for current model
        model_context = model_contexts.get(self.model_name, {
            "max_input_tokens": 1048576,  # Default to 1M for unknown models
            "max_output_tokens": 8192,
            "context_window": "1M tokens (default)",
            "note": "Model not in known list, using default values"
        })
        
        return {
            "model_name": self.model_name,
            "context_window": model_context["context_window"],
            "max_input_tokens": model_context["max_input_tokens"],
            "max_output_tokens": model_context["max_output_tokens"],
            "note": model_context.get("note", "Known model")
        }
    
    def get_safe_input_tokens(self, buffer_percentage: float = 0.1) -> int:
        """
        Get a safe number of input tokens to use, leaving buffer for output.
        
        Args:
            buffer_percentage (float): Percentage of max input tokens to reserve as buffer (default 10%)
            
        Returns:
            int: Safe number of input tokens to use
        """
        context_info = self.get_model_context_window()
        max_input_tokens = context_info['max_input_tokens']
        
        # Reserve buffer for output tokens and safety margin
        buffer_tokens = int(max_input_tokens * buffer_percentage)
        safe_input_tokens = max_input_tokens - buffer_tokens
        
        return safe_input_tokens

# Example Pydantic model for structured output
class Recipe(BaseModel):
    """Example Pydantic model for recipe responses."""
    recipe_name: str
    ingredients: List[str]


# Example usage
if __name__ == "__main__":
    # Example configuration structure (should be in config.yaml):
    example_config = {
        "model_name": "gemini-2.5-flash",
        "api_key": "your-google-api-key-here",
        "temperature": 0.7,
        "top_p": 1.0,
        "top_k": 40,
        "max_output_tokens": 1000
    }
    
    # Example usage
    try:
        # Create chat completion instance
        chat = ChatCompletionBase("config.yaml")
        
        # Example Analysis input
        analysis_input = Analysis(
            user_query="What is machine learning?",
            specialised_prompt="You are an AI expert.",
            memory={"previous_context": "User has been asking about AI topics"}
        )
        
        # Analysis response
        analysis_response = chat.invoke_model(analysis_input)
        print("Analysis Response:", analysis_response)
        
        # Example Summarise input
        summarise_input = Summarise(
            chat_history={"messages": ["Hello", "How are you?", "I'm doing well, thanks!"]}
        )
        
        # Summarise response
        summarise_response = chat.invoke_model(summarise_input)
        print("Summarise Response:", summarise_response)
        
        # Structured response with schema
        structured_response = chat.invoke_model(
            analysis_input,
            request_format={
                "type": "list",
                "schema": Recipe
            }
        )
        print("Structured Response:", structured_response)
        
        # Get and display model context window info
        context_info = chat.get_model_context_window()
        print("Model Context Info:", context_info)
        
        # Get safe input tokens
        safe_tokens = chat.get_safe_input_tokens()
        print(f"Safe input tokens (with 10% buffer): {safe_tokens}")
        
        print(chat.get_model_info())
    except Exception as e:
        print(f"Error: {e}")
