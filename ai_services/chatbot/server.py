from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime, timedelta
from chatbot import ChatBot
import os
import yaml
import tempfile
from google import genai
from typing import Any
import threading
import time
from dotenv import load_dotenv
from langchain_community.document_loaders import PyPDFLoader, TextLoader, Docx2txtLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter

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

class ChatResponse(BaseModel):
    reply: str

class UserIdRequest(BaseModel):
    user_id: str

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

@app.get("/test")
async def test():
    return {"message": "ok"}

@app.get("/info")
async def model_info():
    return bot.model_info()

@app.get("/endpoints")
async def list_endpoints():
    return {"endpoints": {
        "GET /": "health check",
        "GET /info": "model info",
        "POST /chat": "send message",
        "POST /get-initial-message": "get greeting",
        "POST /get-quote-thought": "get quote by emotion",
        "POST /app-exit": "summarise session and persist",
        "POST /hard-reset": "save all and clear",
        "POST /reset": "clear conversation",
        "POST /get-history": "conversation history",
        "POST /store-question-info": "store question metadata",
        "POST /get-mood-analytics": "mood analytics (30 days)",
    }, "timestamp": str(datetime.now())}

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

@app.post("/get-initial-message")
async def get_initial_message(req: UserIdRequest):
    try:
        msg = bot.get_initial_message(req.user_id)
        return {"message": msg, "user_id": req.user_id, "timestamp": str(datetime.now())}
    except Exception as e:
        return {"status": "error", "error": str(e), "user_id": req.user_id}

@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(req: ChatRequest):
    try:
        return ChatResponse(reply=bot.get_reply(req.message, req.user_id))
    except Exception as e:
        return ChatResponse(reply="Sorry, I encountered an error. Please try again.")

@app.post("/store-question-info")
async def store_question_info(req: ChatRequest):
    try:
        bot.store_question_info(req.user_id, req.message)
        return {"status": "ok", "user_id": req.user_id}
    except Exception as e:
        return {"status": "error", "error": str(e)}

@app.post("/app-exit")
async def app_exit(req: UserIdRequest):
    try:
        notifications, emotion_sentiment = bot.app_exit(req.user_id)
        return {"status": "ok", "notifications": notifications, "emotion_sentiment": emotion_sentiment, "user_id": req.user_id, "timestamp": str(datetime.now())}
    except Exception as e:
        return {"status": "error", "error": str(e), "user_id": req.user_id}

@app.post("/hard-reset")
async def hard_reset(req: UserIdRequest):
    try:
        bot.hard_reset(req.user_id)
        return {"status": "ok", "user_id": req.user_id}
    except Exception as e:
        return {"status": "error", "error": str(e)}

@app.post("/get-history")
async def get_history(req: UserIdRequest):
    try:
        return {"history": bot.get_history(req.user_id), "user_id": req.user_id, "timestamp": str(datetime.now())}
    except Exception as e:
        return {"status": "error", "error": str(e)}

@app.post("/get-mood-analytics")
async def get_mood_analytics(req: UserIdRequest):
    try:
        return {"analytics": bot.get_mood_analytics(req.user_id, days=30).dict(), "user_id": req.user_id, "timestamp": str(datetime.now())}
    except Exception as e:
        return {"status": "error", "error": str(e)}

@app.post("/upload-document")
async def upload_document(file: UploadFile = File(...), user_id: str = Form(...)):
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
        bot.store_question_info(user_id, f"[Uploaded document: {file.filename}]\n{text}")
        return {"status": "ok", "chunks": len(chunks), "user_id": user_id}
    except Exception as e:
        return {"status": "error", "error": str(e)}

@app.post("/reset")
async def reset(req: UserIdRequest):
    try:
        bot.reset(req.user_id)
        return {"status": "ok", "user_id": req.user_id}
    except Exception as e:
        return {"status": "error", "error": str(e)}

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("server:app", host="0.0.0.0", port=port, reload=True)
