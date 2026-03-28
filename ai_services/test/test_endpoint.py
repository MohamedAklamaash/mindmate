
import os
import sys
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

CONFIG_PATH = os.path.join(os.path.dirname(__file__), "..", "chatbot", "config.yaml")
USER_ID = "test_user_ci"
SESSION_ID = "test_session_ci"


@pytest.fixture(scope="module")
def bot():
    from chatbot.chatbot import ChatBot
    return ChatBot(CONFIG_PATH)


# ── Category classification ────────────────────────────────────────────────

@pytest.mark.parametrize("text,expected", [
    ("Hello there!", "NORMAL"),
    ("I'm feeling very stressed at work", "STRESS_AND_ANXIETY_MANAGEMENT"),
    ("I feel so sad and hopeless lately", "DEPRESSION_AND_MOOD_DISORDERS"),
    ("I can't stop drinking alcohol", "ADDICTION_AND_HABIT_CONTROL"),
    ("My relationship with my partner is falling apart", "RELATIONSHIP_AND_SOCIAL_ISSUES"),
    ("I have no confidence in myself", "SELF_ESTEEM_AND_PERSONAL_GROWTH"),
    ("I'm still grieving the loss of my mother", "TRAUMA_AND_GRIEF_SUPPORT"),
    ("I can't sleep at night", "SLEEP_AND_LIFESTYLE_BALANCE"),
])
def test_category_classification(bot, text, expected):
    result = bot.classify_category(text, USER_ID)
    assert result == expected, f"Expected {expected}, got {result} for: {text!r}"


# ── Chat reply ─────────────────────────────────────────────────────────────

def test_get_reply_returns_string(bot):
    reply = bot.get_reply("Hello, I need some support", USER_ID)
    assert isinstance(reply, str) and len(reply) > 0


def test_get_reply_stress(bot):
    reply = bot.get_reply("I'm really anxious about my exams", USER_ID)
    assert isinstance(reply, str) and len(reply) > 0


# ── App exit / session summary ─────────────────────────────────────────────

def test_app_exit_returns_tuple(bot):
    # Seed a message so there's something to summarise
    bot.get_reply("I've been feeling overwhelmed lately", USER_ID)
    notifications, emotion_sentiment = bot.app_exit(USER_ID, real_user_id=USER_ID)
    assert isinstance(notifications, list)
    assert isinstance(emotion_sentiment, tuple) and len(emotion_sentiment) == 2


# ── Mood analytics ─────────────────────────────────────────────────────────

def test_get_mood_analytics_structure(bot):
    from chatbot.structures import MoodAnalytics
    result = bot.get_mood_analytics(USER_ID, days=30)
    assert isinstance(result, MoodAnalytics)
    assert hasattr(result, "mood_history")
    assert hasattr(result, "dominant_emotion")
    assert hasattr(result, "sentiment_trend")


# ── DB user upsert ─────────────────────────────────────────────────────────

def test_db_upsert_and_get_user(bot):
    bot.db.upsert_user(USER_ID, "CI Test User")
    user = bot.db.get_user(USER_ID)
    assert user is not None
    assert user["user_id"] == USER_ID


# ── Session DB ─────────────────────────────────────────────────────────────

def test_session_create_and_list(bot):
    sid = bot.db.create_session(USER_ID, title="CI test session")
    assert isinstance(sid, str) and len(sid) > 0
    sessions = bot.db.get_sessions(USER_ID)
    assert any(s["id"] == sid for s in sessions)
    bot.db.delete_session(sid)
