from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime, timedelta
from chatbot import ChatBot
import os
import yaml
import tempfile
from google import genai
from typing import Any, Optional
import threading
import time
from dotenv import load_dotenv
from langchain_community.document_loaders import PyPDFLoader, TextLoader, Docx2txtLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter

load_dotenv()

cfg_path = os.path.join(os.path.dirname(__file__), "config.yaml")
try:
    with open(cfg_path, "r") as f:
        cfg = yaml.safe_load(f)
except Exception:
    cfg = {}

cfg['api_key'] = os.environ.get('GOOGLE_API_KEY', cfg.get('api_key', ''))

bot = ChatBot(cfg_path)

app = FastAPI(title="MindMate API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    message: str
    user_id: str
    session_id: str

class ChatResponse(BaseModel):
    reply: str

class UserIdRequest(BaseModel):
    user_id: str

class SessionRequest(BaseModel):
    user_id: str
    session_id: str

class CreateSessionRequest(BaseModel):
    user_id: str
    title: Optional[str] = "New Chat"

class RegisterRequest(BaseModel):
    user_id: str
    name: str

class EmotionRequest(BaseModel):
    emotion: Any

class EmotionReplyResponse(BaseModel):
    quote: str
    author: str
    thought: str


def _schedule(fn, label):
    while True:
        now = datetime.now()
        sleep_secs = ((now.replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=1)) - now).total_seconds()
        time.sleep(sleep_secs)
        try:
            fn()
        except Exception as e:
            print(f"{label} error: {e}")

threading.Thread(target=_schedule, args=(bot.change_initial_message, "change_initial_message"), daemon=True).start()
threading.Thread(target=_schedule, args=(bot.clear_context_for_all_users, "clear_context"), daemon=True).start()


@app.get("/")
async def root():
    return {"status": "running", "timestamp": str(datetime.now())}

@app.get("/info")
async def model_info():
    return bot.model_info()


# ── User ──────────────────────────────────────────────────────────────────────

@app.post("/register")
async def register(req: RegisterRequest):
    try:
        bot.db.upsert_user(req.user_id, req.name)
        return {"status": "ok", "user_id": req.user_id}
    except Exception as e:
        return {"status": "error", "error": str(e)}

@app.post("/get-user")
async def get_user(req: UserIdRequest):
    try:
        user = bot.db.get_user(req.user_id)
        return {"user": user, "user_id": req.user_id}
    except Exception as e:
        return {"status": "error", "error": str(e)}


# ── Sessions ──────────────────────────────────────────────────────────────────

@app.post("/create-session")
async def create_session(req: CreateSessionRequest):
    try:
        session_id = bot.db.create_session(req.user_id, req.title)
        return {"session_id": session_id, "user_id": req.user_id}
    except Exception as e:
        return {"status": "error", "error": str(e)}

@app.post("/get-sessions")
async def get_sessions(req: UserIdRequest):
    try:
        sessions = bot.db.get_sessions(req.user_id)
        return {"sessions": sessions, "user_id": req.user_id}
    except Exception as e:
        return {"status": "error", "error": str(e)}

@app.post("/delete-session")
async def delete_session(req: SessionRequest):
    try:
        bot.db.delete_session(req.session_id)
        bot.reset(req.session_id)
        return {"status": "ok"}
    except Exception as e:
        return {"status": "error", "error": str(e)}

@app.post("/get-session-messages")
async def get_session_messages(req: SessionRequest):
    try:
        messages = bot.db.get_session_messages(req.session_id)
        return {"messages": messages, "session_id": req.session_id}
    except Exception as e:
        return {"status": "error", "error": str(e)}


# ── Chat ──────────────────────────────────────────────────────────────────────

@app.post("/get-initial-message")
async def get_initial_message(req: SessionRequest):
    try:
        msg = bot.get_initial_message(req.session_id)
        if msg:
            bot.db.append_message(req.session_id, {"ai": msg})
        return {"message": msg, "session_id": req.session_id, "timestamp": str(datetime.now())}
    except Exception as e:
        return {"status": "error", "error": str(e)}

@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(req: ChatRequest):
    try:
        bot.db.append_message(req.session_id, {"user": req.message})
        reply = bot.get_reply(req.message, req.session_id)
        bot.db.append_message(req.session_id, {"ai": reply})
        # Auto-title session from first user message
        sessions = bot.db.get_sessions(req.user_id)
        session = next((s for s in sessions if s["id"] == req.session_id), None)
        if session and session.get("title") == "New Chat":
            bot.db.update_session_meta(req.session_id, title=req.message[:40])
        return ChatResponse(reply=reply)
    except Exception as e:
        return ChatResponse(reply="Sorry, I encountered an error. Please try again.")

@app.post("/app-exit")
async def app_exit(req: SessionRequest):
    try:
        notifications, emotion_sentiment = bot.app_exit(req.session_id, req.user_id)
        emotion, sentiment = emotion_sentiment if emotion_sentiment else (None, None)
        bot.db.update_session_meta(req.session_id, emotion=emotion, sentiment=sentiment)
        bot.db.store_notifications(req.user_id, req.session_id, notifications)
        return {"status": "ok", "notifications": notifications, "emotion_sentiment": emotion_sentiment, "session_id": req.session_id}
    except Exception as e:
        return {"status": "error", "error": str(e)}

@app.post("/reset")
async def reset(req: SessionRequest):
    try:
        bot.reset(req.session_id)
        return {"status": "ok"}
    except Exception as e:
        return {"status": "error", "error": str(e)}

@app.post("/hard-reset")
async def hard_reset(req: SessionRequest):
    try:
        bot.hard_reset(req.session_id)
        return {"status": "ok"}
    except Exception as e:
        return {"status": "error", "error": str(e)}


# ── Analytics & Insights ──────────────────────────────────────────────────────

@app.post("/get-mood-analytics")
async def get_mood_analytics(req: UserIdRequest):
    try:
        return {"analytics": bot.get_mood_analytics(req.user_id, days=30).dict(), "user_id": req.user_id}
    except Exception as e:
        return {"status": "error", "error": str(e)}

@app.post("/get-quote-thought", response_model=EmotionReplyResponse)
async def get_quote_thought(req: EmotionRequest):
    try:
        prompt = f'Given the emotion "{req.emotion}", respond with: 1. A real well-known quote matching the emotion. 2. The accurate author. 3. A four-line original inspirational thought relevant to the emotion.'
        client = genai.Client(api_key=cfg['api_key'])
        response = client.models.generate_content(
            model=cfg['model_name'],
            contents=prompt,
            config={"response_mime_type": "application/json", "response_schema": EmotionReplyResponse},
        )
        r = response.parsed
        return {"quote": r.quote, "author": r.author, "thought": r.thought}
    except Exception as e:
        return {"quote": "Error occurred", "author": "System", "thought": str(e)}

@app.post("/get-notifications")
async def get_notifications(req: UserIdRequest):
    try:
        return {"notifications": bot.db.get_notifications(req.user_id)}
    except Exception as e:
        return {"status": "error", "error": str(e)}


# ── Document Upload ───────────────────────────────────────────────────────────

@app.post("/upload-document")
async def upload_document(file: UploadFile = File(...), user_id: str = Form(...), session_id: str = Form(...)):
    try:
        suffix = os.path.splitext(file.filename)[1].lower()
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(await file.read())
            tmp_path = tmp.name
        if suffix == ".pdf":
            loader = PyPDFLoader(tmp_path)
        elif suffix in (".doc", ".docx"):
            loader = Docx2txtLoader(tmp_path)
        else:
            loader = TextLoader(tmp_path)
        docs = loader.load()
        splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
        chunks = splitter.split_documents(docs)
        text = "\n\n".join(c.page_content for c in chunks[:20])
        os.unlink(tmp_path)
        bot.store_question_info(session_id, f"[Uploaded document: {file.filename}]\n{text}")
        return {"status": "ok", "chunks": len(chunks)}
    except Exception as e:
        return {"status": "error", "error": str(e)}


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("server:app", host="0.0.0.0", port=port, reload=True)
