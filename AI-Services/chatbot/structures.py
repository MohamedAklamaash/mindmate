from pydantic import BaseModel
from typing import Dict

class Analysis(BaseModel):
    user_query: str
    specialised_prompt: str
    memory: Dict

class Summarise(BaseModel):
    chat_history: Dict
