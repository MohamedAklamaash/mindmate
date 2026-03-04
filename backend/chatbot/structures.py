from pydantic import BaseModel, Field
from typing import Dict, Any, List


class Analysis(BaseModel):
    """User query analysis structure."""
    user_query: str
    specialised_prompt: str
    memory: Any

class Summarise(BaseModel):
    """Chat history summarization structure."""
    chat_history: Any

class Category(BaseModel):
    """Message category classification structure."""
    user_message: str
    chat_history: Any



class ConversationInsights(BaseModel):
    """
    ConversationInsights provides a structured summary of a conversation, including detected emotion, sentiment,
    important dates mentioned, and a field for additional explanations.

    Fields:
    - overall_emotion: The dominant emotion detected throughout the conversation.
    - overall_sentiment: The general sentiment (positive, negative, or neutral) of the conversation.
    - important_dates: A list of DateContext objects representing dates and times of significance mentioned in the conversation.
    - explanation: A textual explanation providing further context or reasoning about the insights.
    - fiend: An additional field for storing extra information or metadata related to the conversation insights.
    """

    overall_emotion: str = Field(
        default=None,
        description="The dominant emotion detected throughout the conversation."
    )
    overall_sentiment: str = Field(
        default=None,
        description="The general sentiment (positive, negative, or neutral) of the conversation."
    )

    class DateContext(BaseModel):
        """
        DateContext represents a specific date and optional time mentioned in the conversation,
        along with a context string explaining what could a message give to the user to start about the conversation about the significance of the event they talked about.
        """
        date: str = Field(
            ...,
            description="The date of significance mentioned in the conversation so that we can start the conversation at that date."
        )
        time: str = Field(
            default=None,
            description="The time associated with the date, if specified so that we can start the conversation at that time."
        )
        context: str = Field(
            default=None,
            description=" A message give to the user to start about theconversation about the significance of the event they talked about."
        )

    important_dates: List[DateContext] = Field(
        default=None,
        description="A list of important dates and times mentioned in the conversation so that we can start the conversation at that date and time."
    )
    explanation: str = Field(
        default=None,
        description="A textual explanation providing further context or reasoning about the insights."
    )
    fiend: str = Field(
        default=None,
        description="An additional field for storing extra information or metadata related to the conversation insights."
    )


class PersonalSummary(BaseModel):
    summary: str
    insights: ConversationInsights

class MoodEntry(BaseModel):
    date: str
    emotion: str
    sentiment: str

class MoodAnalytics(BaseModel):
    mood_history: List[MoodEntry]
    dominant_emotion: str
    sentiment_trend: str
    total_days: int