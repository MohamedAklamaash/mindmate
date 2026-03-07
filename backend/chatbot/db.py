import os
import json
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta

import psycopg2
import psycopg2.extras
from dotenv import load_dotenv

from structures import PersonalSummary, ConversationInsights

load_dotenv()
logger = logging.getLogger(__name__)


def _get_pg_conn():
    url = os.environ["POSTGRES_DB_URL"]
    return psycopg2.connect(url)


class ServerDB:
    """PostgreSQL-backed persistent storage for session summaries."""

    def __init__(self):
        self._setup_tables()

    def _setup_tables(self):
        with _get_pg_conn() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS summaries (
                        id SERIAL PRIMARY KEY,
                        user_id TEXT NOT NULL,
                        summary TEXT,
                        insights JSONB,
                        timestamp TIMESTAMPTZ DEFAULT NOW()
                    );
                    CREATE INDEX IF NOT EXISTS idx_summaries_user_id ON summaries(user_id);
                    CREATE INDEX IF NOT EXISTS idx_summaries_timestamp ON summaries(timestamp);
                """)
            conn.commit()

    def insert_summary(self, input: PersonalSummary, user_id: str) -> bool:
        try:
            payload = input.model_dump() if hasattr(input, "model_dump") else input.dict()
            with _get_pg_conn() as conn:
                with conn.cursor() as cur:
                    cur.execute(
                        "INSERT INTO summaries (user_id, summary, insights) VALUES (%s, %s, %s)",
                        (user_id, payload["summary"], json.dumps(payload.get("insights", {})))
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
                    """SELECT summary, insights FROM summaries
                       WHERE user_id = %s AND timestamp >= %s AND timestamp < %s
                       ORDER BY timestamp ASC""",
                    (user_id, start_time, start_of_today)
                )
                rows = cur.fetchall()

        results = []
        for row in rows:
            try:
                insights_payload = row["insights"] if isinstance(row["insights"], dict) else {}
                insights_model = ConversationInsights(**insights_payload)
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
                    """SELECT insights, timestamp FROM summaries
                       WHERE user_id = %s AND timestamp >= %s
                       ORDER BY timestamp DESC""",
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


class DB:
    """Orchestrator: PostgreSQL for summaries, MongoDB for notifications."""

    def __init__(self, config_path: str = None):
        self.local_db = ServerDB()

    def insert_local_summary(self, input: PersonalSummary, user_id: str) -> bool:
        return self.local_db.insert_summary(input, user_id)

    def retreive_local_summary(self, days: int, user_id: str) -> List[PersonalSummary]:
        return self.local_db.get_summaries_last_n_days(days, user_id)

    def delete_local_summary(self, start_date: str, end_date: str, user_id: str) -> int:
        return self.local_db.delete_summaries_in_range(start_date, end_date, user_id)

    def delete_local_summary_days(self, days: int, user_id: str) -> int:
        return self.local_db.delete_summaries_last_n_days(days, user_id)

    def get_mood_analytics(self, days: int, user_id: str) -> List[Dict]:
        return self.local_db.get_mood_analytics(days, user_id)
