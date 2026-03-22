import os
import json
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta

import psycopg2
import psycopg2.extras
from pymongo import MongoClient
from bson import ObjectId
from dotenv import load_dotenv

from structures import PersonalSummary, ConversationInsights

load_dotenv()
logger = logging.getLogger(__name__)


def _get_pg_conn():
    return psycopg2.connect(os.environ["POSTGRES_DB_URL"])


def _get_mongo_db():
    return MongoClient(os.environ["MONGODB_URL"]).get_default_database()


class ServerDB:
    def __init__(self):
        self._setup_tables()

    def _setup_tables(self):
        with _get_pg_conn() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS summaries (
                        id SERIAL PRIMARY KEY,
                        user_id TEXT NOT NULL,
                        session_id TEXT,
                        summary TEXT,
                        insights JSONB,
                        timestamp TIMESTAMPTZ DEFAULT NOW()
                    );
                    CREATE INDEX IF NOT EXISTS idx_summaries_user_id ON summaries(user_id);
                    CREATE INDEX IF NOT EXISTS idx_summaries_timestamp ON summaries(timestamp);
                    CREATE TABLE IF NOT EXISTS users (
                        user_id TEXT PRIMARY KEY,
                        name TEXT NOT NULL,
                        created_at TIMESTAMPTZ DEFAULT NOW(),
                        last_seen TIMESTAMPTZ DEFAULT NOW()
                    );
                """)
            conn.commit()

    def upsert_user(self, user_id: str, name: str):
        with _get_pg_conn() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO users (user_id, name) VALUES (%s, %s)
                    ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name, last_seen = NOW()
                """, (user_id, name))
            conn.commit()

    def get_user(self, user_id: str) -> Optional[Dict]:
        with _get_pg_conn() as conn:
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                cur.execute("SELECT * FROM users WHERE user_id = %s", (user_id,))
                row = cur.fetchone()
        return dict(row) if row else None

    def insert_summary(self, input: PersonalSummary, user_id: str, session_id: str = None) -> bool:
        try:
            payload = input.model_dump() if hasattr(input, "model_dump") else input.dict()
            with _get_pg_conn() as conn:
                with conn.cursor() as cur:
                    cur.execute(
                        "INSERT INTO summaries (user_id, session_id, summary, insights) VALUES (%s, %s, %s, %s)",
                        (user_id, session_id, payload["summary"], json.dumps(payload.get("insights", {})))
                    )
                conn.commit()
            return True
        except Exception as e:
            logger.warning(f"insert_summary failed: {e}")
            return False

    def get_summaries_last_n_days(self, days: int, user_id: str) -> List[PersonalSummary]:
        now = datetime.now()
        start_of_today = now.replace(hour=0, minute=0, second=0, microsecond=0)
        start_time = start_of_today - timedelta(days=days)
        with _get_pg_conn() as conn:
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                cur.execute(
                    "SELECT summary, insights FROM summaries WHERE user_id = %s AND timestamp >= %s AND timestamp < %s ORDER BY timestamp ASC",
                    (user_id, start_time, start_of_today)
                )
                rows = cur.fetchall()
        results = []
        for row in rows:
            try:
                insights_model = ConversationInsights(**(row["insights"] if isinstance(row["insights"], dict) else {}))
            except Exception:
                insights_model = ConversationInsights()
            results.append(PersonalSummary(summary=row["summary"] or "", insights=insights_model))
        return results

    def delete_summaries_last_n_days(self, days: int, user_id: str) -> int:
        now = datetime.now()
        start_of_today = now.replace(hour=0, minute=0, second=0, microsecond=0)
        start_time = start_of_today - timedelta(days=days)
        with _get_pg_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "DELETE FROM summaries WHERE user_id = %s AND timestamp >= %s AND timestamp < %s",
                    (user_id, start_time, start_of_today)
                )
                deleted = cur.rowcount
            conn.commit()
        return deleted

    def get_mood_analytics(self, days: int, user_id: str) -> List[Dict]:
        start_time = datetime.now() - timedelta(days=days)
        with _get_pg_conn() as conn:
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                cur.execute(
                    "SELECT insights, timestamp FROM summaries WHERE user_id = %s AND timestamp >= %s ORDER BY timestamp DESC",
                    (user_id, start_time)
                )
                rows = cur.fetchall()
        mood_data = []
        for row in rows:
            try:
                insights = row["insights"] if isinstance(row["insights"], dict) else {}
                if insights.get("overall_emotion") and insights.get("overall_sentiment"):
                    mood_data.append({
                        "date": row["timestamp"].strftime("%Y-%m-%d"),
                        "emotion": insights["overall_emotion"],
                        "sentiment": insights["overall_sentiment"],
                    })
            except Exception:
                continue
        return mood_data

    def delete_summaries_in_range(self, start_date: str, end_date: str, user_id: str) -> int:
        start_dt = datetime.strptime(start_date, "%d-%m-%Y")
        end_dt = datetime.strptime(end_date, "%d-%m-%Y") + timedelta(days=1)
        with _get_pg_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "DELETE FROM summaries WHERE user_id = %s AND timestamp >= %s AND timestamp < %s",
                    (user_id, start_dt, end_dt)
                )
                deleted = cur.rowcount
            conn.commit()
        return deleted


class SessionDB:
    """MongoDB-backed storage for chat sessions, messages, and notifications."""

    def create_session(self, user_id: str, title: str = "New Chat") -> str:
        db = _get_mongo_db()
        result = db.chat_sessions.insert_one({
            "user_id": user_id,
            "title": title,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "emotion": None,
            "sentiment": None,
            "messages": [],
        })
        return str(result.inserted_id)

    def get_sessions(self, user_id: str) -> List[Dict]:
        db = _get_mongo_db()
        sessions = list(db.chat_sessions.find(
            {"user_id": user_id},
            {"messages": 0}
        ).sort("updated_at", -1))
        for s in sessions:
            s["id"] = str(s.pop("_id"))
        return sessions

    def get_session_messages(self, session_id: str) -> List[Dict]:
        db = _get_mongo_db()
        doc = db.chat_sessions.find_one({"_id": ObjectId(session_id)}, {"messages": 1})
        return doc.get("messages", []) if doc else []

    def append_message(self, session_id: str, message: Dict):
        db = _get_mongo_db()
        db.chat_sessions.update_one(
            {"_id": ObjectId(session_id)},
            {"$push": {"messages": {**message, "ts": datetime.utcnow()}},
             "$set": {"updated_at": datetime.utcnow()}}
        )

    def update_session_meta(self, session_id: str, emotion: str = None, sentiment: str = None, title: str = None):
        update = {"updated_at": datetime.utcnow()}
        if emotion is not None:
            update["emotion"] = emotion
        if sentiment is not None:
            update["sentiment"] = sentiment
        if title is not None:
            update["title"] = title
        db = _get_mongo_db()
        db.chat_sessions.update_one({"_id": ObjectId(session_id)}, {"$set": update})

    def delete_session(self, session_id: str):
        db = _get_mongo_db()
        db.chat_sessions.delete_one({"_id": ObjectId(session_id)})

    def store_notifications(self, user_id: str, session_id: str, notifications: List[Dict]) -> bool:
        try:
            if not notifications:
                return True
            db = _get_mongo_db()
            docs = [{"user_id": user_id, "session_id": session_id, "created_at": datetime.utcnow(), **n} for n in notifications]
            db.notifications.insert_many(docs)
            return True
        except Exception as e:
            logger.warning(f"store_notifications failed: {e}")
            return False

    def get_notifications(self, user_id: str, limit: int = 50) -> List[Dict]:
        try:
            db = _get_mongo_db()
            return list(db.notifications.find({"user_id": user_id}, {"_id": 0}).sort("created_at", -1).limit(limit))
        except Exception as e:
            logger.warning(f"get_notifications failed: {e}")
            return []


class DB:
    def __init__(self, config_path: str = None):
        self.local_db = ServerDB()
        self.session_db = SessionDB()

    def upsert_user(self, user_id: str, name: str):
        return self.local_db.upsert_user(user_id, name)

    def get_user(self, user_id: str) -> Optional[Dict]:
        return self.local_db.get_user(user_id)

    def insert_local_summary(self, input: PersonalSummary, user_id: str, session_id: str = None) -> bool:
        return self.local_db.insert_summary(input, user_id, session_id)

    def retreive_local_summary(self, days: int, user_id: str) -> List[PersonalSummary]:
        return self.local_db.get_summaries_last_n_days(days, user_id)

    def delete_local_summary(self, start_date: str, end_date: str, user_id: str) -> int:
        return self.local_db.delete_summaries_in_range(start_date, end_date, user_id)

    def delete_local_summary_days(self, days: int, user_id: str) -> int:
        return self.local_db.delete_summaries_last_n_days(days, user_id)

    def get_mood_analytics(self, days: int, user_id: str) -> List[Dict]:
        return self.local_db.get_mood_analytics(days, user_id)

    # Session passthrough
    def create_session(self, user_id: str, title: str = "New Chat") -> str:
        return self.session_db.create_session(user_id, title)

    def get_sessions(self, user_id: str) -> List[Dict]:
        return self.session_db.get_sessions(user_id)

    def get_session_messages(self, session_id: str) -> List[Dict]:
        return self.session_db.get_session_messages(session_id)

    def append_message(self, session_id: str, message: Dict):
        return self.session_db.append_message(session_id, message)

    def update_session_meta(self, session_id: str, **kwargs):
        return self.session_db.update_session_meta(session_id, **kwargs)

    def delete_session(self, session_id: str):
        return self.session_db.delete_session(session_id)

    def store_notifications(self, user_id: str, session_id: str, notifications: List[Dict]) -> bool:
        return self.session_db.store_notifications(user_id, session_id, notifications)

    def get_notifications(self, user_id: str, limit: int = 50) -> List[Dict]:
        return self.session_db.get_notifications(user_id, limit)
