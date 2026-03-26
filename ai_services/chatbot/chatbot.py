from typing import List, Dict, Optional, Any
import logging
from chat import ChatCompletionBase
from prompt_manager import PromptManager
from custom_promt import SYSTEM_PROMPT_FIRST_MESSAGE
from structures import Analysis, Summarise, PersonalSummary, ConversationInsights, MoodAnalytics
from db import DB

logger = logging.getLogger(__name__)


class ChatBot:
    def __init__(self, config_path: str):
        self.chat = ChatCompletionBase(config_path)
        self.prompts = PromptManager(self.chat)
        self._user_data: Dict[str, Dict[str, Any]] = {}
        self.db = DB()
        context_info = self.chat.get_model_context_window()
        self._context_threshold = int(context_info['max_input_tokens'] * 0.7)

    def _get_user_data(self, user_id: str) -> Dict[str, Any]:
        if user_id not in self._user_data:
            self._user_data[user_id] = {
                'messages': [],
                'previous_insights': [],
                'previous_summary': [],
                'notification': [],
                'initial_message': True
            }
        return self._user_data[user_id]

    def get_initial_message(self, user_id: str) -> str:
        user_data = self._get_user_data(user_id)
        if not user_data['initial_message']:
            return None
        return self.get_reply(user_query="", user_id=user_id)

    def change_initial_message(self):
        for user_id in self._user_data:
            self._user_data[user_id]['initial_message'] = True

    def store_question_info(self, user_id: str, question_info: str):
        self._get_user_data(user_id)['question_info'] = question_info

    def classify_category(self, user_query: str, user_id: str, chat_history: Optional[List[Any]] = None) -> str:
        user_data = self._get_user_data(user_id)
        return self.prompts.identify_category(user_query, chat_history if chat_history is not None else user_data['messages'])

    def get_specialised_prompt(self, user_query: str, user_id: str, chat_history: Optional[List[Any]] = None) -> str:
        user_data = self._get_user_data(user_id)
        return self.prompts.get_specialised_prompt(user_query, chat_history if chat_history is not None else user_data['messages'])

    def get_reply(self, user_query: str, user_id: str, chat_history: Optional[List[Any]] = None, memory: Any = None, **kwargs) -> str:
        user_data = self._get_user_data(user_id)
        user_data['messages'].append({"user": user_query})
        specialised_prompt = self.get_specialised_prompt(user_query, user_id, chat_history)

        if user_data['initial_message']:
            user_data['initial_message'] = False
            analysis_input = Analysis(
                user_query=user_query,
                specialised_prompt=specialised_prompt,
                memory=(memory or {
                    "messages": user_data['messages'] or None,
                    "previous_summary": user_data['previous_summary'] or None,
                    "previous_insights": user_data['previous_insights'] or None,
                    "question_info": user_data.get('question_info') or None,
                }),
            )
            response_text = self.chat.invoke_model(input=analysis_input, system_prompt_override=SYSTEM_PROMPT_FIRST_MESSAGE, **kwargs)
        else:
            analysis_input = Analysis(
                user_query=user_query,
                specialised_prompt=specialised_prompt,
                memory=(memory or {
                    "messages": user_data['messages'] or None,
                    "previous_summary": user_data['previous_summary'] or None,
                    "previous_insights": user_data['previous_insights'] or None,
                }),
            )
            response_text = self.chat.invoke_model(input=analysis_input, **kwargs)

        if user_data['messages']:
            user_data['messages'][-1]["ai"] = response_text
        self.maybe_summarise(user_data)
        return response_text

    def maybe_summarise(self, user_data: Dict[str, Any]) -> None:
        try:
            if self._estimate_context_length(user_data) <= self._context_threshold or not user_data['messages']:
                return
            num_old = max(1, int(len(user_data['messages']) * 0.2))
            old_chunk = user_data['messages'][:num_old]
            user_data['messages'] = user_data['messages'][num_old:]
            result: PersonalSummary = self.chat.invoke_model(
                input=Summarise(chat_history={"messages": old_chunk}),
                request_format={"type": "json", "schema": PersonalSummary, "mime_type": "application/json"},
            )
            if getattr(result, "summary", None):
                user_data['previous_summary'].append(result.summary)
            insights_obj = getattr(result, "insights", None)
            if insights_obj is not None:
                user_data['previous_insights'].append(insights_obj)
                if insights_obj.important_dates:
                    user_data['notification'].append(insights_obj.important_dates)
        except Exception as e:
            logger.warning(f"maybe_summarise failed: {e}")

    def _estimate_context_length(self, user_data: Dict[str, Any]) -> int:
        total_chars = 500
        for msg in user_data['messages']:
            if isinstance(msg, dict):
                total_chars += sum(len(v) for v in msg.values() if isinstance(v, str))
            elif isinstance(msg, str):
                total_chars += len(msg)
        for ctx in user_data['previous_summary']:
            if isinstance(ctx, str):
                total_chars += len(ctx)
        return int(total_chars / 2.5)

    def app_exit(self, user_id: str, real_user_id: str = None) -> tuple:
        try:
            user_data = self._get_user_data(user_id)
            if user_data['messages']:
                result: PersonalSummary = self.chat.invoke_model(
                    input=Summarise(chat_history={"messages": user_data['messages']}),
                    request_format={"type": "json", "schema": PersonalSummary, "mime_type": "application/json"},
                )
                if getattr(result, "summary", None):
                    user_data['previous_summary'].append(result.summary)
                if getattr(result, "insights", None):
                    user_data['previous_insights'].append(result.insights)
                    if result.insights.important_dates:
                        user_data['notification'].append(result.insights.important_dates)
                # Persist summary+insights to PostgreSQL under the real user_id
                try:
                    self.db.insert_local_summary(result, real_user_id or user_id)
                except Exception as e:
                    logger.warning(f"Failed to persist summary to PostgreSQL: {e}")
            notifications_list = self.get_notification(user_data['notification'])
            emotion, sentiment = self.get_emotion_sentiment(user_id)
            user_data['notification'] = []
            user_data['messages'] = []
            try:
                self.db.store_notifications(user_id, notifications_list)
                self.db.store_session(user_id, {"emotion": emotion, "sentiment": sentiment, "notification_count": len(notifications_list)})
            except Exception as e:
                logger.warning(f"MongoDB persist failed for {user_id}: {e}")
            return notifications_list, (emotion, sentiment)
        except Exception as e:
            logger.warning(f"app_exit failed for {user_id}: {e}")
            return [], (None, None)

    def get_mood_analytics(self, user_id: str, days: int = 30) -> MoodAnalytics:
        try:
            mood_data = self.db.get_mood_analytics(days, user_id)
            if not mood_data:
                return MoodAnalytics(mood_history=[], dominant_emotion="neutral", sentiment_trend="neutral", total_days=0)
            emotions = [e['emotion'] for e in mood_data]
            sentiments = [e['sentiment'] for e in mood_data]
            dominant_emotion = max(set(emotions), key=emotions.count)
            pos, neg = sentiments.count('positive'), sentiments.count('negative')
            sentiment_trend = "improving" if pos > neg else "declining" if neg > pos else "stable"
            return MoodAnalytics(mood_history=mood_data, dominant_emotion=dominant_emotion, sentiment_trend=sentiment_trend, total_days=len(mood_data))
        except Exception as e:
            logger.error(f"get_mood_analytics failed for {user_id}: {e}")
            return MoodAnalytics(mood_history=[], dominant_emotion="neutral", sentiment_trend="neutral", total_days=0)

    def get_notification(self, notification: List[Any]) -> List[Dict[str, str]]:
        notification_list = []
        for insight in notification:
            if hasattr(insight, 'important_dates') and insight.important_dates:
                for date_context in insight.important_dates:
                    if not date_context.context:
                        continue
                    timestamp = f"{date_context.date} {date_context.time}" if date_context.time else date_context.date
                    notification_list.append({'timestamp': timestamp, 'notification_message': date_context.context})
        return notification_list

    def get_emotion_sentiment(self, user_id: str) -> tuple:
        user_data = self._get_user_data(user_id)
        if user_data['previous_insights']:
            last = user_data['previous_insights'][-1]
            return last.overall_emotion, last.overall_sentiment
        return None, None

    def get_all_user_ids(self) -> List[str]:
        return list(self._user_data.keys())

    def clear_context_for_all_users(self):
        for user_id in self.get_all_user_ids():
            try:
                self._maybe_clear_previous_context(user_id)
            except Exception as e:
                logger.warning(f"Failed to clear context for {user_id}: {e}")

    def summarize(self, user_id: str, **kwargs) -> PersonalSummary:
        user_data = self._get_user_data(user_id)
        return self.chat.invoke_model(
            input=Summarise(chat_history={"messages": user_data['messages']}),
            request_format={"type": "json", "schema": PersonalSummary, "mime_type": "application/json"},
            **kwargs,
        )

    def _maybe_clear_previous_context(self, user_id: str):
        try:
            user_data = self._get_user_data(user_id)
            daily_summary: PersonalSummary = self.summarize(user_id)
            if getattr(daily_summary, "summary", None):
                user_data['previous_summary'].append(daily_summary.summary)
            if getattr(daily_summary, "insights", None):
                user_data['previous_insights'].append(daily_summary.insights)
            self._remove_and_store_last_40_percent(user_id)
        except Exception as e:
            logger.warning(f"_maybe_clear_previous_context failed for {user_id}: {e}")

    def _remove_and_store_last_40_percent(self, user_id: str):
        user_data = self._get_user_data(user_id)
        min_length = min(len(user_data['previous_summary']), len(user_data['previous_insights']))
        items_to_remove = max(0, int(min_length * 0.4))
        try:
            for i in range(min_length - items_to_remove, min_length):
                self.db.insert_local_summary(
                    PersonalSummary(summary=user_data['previous_summary'][i], insights=user_data['previous_insights'][i]),
                    user_id
                )
        except Exception as e:
            logger.warning(f"_remove_and_store_last_40_percent failed for {user_id}: {e}")
        if items_to_remove > 0:
            user_data['previous_summary'] = user_data['previous_summary'][:-items_to_remove]
            user_data['previous_insights'] = user_data['previous_insights'][:-items_to_remove]

    def hard_reset(self, user_id: str):
        try:
            user_data = self._get_user_data(user_id)
            min_length = min(len(user_data['previous_summary']), len(user_data['previous_insights']))
            for i in range(min_length):
                self.db.insert_local_summary(
                    PersonalSummary(summary=user_data['previous_summary'][i], insights=user_data['previous_insights'][i]),
                    user_id
                )
            if user_data['messages']:
                summary = self.summarize(user_id)
                if summary:
                    self.db.insert_local_summary(summary, user_id)
        except Exception as e:
            logger.warning(f"hard_reset failed for {user_id}: {e}")
        finally:
            user_data = self._get_user_data(user_id)
            user_data['messages'] = []
            user_data['previous_summary'] = []
            user_data['previous_insights'] = []
            user_data['notification'] = []
            user_data['initial_message'] = True

    def model_info(self) -> Dict:
        return self.chat.get_model_info()

    def get_history(self, user_id: str) -> Dict:
        user_data = self._get_user_data(user_id)
        return {
            "messages": list(user_data['messages']),
            "previous summary": list(user_data['previous_summary']),
            "previous insights": list(user_data['previous_insights'])
        }

    def reset(self, user_id: str):
        user_data = self._get_user_data(user_id)
        user_data['messages'] = []
        user_data['previous_summary'] = []
        user_data['previous_insights'] = []
        user_data['notification'] = []
        user_data['initial_message'] = True


__all__ = ["ChatBot"]
