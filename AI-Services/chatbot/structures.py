from pydantic import BaseModel
from typing import Dict, Any, List

class Analysis(BaseModel):
    user_query: str
    specialised_prompt: str
    memory: Any

class Summarise(BaseModel):
    chat_history: Any

class Category(BaseModel):
    user_message: str
    chat_history: Any