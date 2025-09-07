import os
import sqlite3
import shutil
import json
import firebase_admin
from firebase_admin import credentials, firestore
from typing import Dict, Any, List, Optional

class FireBaseDB:
    def __init__(self, config_file_path: str):
        self.config_file_path = config_file_path
        self.local_db_path = os.path.join('.cache', 'local_db.sqlite')
        self.cache_dir = '.cache'
        self.db = None
        self.local_conn = None
        self._initialize_firebase()
        self._setup_local_db()
    
    def _initialize_firebase(self):
        if not firebase_admin._apps:
            cred = credentials.Certificate(self.config_file_path)
            firebase_admin.initialize_app(cred)
        self.db = firestore.client()
    
    def _setup_local_db(self):
        os.makedirs(self.cache_dir, exist_ok=True)
        self.local_conn = sqlite3.connect(self.local_db_path)
        cursor = self.local_conn.cursor()
        
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS conversations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            conversation_id TEXT UNIQUE,
            user_id TEXT,
            message TEXT,
            response TEXT,
            date TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            synced BOOLEAN DEFAULT 0
        )
        ''')
        
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT UNIQUE,
            data TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            synced BOOLEAN DEFAULT 0
        )
        ''')
        
        self.local_conn.commit()
    
    def clear_cache_directory(self):
        if os.path.exists(self.cache_dir):
            shutil.rmtree(self.cache_dir)
            os.makedirs(self.cache_dir)
            self._setup_local_db()
    
    def insert_conversation_local(self, conversation_id: str, user_id: str, message: str, response: str, date: Optional[str] = None):
        cursor = self.local_conn.cursor()
        if date is None:
            from datetime import datetime
            date = datetime.now().strftime('%d-%m-%Y')
        cursor.execute('''
        INSERT OR REPLACE INTO conversations (conversation_id, user_id, message, response, date)
        VALUES (?, ?, ?, ?, ?)
        ''', (conversation_id, user_id, message, response, date))
        self.local_conn.commit()
    
    def insert_user_data_local(self, user_id: str, data: Dict[str, Any]):
        cursor = self.local_conn.cursor()
        cursor.execute('''
        INSERT OR REPLACE INTO user_data (user_id, data)
        VALUES (?, ?)
        ''', (user_id, json.dumps(data)))
        self.local_conn.commit()
    
    def get_unsynced_conversations(self) -> List[tuple]:
        cursor = self.local_conn.cursor()
        cursor.execute('SELECT * FROM conversations WHERE synced = 0')
        return cursor.fetchall()
    
    def get_unsynced_user_data(self) -> List[tuple]:
        cursor = self.local_conn.cursor()
        cursor.execute('SELECT * FROM user_data WHERE synced = 0')
        return cursor.fetchall()
    
    def mark_conversation_synced(self, conversation_id: int):
        cursor = self.local_conn.cursor()
        cursor.execute('UPDATE conversations SET synced = 1 WHERE id = ?', (conversation_id,))
        self.local_conn.commit()
    
    def mark_user_data_synced(self, user_data_id: int):
        cursor = self.local_conn.cursor()
        cursor.execute('UPDATE user_data SET synced = 1 WHERE id = ?', (user_data_id,))
        self.local_conn.commit()
    
    def sync_local_to_cloud(self):
        conversations = self.get_unsynced_conversations()
        for conv in conversations:
            conv_id, conversation_id, user_id, message, response, date, timestamp, _ = conv
            doc_ref = self.db.collection('conversations').document(str(conversation_id))
            doc_ref.set({
                'conversation_id': conversation_id,
                'user_id': user_id,
                'message': message,
                'response': response,
                'date': date,
                'timestamp': timestamp
            })
            self.mark_conversation_synced(conv_id)
        
        user_data = self.get_unsynced_user_data()
        for user in user_data:
            user_data_id, user_id, data, timestamp, _ = user
            doc_ref = self.db.collection('user_data').document(str(user_data_id))
            doc_ref.set({
                'user_id': user_id,
                'data': json.loads(data),
                'timestamp': timestamp
            })
            self.mark_user_data_synced(user_data_id)
    
    def add_document_to_cloud(self, collection: str, doc_id: str, data: Dict[str, Any]):
        doc_ref = self.db.collection(collection).document(doc_id)
        doc_ref.set(data)
    
    def get_document_from_cloud(self, collection: str, doc_id: str) -> Optional[Dict[str, Any]]:
        doc_ref = self.db.collection(collection).document(doc_id)
        doc = doc_ref.get()
        return doc.to_dict() if doc.exists else None
    
    def update_document_in_cloud(self, collection: str, doc_id: str, data: Dict[str, Any]):
        doc_ref = self.db.collection(collection).document(doc_id)
        doc_ref.update(data)
    
    def delete_document_from_cloud(self, collection: str, doc_id: str):
        doc_ref = self.db.collection(collection).document(doc_id)
        doc_ref.delete()
    
    def query_collection_cloud(self, collection: str, field: str, operator: str, value: Any) -> List[Dict[str, Any]]:
        docs = self.db.collection(collection).where(field, operator, value).stream()
        return [doc.to_dict() for doc in docs]
    
    def get_all_documents_cloud(self, collection: str) -> List[Dict[str, Any]]:
        docs = self.db.collection(collection).stream()
        return [doc.to_dict() for doc in docs]
    
    def close_connection(self):
        if self.local_conn:
            self.local_conn.close()