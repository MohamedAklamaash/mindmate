import os
import sqlite3
import json
import shutil
import firebase_admin
from firebase_admin import credentials, firestore
from typing import Dict, Any, List, Optional
from .structures import PersonalSummary, ConversationInsights
import yaml
from datetime import datetime

class ServerDB:
    def __init__(self, config_path: str):
        """
        Initialize LocalDB with config file path.
        Uses local_db_path from config.yaml.
        Ensures the directory for the database exists.
        """
        self.config_path = config_path

        # Load config and get local_db_path
        with open(self.config_path, "r") as f:
            config = yaml.safe_load(f)
        self.local_db_path = config.get("local_db_path", ".cache/local_db.sqlite")

        # Ensure the directory for the database exists, falling back to /tmp on read-only FS (e.g., Vercel)
        db_dir = os.path.dirname(self.local_db_path)
        try:
            if db_dir and not os.path.exists(db_dir):
                os.makedirs(db_dir, exist_ok=True)
            target_db_path = self.local_db_path
        except Exception:
            # Read-only or permission error → use /tmp which is writable in serverless
            fallback_dir = os.path.join("/tmp", "mindmate")
            os.makedirs(fallback_dir, exist_ok=True)
            target_db_path = os.path.join(fallback_dir, "local_db.sqlite")
            self.local_db_path = target_db_path

        # Connect to SQLite database
        self.conn = sqlite3.connect(target_db_path)
        self._setup_tables()

    def _setup_tables(self):
        cursor = self.conn.cursor()
        # Table for summaries (now includes user_id)
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS summaries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT,
                summary TEXT,
                insights TEXT,
                timestamp TEXT
            )
        ''')
        self.conn.commit()

    def insert_summary(self, input: PersonalSummary, user_id: str):
        """
        Insert a record into `summaries` using an input that follows the
        `PersonalSummary` structure (has fields `summary` and `insights`), and user_id.

        - Adds a `timestamp` field (ISO string)
        - Persists into columns: (user_id TEXT, summary TEXT, insights TEXT, timestamp TEXT)
        - Returns True if successful, False otherwise
        """
        try:
            timestamp_value = datetime.now().isoformat()
            # input is guaranteed to be PersonalSummary
            if hasattr(input, "model_dump") and callable(getattr(input, "model_dump")):
                payload = input.model_dump()
            else:
                payload = input.dict()
            cursor = self.conn.cursor()
            cursor.execute(
                '''
                INSERT INTO summaries (user_id, summary, insights, timestamp)
                VALUES (?, ?, ?, ?)
                ''',
                (user_id, payload["summary"], json.dumps(payload.get("insights", {})), timestamp_value)
            )
            self.conn.commit()
            return True
        except Exception:
            return False

    def get_summaries_last_n_days(self, days: int, user_id: str) -> List[PersonalSummary]:
        """
        Return a list of PersonalSummary for the last `days` days excluding today for a specific user.
        Example: if today is Sep 5 and days=4, returns data from Sep 1 00:00
        up to (but not including) Sep 5 00:00, ordered from oldest to newest.
        """
        from datetime import datetime, timedelta

        # Calculate time window [start, end)
        now = datetime.now()
        start_of_today = now.replace(hour=0, minute=0, second=0, microsecond=0)
        start_time = start_of_today - timedelta(days=days)
        end_time = start_of_today

        start_iso = start_time.isoformat()
        end_iso = end_time.isoformat()

        cursor = self.conn.cursor()
        cursor.execute(
            '''
            SELECT summary, insights, timestamp
            FROM summaries
            WHERE user_id = ? AND timestamp >= ? AND timestamp < ?
            ORDER BY timestamp ASC
            ''',
            (user_id, start_iso, end_iso)
        )
        rows = cursor.fetchall()

        results: List[PersonalSummary] = []
        for summary_text, insights_text, _ts in rows:
            try:
                insights_payload = json.loads(insights_text) if insights_text else {}
                # Build ConversationInsights safely; allow partial dicts
                insights_model = ConversationInsights(**insights_payload) if isinstance(insights_payload, dict) else ConversationInsights()
            except Exception:
                insights_model = ConversationInsights()
            results.append(PersonalSummary(summary=summary_text or "", insights=insights_model))

        return results

    def delete_summaries_last_n_days(self, days: int, user_id: str) -> int:
        """
        Delete summaries from the last `days` days excluding today for a specific user.
        Returns the number of rows deleted.
        """
        from datetime import datetime, timedelta

        now = datetime.now()
        start_of_today = now.replace(hour=0, minute=0, second=0, microsecond=0)
        start_time = start_of_today - timedelta(days=days)
        end_time = start_of_today

        start_iso = start_time.isoformat()
        end_iso = end_time.isoformat()

        cursor = self.conn.cursor()
        cursor.execute(
            '''
            DELETE FROM summaries
            WHERE user_id = ? AND timestamp >= ? AND timestamp < ?
            ''',
            (user_id, start_iso, end_iso)
        )
        deleted_count = cursor.rowcount
        self.conn.commit()
        return deleted_count

    def delete_summaries_in_range(self, start_date: str, end_date: str, user_id: str) -> int:
        """
        Delete summaries between start_date and end_date (inclusive of the end day) for a specific user.
        Input format: 'dd-mm-YYYY' (e.g., '01-09-2025').
        The function converts these to ISO timestamps at 00:00:00 and deletes in the
        range [start_date 00:00, (end_date + 1 day) 00:00).
        Returns the number of rows deleted.
        """
        from datetime import datetime, timedelta

        # Parse dd-mm-YYYY and normalize to start-of-day ISO strings
        start_dt = datetime.strptime(start_date, "%d-%m-%Y").replace(hour=0, minute=0, second=0, microsecond=0)
        # end is inclusive day, so move to next day's start to make upper bound exclusive
        end_dt = datetime.strptime(end_date, "%d-%m-%Y").replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=1)

        start_iso = start_dt.isoformat()
        end_iso = end_dt.isoformat()

        cursor = self.conn.cursor()
        cursor.execute(
            '''
            DELETE FROM summaries
            WHERE user_id = ? AND timestamp >= ? AND timestamp < ?
            ''',
            (user_id, start_iso, end_iso)
        )
        deleted_count = cursor.rowcount
        self.conn.commit()
        return deleted_count

class CloudDB:
    def __init__(self, config_path: str):
        """
        Initialize Firestore using firebase-admin.
        Reads Firebase config from config.yaml (uses projectId). If a service account
        JSON is available via GOOGLE_APPLICATION_CREDENTIALS, it will be used.
        """
        self.config_path = config_path
        with open(self.config_path, "r") as f:
            config = yaml.safe_load(f)

        firebase_cfg = (config or {}).get("firebase", {}) or {}
        self.project_id = firebase_cfg.get("projectId")

        # Initialize app if not already initialized
        if not firebase_admin._apps:
            cred: Optional[credentials.Base] = None
            try:
                # Prefer explicit service account via env var if present
                cred = credentials.ApplicationDefault()
            except Exception:
                cred = None

            if cred is not None:
                firebase_admin.initialize_app(cred, {"projectId": self.project_id} if self.project_id else None)
            else:
                # Fall back to no credentials (use metadata server or emulator)
                firebase_admin.initialize_app(options={"projectId": self.project_id} if self.project_id else None)

        try:
            self.client = firestore.client()
            self.collection_name = "summary"
        except Exception as e:
            print(f"Warning: Could not initialize Firestore client: {e}")
            self.client = None
            self.collection_name = "summary"

    def insert_summary(self, input: PersonalSummary, user_id: str) -> bool:
        try:
            if self.client is None:
                print("Warning: Firestore client not available, skipping cloud insert")
                return False
                
            if hasattr(input, "model_dump") and callable(getattr(input, "model_dump")):
                payload = input.model_dump()
            else:
                payload = input.dict()

            doc = {
                "user_id": user_id,
                "summary": payload.get("summary", ""),
                "insights": payload.get("insights", {}),
                "timestamp": payload.get("timestamp", None)
            }
            self.client.collection(self.collection_name).add(doc)
            return True
        except Exception:
            return False

class DB:
    def __init__(self, config_path: str):
        """
        Orchestrator DB that wires both LocalDB and CloudDB. Takes a config path
        and initializes both databases.
        """
        self.config_path = config_path
        self.local_db = ServerDB(config_path)
        self.cloud_db = None

    def insert_local_summary(self, input: PersonalSummary, user_id: str) -> bool:
        return self.local_db.insert_summary(input, user_id)

    def retreive_local_summary(self, days: int, user_id: str) -> List[PersonalSummary]:
        return self.local_db.get_summaries_last_n_days(days, user_id)

    def to_cloud(self, days: int, user_id: str) -> int:
        """
        Upload the last `days` days (excluding today) of local summaries for `user_id`
        into Firestore collection `summary`. Returns number of inserted documents.
        """
        summaries = self.local_db.get_summaries_last_n_days(days, user_id)
        inserted = 0
        for summary in summaries:
            ok = self.cloud_db.insert_summary(summary, user_id)
            if ok:
                inserted += 1
        return inserted

    def delete_local_summary(self, start_date: str, end_date: str, user_id: str) -> int:
        return self.local_db.delete_summaries_in_range(start_date, end_date, user_id)

    def delete_local_summary_days(self, days: int, user_id: str) -> int:
        return self.local_db.delete_summaries_last_n_days(days, user_id)