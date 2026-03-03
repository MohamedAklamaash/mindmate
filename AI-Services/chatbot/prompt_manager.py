from typing import List, Dict, Optional, Any
import logging
from datetime import datetime
from pydantic import BaseModel, Field
from .custom_promt import *
from .structures import Category
from .chat import ChatCompletionBase

if not logging.getLogger().handlers:
    logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


# Pydantic model for structured category extraction from the LLM
class CategoryResult(BaseModel):
    category: str = Field(description="One of the predefined categories like NORMAL, STRESS_AND_ANXIETY_MANAGEMENT, etc.")


class PromptManager:
    """
    Selects specialised prompt based on user's message and conversation context.
    Uses LLM-assisted classification with a strict schema, with keyword fallback.
    """

    CATEGORIES: List[str] = [
        "NORMAL",
        "STRESS_AND_ANXIETY_MANAGEMENT",
        "DEPRESSION_AND_MOOD_DISORDERS",
        "ADDICTION_AND_HABIT_CONTROL",
        "RELATIONSHIP_AND_SOCIAL_ISSUES",
        "SELF_ESTEEM_AND_PERSONAL_GROWTH",
        "TRAUMA_AND_GRIEF_SUPPORT",
        "SLEEP_AND_LIFESTYLE_BALANCE",
    ]

    CLASSIFICATION_KEYWORDS: Dict[str, List[str]] = {
        "STRESS_AND_ANXIETY_MANAGEMENT": ["stress", "anxious", "panic", "overwhelmed", "worried"],
        "DEPRESSION_AND_MOOD_DISORDERS": ["sad", "hopeless", "depressed", "no motivation", "empty"],
        "ADDICTION_AND_HABIT_CONTROL": ["addicted", "alcohol", "drugs", "gaming", "can't stop"],
        "RELATIONSHIP_AND_SOCIAL_ISSUES": ["relationship", "conflict", "lonely", "breakup", "family issue"],
        "SELF_ESTEEM_AND_PERSONAL_GROWTH": ["confidence", "self-doubt", "insecure", "self-esteem"],
        "TRAUMA_AND_GRIEF_SUPPORT": ["grief", "loss", "trauma", "abuse", "ptsd"],
        "SLEEP_AND_LIFESTYLE_BALANCE": ["sleep", "insomnia", "burnout", "tired", "work-life balance"],
    }

    SEVERE_KEYWORDS: List[str] = ["suicide", "kill myself", "can't live", "end my life"]

    def __init__(self, chat: ChatCompletionBase):
        self.chat = chat

    def _check_severity(self, message: str) -> int:
        lower = message.lower()
        for kw in self.SEVERE_KEYWORDS:
            if kw in lower:
                return 10
        return 3

    def _keyword_category(self, message: str, chat_history: List[Any]) -> str:
        # Flatten dict-based conversation into text for keyword scan
        flat_parts: List[str] = []
        for turn in chat_history or []:
            if isinstance(turn, dict):
                if "user" in turn:
                    flat_parts.append(str(turn["user"]))
                if "ai" in turn:
                    flat_parts.append(str(turn["ai"]))
            else:
                flat_parts.append(str(turn))
        combined = (message + " " + " ".join(flat_parts)).lower()
        for category, keywords in self.CLASSIFICATION_KEYWORDS.items():
            if any(k in combined for k in keywords):
                return category
        return "NORMAL"

    def _category_system_prompt(self) -> str:
        allowed = ", ".join(self.CATEGORIES)
        return (
            "You are a classifier for a mental wellness assistant.\n"
            "Rules:\n"
            "- Only output the JSON schema with the category field.\n"
            "- The category MUST be exactly one of: " + allowed + ".\n"
            "- If the message expresses immediate self-harm risk, still pick a category, but the app will route to THERAPIST.\n"
            "- Do not include explanations or extra fields."
        )

    def identify_category(self, user_query: str, conversation: List[Any]) -> str:
        # Severity short-circuit handled by caller, but we still classify
        try:
            logger.info("pm.identify_category.call")
            result = self.chat.invoke_model(
                Category(user_message=user_query, chat_history=conversation),
                request_format={
                    "type": "json",
                    "schema": CategoryResult,
                    "mime_type": "application/json",
                },
                system_prompt_override=self._category_system_prompt(),
                temperature=0.0,
                top_p=1.0,
                top_k=1,
            )
            cat = result.category if isinstance(result, CategoryResult) else getattr(result, "category", None)
            if isinstance(cat, str) and cat in self.CATEGORIES:
                logger.info(f"pm.identify_category.success category={cat}")
                return cat
        except Exception:
            logger.exception("pm.identify_category.error")
            pass
        return self._keyword_category(user_query, conversation)

    def get_specialised_prompt(self, user_query: str, conversation: List[Any]) -> str:
        # Severity gate
        severity = self._check_severity(user_query)
        if severity >= 8:
            return "THERAPIST"

        category = self.identify_category(user_query, conversation)
        mapping = {
            "NORMAL": NORMAL,
            "STRESS_AND_ANXIETY_MANAGEMENT": STRESS_AND_ANXIETY_MANAGEMENT,
            "DEPRESSION_AND_MOOD_DISORDERS": DEPRESSION_AND_MOOD_DISORDERS,
            "ADDICTION_AND_HABIT_CONTROL": ADDICTION_AND_HABIT_CONTROL,
            "RELATIONSHIP_AND_SOCIAL_ISSUES": RELATIONSHIP_AND_SOCIAL_ISSUES,
            "SELF_ESTEEM_AND_PERSONAL_GROWTH": SELF_ESTEEM_AND_PERSONAL_GROWTH,
            "TRAUMA_AND_GRIEF_SUPPORT": TRAUMA_AND_GRIEF_SUPPORT,
            "SLEEP_AND_LIFESTYLE_BALANCE": SLEEP_AND_LIFESTYLE_BALANCE,
        }
        specialised = mapping.get(category, NORMAL)
        logger.info(f"pm.specialised_prompt.selected category={category}")
        return specialised


if __name__ == "__main__":
    # Minimal example usage
    # Assumes a valid config.yaml is present alongside this module
    chat = ChatCompletionBase("config.yaml")
    pm = PromptManager(chat)
    demo_history: List[str] = [
        "Hi there", "I've been pretty overwhelmed at work lately"
    ]
    demo_query = "My heart races and I feel anxious before meetings."
    category = pm.identify_category(demo_query, demo_history)
    specialised = pm.get_specialised_prompt(demo_query, demo_history)
    print({"category": category})
    print("Specialised Prompt:\n", specialised)