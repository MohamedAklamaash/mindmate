from typing import List, Dict, Optional, Any
from datetime import datetime, date
import logging
from chat import ChatCompletionBase
from prompt_manager import PromptManager
from custom_promt import SYSTEM_PROMPT_FIRST_MESSAGE
from structures import Analysis, Summarise, PersonalSummary, ConversationInsights
from db import DB
if not logging.getLogger().handlers:
    logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class ChatBot:
    """High-level chatbot that integrates classification and response generation."""

    def __init__(self, config_path: str):
        """Initialize underlying chat model and prompt manager."""
        self.chat = ChatCompletionBase(config_path)
        self.prompts = PromptManager(self.chat)
        # Dictionary to store user-specific data by user_id
        self._user_data: Dict[str, Dict[str, Any]] = {}
        
        self.db = DB(config_path)
        
        # Get context window threshold (80% of max input tokens)
        context_info = self.chat.get_model_context_window()
        max_input_tokens = context_info['max_input_tokens']
        self._context_threshold = int(max_input_tokens * 0.7)  # 70% threshold
       

    # get the user data for a user
    def _get_user_data(self, user_id: str) -> Dict[str, Any]:
        """Get or initialize user-specific data."""
        if user_id not in self._user_data:
            self._user_data[user_id] = {
                'messages': [],
                'previous_insights': [],
                'previous_summary': [],
                'notification': [],
                'initial_message': True
            }
        return self._user_data[user_id]

    # get the initial message for a user
    def get_initial_message(self, user_id: str) -> str:
        """Set initial message to False."""
        user_data = self._get_user_data(user_id)
        if user_data['initial_message'] == False:
            return None
        reply = self.get_reply(user_query="", user_id=user_id)
        return reply

    # change the initial message to True for all users
    def change_initial_message(self):
        for user_id in self._user_data:
            self._user_data[user_id]['initial_message'] = True

    # store question info for a user
    def store_question_info(self, user_id: str, question_info: str):
        user_data = self._get_user_data(user_id)
        user_data['question_info'] = question_info

    def classify_category(self, user_query: str, user_id: str, chat_history: Optional[List[Any]] = None) -> str:
        """Return the category label for a message and history."""
        user_data = self._get_user_data(user_id)
        history = chat_history if chat_history is not None else user_data['messages']
        return self.prompts.identify_category(user_query, history)

    def get_specialised_prompt(self, user_query: str, user_id: str, chat_history: Optional[List[Any]] = None) -> str:
        """Return specialised system prompt based on content and context."""
        user_data = self._get_user_data(user_id)
        history = chat_history if chat_history is not None else user_data['messages']
        return self.prompts.get_specialised_prompt(user_query, history)

    def get_reply(
        self,
        user_query: str,
        user_id: str,
        chat_history: Optional[List[Any]] = None,
        memory: Any = None,
        **kwargs
    ) -> str:
        """Generate a reply using specialised prompt, query, and optional memory."""
        # Get user-specific data
        user_data = self._get_user_data(user_id)
        # Add user query to messages
        user_data['messages'].append({"user": user_query})
        
        if user_data['initial_message']:
            user_data['initial_message'] = False
            specialised_prompt = self.get_specialised_prompt(user_query, user_id, chat_history)
            analysis_input = Analysis(
                user_query=user_query,
                specialised_prompt=specialised_prompt,
                memory=(memory or {
                    "messages": user_data['messages'] if user_data['messages'] else None,
                    "previous_summary": user_data['previous_summary'] if user_data['previous_summary'] else None,
                    "previous_insights": user_data['previous_insights'] if user_data['previous_insights'] else None,
                    "question_info": user_data['question_info'] if user_data['question_info'] else None,
                }),
            )
            response_text = self.chat.invoke_model(input=analysis_input, system_prompt_override=SYSTEM_PROMPT_FIRST_MESSAGE, **kwargs)
        else:
            specialised_prompt = self.get_specialised_prompt(user_query, user_id, chat_history)
            analysis_input = Analysis(
                user_query=user_query,
                specialised_prompt=specialised_prompt,
                memory=(memory or {
                    "messages": user_data['messages'] if user_data['messages'] else None,
                    "previous_summary": user_data['previous_summary'] if user_data['previous_summary'] else None,
                    "previous_insights": user_data['previous_insights'] if user_data['previous_insights'] else None,
                }),
            )
            response_text = self.chat.invoke_model(input=analysis_input, **kwargs)
        
        try:
            sp_preview = specialised_prompt[:80] if isinstance(specialised_prompt, str) else str(type(specialised_prompt))
            rt_preview = response_text[:80] if isinstance(response_text, str) else str(type(response_text))
            logger.info(f"chatbot.reply user_id={user_id} user_query={user_query} specialised_prompt={sp_preview} response_text={rt_preview}")
        except Exception:
            pass
        
        # Add AI response to messages
        if user_data['messages']:
            user_data['messages'][-1]["ai"] = response_text
        
        # Check if we should summarise and compress oldest messages
        self.maybe_summarise(user_data)
        return response_text

    def maybe_summarise(self, user_data: Dict[str, Any]) -> None:
        """If context exceeds threshold, summarise the oldest 20% of messages and store results.

        - Take the first 20% of user messages as the oldest chunk
        - Remove them from user messages
        - Summarise that chunk using structured `PersonalSummary`
        - Append summary text to user's previous summary
        - Append insights to user's previous insights
        """
        try:
            
            current_context_length = self._estimate_context_length(user_data)
            if current_context_length <= self._context_threshold:
                return

            if not user_data['messages']:
                return

            logger.info(
                f"Context length ({current_context_length}) exceeds threshold ({self._context_threshold}); compressing oldest messages for user {user_id}"
            )

            # Calculate how many messages form the oldest 20%
            total_messages = len(user_data['messages'])
            num_old = max(1, int(total_messages * 0.2))
            old_chunk = user_data['messages'][:num_old]

            # Remove the oldest chunk from active messages
            user_data['messages'] = user_data['messages'][num_old:]

            # Summarise the removed chunk
            summ_input = Summarise(chat_history={"messages": old_chunk})
            result: PersonalSummary = self.chat.invoke_model(
                input=summ_input,
                request_format={"type": "json", "schema": PersonalSummary, "mime_type": "application/json"},
            )

            # Persist structured summary and insights
            if getattr(result, "summary", None):
                user_data['previous_summary'].append(result.summary)
            insights_obj = getattr(result, "insights", None)
            if insights_obj is not None:
                # Store as JSON-serialisable string to avoid Pydantic object leakage if needed
                try:
                    # Prefer storing the model itself if consumers handle it, else string
                    user_data['previous_insights'].append(insights_obj)
                    if 'notification' not in user_data:
                        user_data['notification'] = []
                    if insights_obj.important_dates:
                        user_data['notification'].append(insights_obj.important_dates)
                except Exception:
                    user_data['previous_insights'].append(str(insights_obj))
                    if 'notification' not in user_data:
                        user_data['notification'] = []
                    if insights_obj.important_dates:
                        user_data['notification'].append(insights_obj.important_dates)
        except Exception as e:
            logger.warning(f"maybe_summarise failed for user {user_id}: {e}")
    
    def _estimate_context_length(self, user_data: Dict[str, Any]) -> int:
        """Estimate the total context length in tokens (approximate)."""
        
        # Rough estimation: 1 token ≈ 4 characters for English text
        total_chars = 0
        
        # Add messages length
        for msg in user_data['messages']:
            if isinstance(msg, dict):
                for key, value in msg.items():
                    if isinstance(value, str):
                        total_chars += len(value)
            elif isinstance(msg, str):
                total_chars += len(msg)
        
        # Add previous summaries length
        for context in user_data['previous_summary']:
            if isinstance(context, str):
                total_chars += len(context)
        
        # Add system prompt length (approximate)
        # This is a rough estimate - in practice, you might want to get the actual system prompt
        system_prompt_chars = 500  # Approximate system prompt length
        
        total_chars += system_prompt_chars
        
        # Convert to approximate token count (1 token ≈ 2.5 characters)
        estimated_tokens = int(total_chars / 2.5)
        
        return estimated_tokens

    def app_exit(self, user_id: str) -> tuple:
        """On app exit, summarise all remaining messages and store to previous summary/insights, then clear messages."""
        try:
            user_data = self._get_user_data(user_id)
            messages = user_data['messages']
            if messages:
                summ_input = Summarise(chat_history={"messages": messages})
                result: PersonalSummary = self.chat.invoke_model(
                    input=summ_input,
                    request_format={"type": "json", "schema": PersonalSummary, "mime_type": "application/json"},
                )
                if getattr(result, "summary", None):
                    user_data['previous_summary'].append(result.summary)
                if getattr(result, "insights", None):
                    user_data['previous_insights'].append(result.insights)
                # Clear active messages after persisting
                if 'notification' not in user_data:
                    user_data['notification'] = []
                if result.insights and result.insights.important_dates:
                    user_data['notification'].append(result.insights.important_dates)
            notification = user_data['notification']
            user_data['notification'] = []
            user_data['messages'] = []
            return self.get_notification(notification) , self.get_emotion_sentiment(user_id)
        except Exception as e:
            logger.warning(f"app_exit summarisation failed for user {user_id}: {e}")
            return [] , (None, None)

    def get_notification(self, notification: List[Any]) -> List[Dict[str, str]]:
        """Get the notification to the user."""
        notification_list = []
        
        for insight in notification:
            if hasattr(insight, 'important_dates') and insight.important_dates:
                for date_context in insight.important_dates:
                    # Skip if there is no context
                    if not date_context.context:
                        continue
                    # Combine date and time for timestamp
                    timestamp = date_context.date
                    if date_context.time:
                        timestamp = f"{date_context.date} {date_context.time}"
                    
                    notification_dict = {
                        'timestamp': timestamp,
                        'notification_message': date_context.context
                    }
                    notification_list.append(notification_dict)
        
        return notification_list

    def get_emotion_sentiment(self, user_id: str) -> str:
        """Get the emotion and sentiment of the user."""
        user_data = self._get_user_data(user_id)
        if user_data['previous_insights']:
            return user_data['previous_insights'][-1].overall_emotion, user_data['previous_insights'][-1].overall_sentiment
        return None, None

    def get_all_user_ids(self) -> List[str]:
        """Get all user IDs that have data in the chatbot."""
        return list(self._user_data.keys())

    def clear_context_for_all_users(self) -> None:
        """Call _maybe_clear_previous_context for all users."""
        user_ids = self.get_all_user_ids()
        for user_id in user_ids:
            try:
                self._maybe_clear_previous_context(user_id)
                logger.info(f"Cleared context for user {user_id}")
            except Exception as e:
                logger.warning(f"Failed to clear context for user {user_id}: {e}")

    def summarize(self, user_id: str, **kwargs) -> PersonalSummary:
        """Summarize internal conversation history for memory (structured)."""
        user_data = self._get_user_data(user_id)
        summ_input = Summarise(chat_history={"messages": user_data['messages']})
        summary = self.chat.invoke_model(
            input=summ_input,
            request_format={"type": "json", "schema": PersonalSummary, "mime_type": "application/json"},
            **kwargs,
        )
        try:
            logger.info("chatbot.summarize.success")
        except Exception:
            pass
        return summary

    def _maybe_clear_previous_context(self, user_id: str) -> None:
        """Create a daily rollup and remove last 40% of previous summaries/insights to local DB."""
        try:
            user_data = self._get_user_data(user_id)
            # Create an overarching insights rollup for the day from current messages
            daily_summary: PersonalSummary = self.summarize(user_id)
            if getattr(daily_summary, "summary", None):
                user_data['previous_summary'].append(daily_summary.summary)
            if getattr(daily_summary, "insights", None):
                user_data['previous_insights'].append(daily_summary.insights)
            if getattr(daily_summary, "notification", None):
                user_data['notification'].append(daily_summary.insights.important_dates)
            
            # Remove last 40% of previous summaries and insights, store them in local DB
            self._remove_and_store_last_40_percent(user_id)
            
            logger.info(f"chatbot.previous_memory.cleared for user {user_id}")
        except Exception as e:
            logger.warning(f"Failed to clear previous context for user {user_id}: {e}")

    def _remove_and_store_last_40_percent(self, user_id: str) -> None:
        """Remove last 40% of previous summaries and insights, store them in local DB."""
        user_data = self._get_user_data(user_id)
        
        # Calculate 40% of the lists
        total_summaries = len(user_data['previous_summary'])
        total_insights = len(user_data['previous_insights'])
        
        # Use the minimum length to ensure we don't go out of bounds
        min_length = min(total_summaries, total_insights)
        items_to_remove = max(0, int(min_length * 0.4))
        
        # Store the items to be removed in local DB before removing them
        try:
            # Store paired summary and insights (they correspond by index)
            for i in range(min_length - items_to_remove, min_length):
                if i < len(user_data['previous_summary']) and i < len(user_data['previous_insights']):
                    summary_text = user_data['previous_summary'][i]
                    insights_obj = user_data['previous_insights'][i]
                    
                    # Create a PersonalSummary object with both summary and insights paired together
                    personal_summary = PersonalSummary(
                        summary=summary_text,
                        insights=insights_obj
                    )
                    self.db.insert_local_summary(personal_summary, user_id)
        except Exception as e:
            logger.warning(f"Failed to store last 40% in local DB for user {user_id}: {e}")
        
        # Remove the last 40% from both lists
        if items_to_remove > 0:
            user_data['previous_summary'] = user_data['previous_summary'][:-items_to_remove]
            user_data['previous_insights'] = user_data['previous_insights'][:-items_to_remove]

    def hard_reset(self, user_id: str) -> None:
        """First save existing summaries/insights, then summarize current messages and save, then clear all."""
        try:
            user_data = self._get_user_data(user_id)
            
            # FIRST: Save existing summaries and insights to DB (paired by index)
            if user_data['previous_summary'] and user_data['previous_insights']:
                try:
                    min_length = min(len(user_data['previous_summary']), len(user_data['previous_insights']))
                    for i in range(min_length):
                        summary_text = user_data['previous_summary'][i]
                        insights_obj = user_data['previous_insights'][i]
                        
                        # Create PersonalSummary with paired summary and insights
                        personal_summary = PersonalSummary(
                            summary=summary_text,
                            insights=insights_obj
                        )
                        self.db.insert_local_summary(personal_summary, user_id)
                    
                    logger.info(f"Saved {min_length} existing paired summaries/insights to DB for user {user_id}")
                except Exception as e:
                    logger.warning(f"Failed to save existing summaries/insights for user {user_id}: {e}")
            
            # THEN: If there are messages, summarize them and save to DB
            if user_data['messages']:
                try:
                    # Create a summary from current messages
                    summary = self.summarize(user_id)
                    if summary:
                        # Save the latest summary to local DB
                        self.db.insert_local_summary(summary, user_id)
                        logger.info(f"Saved latest conversation summary to DB for user {user_id}")
                except Exception as e:
                    logger.warning(f"Failed to save latest conversation summary for user {user_id}: {e}")
                    
        except Exception as e:
            logger.warning(f"Hard reset failed for user {user_id}: {e}")
        finally:
            # Clear all user data
            user_data['messages'] = []
            user_data['previous_summary'] = []
            user_data['previous_insights'] = []
            user_data['notification'] = []
            user_data['initial_message'] = True


    def model_info(self) -> Dict:
        """Return underlying model metadata."""
        return self.chat.get_model_info()

    def get_history(self, user_id: str) -> Dict:
        """Return stored messages and previous context list."""
        user_data = self._get_user_data(user_id)
        return {
            "messages": list(user_data['messages']), 
            "previous summary": list(user_data['previous_summary']), 
            "previous insights": list(user_data['previous_insights'])
        }

    def reset(self, user_id: str) -> None:
        """Clear stored history."""
        user_data = self._get_user_data(user_id)
        user_data['messages'] = []
        user_data['previous_summary'] = []
        user_data['previous_insights'] = []
        user_data['notification'] = []
        user_data['initial_message'] = True

__all__ = ["ChatBot"]


if __name__ == "__main__":
    # Unified runner to exercise chat, prompt manager, and chatbot with live API
    import os
    import yaml
    logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

    cfg_path = os.path.join(os.path.dirname(__file__), "config.yaml")
    with open(cfg_path, "r") as f:
        cfg = yaml.safe_load(f)
    api_key = os.getenv("GOOGLE_API_KEY") or cfg.get("api_key")
    if not api_key or api_key == "YOUR_API_KEY_HERE":
        print("Skipping live test: missing API key. Set GOOGLE_API_KEY or config.api_key")
        raise SystemExit(0)

    bot = ChatBot(cfg_path)

    print("-- ChatBot unified demo --")
    print("Model:", bot.model_info())

    # Test with a sample user_id
    test_user_id = "test_user_123"
    
    # Classification + specialised prompt
    cat = bot.classify_category("I feel anxious before meetings", test_user_id)
    print("Category:", cat)
    spec = bot.get_specialised_prompt("I feel anxious before meetings", test_user_id)
    print("Specialised prompt present:", bool(spec))

    # Reply turns + auto summarize
    r1 = bot.get_reply("Hello there", test_user_id)
    r2 = bot.get_reply("I'm feeling anxious before meetings", test_user_id)
    print("Replies:", bool(r1), bool(r2))
    print("History:", bot.get_history(test_user_id))

