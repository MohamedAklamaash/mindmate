import yaml
import json
from typing import Optional, Dict, Any, Union, List
from abc import ABC, abstractmethod
from pydantic import BaseModel, ValidationError
from google import genai
from google.genai import types

SYSTEM_PROMPT = """
You are a helpful assistant.
"""

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
        self.config = self._load_config(config_path)
        self.model_name = self.config.get('model_name')
        self.api_key = self.config.get('api_key')
        self.client = self._initialize_client()
        
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
            print("config", config ,"\n\n")
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
        user_query: str,
        specialisation_prompt: str,
        request_format: Optional[Dict[str, Any]] = None,
        **kwargs
    ) -> Union[str, Any]:
        """
        Invoke the Gemini model with the given inputs.
        
        Args:
            user_query (str): The user's query/message
            specialisation_prompt (str): Specialization prompt for the model
            request_format (Optional[Dict[str, Any]]): Dict with 'type' and 'schema' for structured output
            **kwargs: Additional parameters for the model call
            
        Returns:
            Union[str, Any]: Model response (string or structured object)
        """
        # Prepare the content by combining prompts
        content = f"{specialisation_prompt}\n\n{user_query}"
        
        # Prepare generation config with system prompt
        generation_config = self._prepare_generation_config(request_format, **kwargs)
        
        # Make the API call
        try:
            response = self._make_api_call(content, generation_config)
            
            # Process response based on format
            if request_format:
                return self._process_structured_response(response)
            else:
                return self._process_text_response(response)
                
        except Exception as e:
            raise Exception(f"Error invoking model: {str(e)}")
    
    def _prepare_generation_config(
        self,
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
        generation_config.system_instruction = SYSTEM_PROMPT
        
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
        print("generation config",generation_config,"\n\n")
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
        print("text response", response,"\n\n")
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
            print("structured response", response,"\n\n")
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
        
        # Simple text response
        response = chat.invoke_model(
            user_query="What is machine learning?",
            specialisation_prompt="You are an AI expert."
        )
        print("Text Response:", response)
        
        # Structured response with schema
        structured_response = chat.invoke_model(
            user_query="List a few popular cookie recipes, and include the amounts of ingredients.",
            specialisation_prompt="You are a cooking expert.",
            request_format={
                "type": "list",
                "schema": Recipe
            }
        )
        print("Structured Response:", structured_response)
        print(chat.get_model_info())
    except Exception as e:
        print(f"Error: {e}")
