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
        self._messages: List[Dict[str, str]] = []
        self._previous_Insights: List[str] = []
        self._previous_Summary: List[str] = []
        self._last_context_reset_date: date = datetime.now().date()
        
        self.db = DB(config_path)
        
        # Get context window threshold (80% of max input tokens)
        context_info = self.chat.get_model_context_window()
        max_input_tokens = context_info['max_input_tokens']
        self._context_threshold = int(max_input_tokens * 0.7)  # 70% threshold
       
        # to identify it is first message or not if it is first message then we need to add the user info to the message
        self.chat.config['question_info'] = self.get_question_info()
        self.initial_message=True

    def classify_category(self, user_query: str, chat_history: Optional[List[Any]] = None) -> str:
        """Return the category label for a message and history."""
        history = chat_history if chat_history is not None else self._messages
        return self.prompts.identify_category(user_query, history)

    def get_specialised_prompt(self, user_query: str, chat_history: Optional[List[Any]] = None) -> str:
        """Return specialised system prompt based on content and context."""
        history = chat_history if chat_history is not None else self._messages
        return self.prompts.get_specialised_prompt(user_query, history)

    def get_reply(
        self,
        user_query: str,
        chat_history: Optional[List[Any]] = None,
        memory: Any = None,
        **kwargs,
    ) -> str:
        """Generate a reply using specialised prompt, query, and optional memory."""
        self._messages.append({"user": user_query})
        if self.initial_message:
            self.initial_message = False
            specialised_prompt = 
            analysis_input = Analysis(
                user_query=user_query,
                specialised_prompt=specialised_prompt,
                memory=(memory or {
                    "messages": self._messages if self._messages else None,
                    "previous_summary": self._previous_Summary if self._previous_Summary else None,
                    "previous_insights": self._previous_Insights if self._previous_Insights else None,
                    "question_info": self.chat.config['question_info'] if self.chat.config['question_info'] else None,
                }),
            )
            response_text = self.chat.invoke_model(input=analysis_input,system_prompt_override=SYSTEM_PROMPT_FIRST_MESSAGE, **kwargs)

        else:
            specialised_prompt = self.get_specialised_prompt(
            user_query,
            chat_history if chat_history is not None else self._messages,
        )
            analysis_input = Analysis(
                user_query=user_query,
                specialised_prompt=specialised_prompt,
                memory=(memory or {
                    "messages": self._messages if self._messages else None,
                    "previous_summary": self._previous_Summary if self._previous_Summary else None,
                    "previous_insights": self._previous_Insights if self._previous_Insights else None,
                }),
            )
            response_text = self.chat.invoke_model(input=analysis_input, **kwargs)
        try:
            sp_preview = specialised_prompt[:80] if isinstance(specialised_prompt, str) else str(type(specialised_prompt))
            rt_preview = response_text[:80] if isinstance(response_text, str) else str(type(response_text))
            logger.info(f"chatbot.reply user_query={user_query} specialised_prompt={sp_preview} response_text={rt_preview}")
        except Exception:
            pass
        if self._messages:
            self._messages[-1]["ai"] = response_text
        # Check if we should summarise and compress oldest messages
        self.maybe_summarise()
        return response_text

    def get_initial_message(self) -> str:
        """Set initial message to False."""
        self.initial_message = True
        reply = self.get_reply(user_query="")
        return reply


    def get_notification(self) -> str:
        """Set initial message to False."""
        self.initial_message = False
        reply = self.get_reply(user_query="")
        return reply


    def summarize(self, **kwargs) -> PersonalSummary:
        """Summarize internal conversation history for memory (structured)."""
        summ_input = Summarise(chat_history={"messages": self._messages})
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

    def maybe_summarise(self) -> None:
        """If context exceeds threshold, summarise the oldest 20% of messages and store results.

        - Take the first 20% of `self._messages` as the oldest chunk
        - Remove them from `self._messages`
        - Summarise that chunk using structured `PersonalSummary`
        - Append summary text to `self._previous_Summary`
        - Append insights to `self._previous_Insights`
        """
        try:
            current_context_length = self._estimate_context_length()
            if current_context_length <= self._context_threshold:
                return

            if not self._messages:
                return

            logger.info(
                f"Context length ({current_context_length}) exceeds threshold ({self._context_threshold}); compressing oldest messages"
            )

            # Calculate how many messages form the oldest 20%
            total_messages = len(self._messages)
            num_old = max(1, int(total_messages * 0.2))
            old_chunk = self._messages[:num_old]

            # Remove the oldest chunk from active messages
            self._messages = self._messages[num_old:]

            # Summarise the removed chunk
            summ_input = Summarise(chat_history={"messages": old_chunk})
            result: PersonalSummary = self.chat.invoke_model(
                input=summ_input,
                request_format={"type": "json", "schema": PersonalSummary, "mime_type": "application/json"},
            )

            # Persist structured summary and insights
            if getattr(result, "summary", None):
                self._previous_Summary.append(result.summary)
            insights_obj = getattr(result, "insights", None)
            if insights_obj is not None:
                # Store as JSON-serialisable string to avoid Pydantic object leakage if needed
                try:
                    # Prefer storing the model itself if consumers handle it, else string
                    self._previous_Insights.append(insights_obj)
                except Exception:
                    self._previous_Insights.append(str(insights_obj))
        except Exception as e:
            logger.warning(f"maybe_summarise failed: {e}")
    
    def _estimate_context_length(self) -> int:
        """Estimate the total context length in tokens (approximate)."""
        # Rough estimation: 1 token ≈ 4 characters for English text
        total_chars = 0
        
        # Add messages length
        for msg in self._messages:
            if isinstance(msg, dict):
                for key, value in msg.items():
                    if isinstance(value, str):
                        total_chars += len(value)
            elif isinstance(msg, str):
                total_chars += len(msg)
        
        # Add previous summaries length
        for context in self._previous_Summary:
            if isinstance(context, str):
                total_chars += len(context)
        
        # Add system prompt length (approximate)
        # This is a rough estimate - in practice, you might want to get the actual system prompt
        system_prompt_chars = 1000  # Approximate system prompt length
        
        total_chars += system_prompt_chars
        
        # Convert to approximate token count (1 token ≈ 2.5 characters)
        estimated_tokens = int(total_chars / 2.5)
        
        return estimated_tokens

    def _maybe_clear_previous_context(self) -> None:
        """At local midnight, create a daily rollup and clear previous summaries/insights."""
        now = datetime.now()
        if now.date() != self._last_context_reset_date:
            try:
                # Create an overarching insights rollup for the day from current messages
                daily_summary: PersonalSummary = self.summarize()
                if getattr(daily_summary, "summary", None):
                    self._previous_Summary.append(daily_summary.summary)
                if getattr(daily_summary, "insights", None):
                    self._previous_Insights.append(daily_summary.insights)
            except Exception:
                pass
            self._previous_Summary.clear()
            self._previous_Insights.clear()
            self._last_context_reset_date = now.date()
            try:
                logger.info("chatbot.previous_memory.cleared_midnight")
            except Exception:
                pass

    def app_exit(self) -> None:
        """On app exit, summarise all remaining messages and store to previous summary/insights, then clear messages."""
        try:
            if self._messages:
                summ_input = Summarise(chat_history={"messages": self._messages})
                result: PersonalSummary = self.chat.invoke_model(
                    input=summ_input,
                    request_format={"type": "json", "schema": PersonalSummary, "mime_type": "application/json"},
                )
                if getattr(result, "summary", None):
                    self._previous_Summary.append(result.summary)
                if getattr(result, "insights", None):
                    self._previous_Insights.append(result.insights)
            # Clear active messages after persisting
            self._messages = []
        except Exception as e:
            logger.warning(f"app_exit summarisation failed: {e}")


    def hard_reset(self) -> None:
        """Dump current memory to DB if available, then clear all and reset initial state."""
        try:
            if self.db and hasattr(self.db, "save_conversation"):
                try:
                    from datetime import datetime
                    timestamp = datetime.now().isoformat()
                    self.db.save_conversation(
                        messages=self._messages,
                        previous_summaries=self._previous_Summary,
                        previous_insights=self._previous_Insights,
                        timestamp=timestamp
                    )
                except Exception as db_err:
                    logger.warning(f"chat_reset DB save failed: {db_err}")
        finally:
            self._messages = []
            self._previous_Summary = []
            self._previous_Insights = []
            self.initial_message = True

    def get_question_info(self):
        pass

    def model_info(self) -> Dict:
        """Return underlying model metadata."""
        return self.chat.get_model_info()

    def get_history(self) -> Dict:
        """Return stored messages and previous context list."""
        return {"messages": list(self._messages), "previous summary": list(self._previous_Summary), "previous insights": list(self._previous_Insights)}

    def reset(self) -> None:
        """Clear stored history."""
        self._messages = []
    








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

    # Classification + specialised prompt
    cat = bot.classify_category("I feel anxious before meetings")
    print("Category:", cat)
    spec = bot.get_specialised_prompt("I feel anxious before meetings")
    print("Specialised prompt present:", bool(spec))

    # Reply turns + auto summarize
    r1 = bot.reply("Hello there")
    r2 = bot.reply("I'm feeling anxious before meetings")
    print("Replies:", bool(r1), bool(r2))
    print("History:", bot.history())

