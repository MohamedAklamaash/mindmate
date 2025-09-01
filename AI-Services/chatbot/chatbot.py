from typing import List, Dict, Optional, Any
from datetime import datetime, date
import logging
from chat import ChatCompletionBase
from prompt_manager import PromptManager
from structures import Analysis, Summarise, ConversationInsights

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
        self._previous_context: List[str] = []
        self._reply_count: int = 0
        self._summary_threshold: int = int(self.chat.config.get("summary_threshold", 11))
        self._last_context_reset_date: date = datetime.now().date()

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
        analysis_input = Analysis(
            user_query=user_query,
            specialised_prompt=specialised_prompt,
            memory=(memory or {
                "messages": self._messages,
                "previous context": self._previous_context,
            }),
        )
        response_text = self.chat.invoke_model(analysis_input, **kwargs)
        try:
            sp_preview = specialised_prompt[:80] if isinstance(specialised_prompt, str) else str(type(specialised_prompt))
            rt_preview = response_text[:80] if isinstance(response_text, str) else str(type(response_text))
            logger.info(f"chatbot.reply user_query={user_query} specialised_prompt={sp_preview} response_text={rt_preview}")
        except Exception:
            pass
        if self._messages:
            self._messages[-1]["ai"] = response_text
        self._reply_count += 1
        self._maybe_summarize()
        self._maybe_clear_previous_context()
        return response_text

    def summarize(self, **kwargs) -> str:
        """Summarize internal conversation history for memory."""
        summ_input = Summarise(chat_history={"messages": self._messages})
        summary = self.chat.invoke_model(summ_input, **kwargs)
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
        """Clear stored history and counters."""
        self._messages = []
        self._reply_count = 0

    def _maybe_summarize(self) -> None:
        """Summarize when reply count reaches threshold and store as previous context."""
        if self._summary_threshold <= 0:
            return
        if self._reply_count % self._summary_threshold != 0:
            return
        try:
            summary_text = self.summarize()
            self._previous_context.append(summary_text)
            self.reset()
        except Exception:
            pass

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
    bot._summary_threshold = 2

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

