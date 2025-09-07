from typing import List, Dict, Optional, Any
from datetime import datetime, date
import logging
from chat import ChatCompletionBase
from prompt_manager import PromptManager
from structures import Analysis, Summarise, PersonalSummary

if not logging.getLogger().handlers:
    logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class ChatBot:
    """High-level chatbot that integrates classification and response generation."""

    def __init__(self, config_path: str, question_info: Optional[List[Dict[str, str]]] = None):
        """Initialize underlying chat model and prompt manager."""
        self.chat = ChatCompletionBase(config_path)
        self.prompts = PromptManager(self.chat)
        self._messages: List[Dict[str, str]] = []
        self._previous_Insights: List[str] = []
        self._previous_Summary: List[str] = []
        self._last_context_reset_date: date = datetime.now().date()
        
        # Dummy db attribute - will be properly implemented later
        self.db = None
        
        # Get context window threshold (80% of max input tokens)
        context_info = self.chat.get_model_context_window()
        max_input_tokens = context_info['max_input_tokens']
        self._context_threshold = int(max_input_tokens * 0.7)  # 70% threshold
        self.chat.config['question_info'] = question_info
        # to identify it is first message or not if it is first message then we need to add the user info to the message
        self.initial_message=True

    def classify_category(self, user_query: str, chat_history: Optional[List[Any]] = None) -> str:
        """Return the category label for a message and history."""
        history = chat_history if chat_history is not None else self._messages
        return self.prompts.identify_category(user_query, history)

    def get_specialised_prompt(self, user_query: str, chat_history: Optional[List[Any]] = None) -> str:
        """Return specialised system prompt based on content and context."""
        history = chat_history if chat_history is not None else self._messages
        return self.prompts.get_specialised_prompt(user_query, history)

    def reply(
        self,
        user_query: str,
        chat_history: Optional[List[Any]] = None,
        memory: Any = None,
        **kwargs,
    ) -> str:
        """Generate a reply using specialised prompt, query, and optional memory."""
        self._messages.append({"user": user_query})
        specialised_prompt = self.get_specialised_prompt(
            user_query,
            chat_history if chat_history is not None else None,
        )
        if self.initial_message:
            self.initial_message = False
            analysis_input = Analysis(
                user_query=user_query,
                specialised_prompt=specialised_prompt,
                memory=(memory or {
                    "messages": self._messages if self._messages else None,
                    "previous context": self._previous_Summary if self._previous_Summary else None,
                    "previous insights": self._previous_Insights if self._previous_Insights else None,
                    "question_info": self.chat.config['question_info'] if self.chat.config['question_info'] else None,
                }),
            )
        else:
            analysis_input = Analysis(
                user_query=user_query,
                specialised_prompt=specialised_prompt,
                memory=(memory or {
                    "messages": self._messages if self._messages else None,
                    "previous context": self._previous_Summary if self._previous_Summary else None,
                    "previous insights": self._previous_Insights if self._previous_Insights else None,
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
        self._maybe_summarize()
        return response_text

    def summarize(self, **kwargs) -> str:
        """Summarize internal conversation history for memory."""
        summ_input = Summarise(chat_history={"messages": self._messages})
        summary = self.chat.invoke_model(input=summ_input, request_format={"type": "list", "schema": PersonalSummary}, **kwargs)
        try:
            logger.info("chatbot.summarize.success")
        except Exception:
            pass
        return summary

    def model_info(self) -> Dict:
        """Return underlying model metadata."""
        return self.chat.get_model_info()

    def history(self) -> Dict:
        """Return stored messages and previous context list."""
        return {"messages": list(self._messages), "previous context": list(self._previous_context)}

    def reset(self) -> None:
        """Clear stored history."""
        self._messages = []

    def _maybe_summarize(self) -> None:
        """Summarize when context length exceeds threshold and store as previous context."""
        try:
            # Calculate approximate token count for current context
            current_context_length = self._estimate_context_length()
            
            if current_context_length > self._context_threshold:
                logger.info(f"Context length ({current_context_length}) exceeds threshold ({self._context_threshold}), summarizing...")
                summary_text = self.summarize()
                self._previous_context.append(summary_text.summary)
                self.reset()
        except Exception as e:
            logger.warning(f"Failed to summarize: {e}")
    
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
        
        # Add previous context length
        for context in self._previous_context:
            if isinstance(context, str):
                total_chars += len(context)
        
        # Add system prompt length (approximate)
        # This is a rough estimate - in practice, you might want to get the actual system prompt
        system_prompt_chars = 1000  # Approximate system prompt length
        
        total_chars += system_prompt_chars
        
        # Convert to approximate token count (1 token ≈ 2.5 characters)
        estimated_tokens = total_chars // 2.5
        
        return estimated_tokens

    def _maybe_clear_previous_context(self) -> None:
        """Clear previous context at local midnight only."""
        now = datetime.now()
        if now.date() != self._last_context_reset_date:
            print("trying to find the overall insights of the conversation")
            summary_text = self.summarize(request_format={"type": "list", "schema": ConversationInsights})
            print("summary_text", summary_text)
            self._previous_context.clear()
            self._last_context_reset_date = now.date()
            try:
                logger.info("chatbot.previous_context.cleared_midnight")
            except Exception:
                pass
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

