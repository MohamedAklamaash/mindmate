from pydantic import BaseModel , Field
from typing import Dict, Any, List


# Input structures
class Analysis(BaseModel):
    user_query: str
    specialised_prompt: str
    memory: Any

class Summarise(BaseModel):
    chat_history: Any

# Output structures
class Category(BaseModel):
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
        along with a context string explaining its significance.
        """
        date: str = Field(
            ...,
            description="The date of significance mentioned in the conversation."
        )
        time: str = Field(
            default=None,
            description="The time associated with the date, if specified."
        )
        context: str = Field(
            default=None,
            description="Explanation of why this date/time is important."
        )

    important_dates: List[DateContext] = Field(
        default=None,
        description="A list of important dates and times mentioned in the conversation."
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