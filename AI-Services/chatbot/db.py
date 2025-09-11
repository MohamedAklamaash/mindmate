import os
import sqlite3
import shutil
import json
import firebase_admin
from firebase_admin import credentials, firestore
from typing import Dict, Any, List, Optional
from structures import PersonalSummary, ConversationInsights
import yaml
from datetime import datetime

class LocalDB:
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

        # Ensure the directory for the database exists
        db_dir = os.path.dirname(self.local_db_path)
        if db_dir and not os.path.exists(db_dir):
            os.makedirs(db_dir, exist_ok=True)

        # Connect to SQLite database
        self.conn = sqlite3.connect(self.local_db_path)
        self._setup_tables()

    def _setup_tables(self):
        cursor = self.conn.cursor()
        # Table for summaries (single table, no distinction between personal/final)
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS summaries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                summary TEXT,
                insights TEXT,
                timestamp TEXT
            )
        ''')
        self.conn.commit()

    def insert_summary(self, input: PersonalSummary):
        """
        Insert a record into `summaries` using an input that follows the
        `PersonalSummary` structure (has fields `summary` and `insights`).

        - Adds a `timestamp` field (ISO string)
        - Persists into columns: (summary TEXT, insights TEXT, timestamp TEXT)
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
                INSERT INTO summaries (summary, insights, timestamp)
                VALUES (?, ?, ?)
                ''',
                (payload["summary"], json.dumps(payload.get("insights", {})), timestamp_value)
            )
            self.conn.commit()
            return True
        except Exception:
            return False

    def get_summaries_last_n_days(self, days: int) -> List[PersonalSummary]:
        """
        Return a list of PersonalSummary for the last `days` days excluding today.
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
            WHERE timestamp >= ? AND timestamp < ?
            ORDER BY timestamp ASC
            ''',
            (start_iso, end_iso)
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
    
    def delete_summaries_last_n_days(self, days: int) -> int:
        """
        Delete summaries from the last `days` days excluding today.
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
            WHERE timestamp >= ? AND timestamp < ?
            ''',
            (start_iso, end_iso)
        )
        deleted_count = cursor.rowcount
        self.conn.commit()
        return deleted_count

    def delete_summaries_in_range(self, start_date: str, end_date: str) -> int:
        """
        Delete summaries between start_date and end_date (inclusive of the end day).
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
            WHERE timestamp >= ? AND timestamp < ?
            ''',
            (start_iso, end_iso)
        )
        deleted_count = cursor.rowcount
        self.conn.commit()
        return deleted_count

class CloudDB:
    def __init__(self):
        pass
class DB:
    def __init__(self, config_path: str):
        """
        Orchestrator DB that wires both LocalDB and CloudDB. Takes a config path
        and initializes the local database using it. CloudDB is kept as a stub
        per current requirements.
        """
        self.config_path = config_path
        self.local_db = LocalDB(config_path)
        self.cloud_db = CloudDB()

    def insert_local_summary(self, input: PersonalSummary) -> bool:
        return self.local_db.insert_summary(input)

    def insert_cloud_summary(self, input: PersonalSummary):
        pass

    def retreive_local_summary(self, days: int) -> List[PersonalSummary]:
        return self.local_db.get_summaries_last_n_days(days)

    def retreive_cloud_summary(self, days: int):
        pass

    def retrieve_cloud_info(self, *args, **kwargs):
        pass

    def local_to_cloud(self , *args, **kwargs):
        pass
    
    def cloud_to_local(self, *args, **kwargs):
        pass

    def delete_local_summary(self, start_date: str, end_date: str) -> int:
        return self.local_db.delete_summaries_in_range(start_date, end_date)

    def delete_local_summary_days(self, days: int) -> int:
        return self.local_db.delete_summaries_last_n_days(days)