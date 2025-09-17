from fastapi import FastAPI
from pydantic import BaseModel
from datetime import datetime
from chatbot import ChatBot
import os
import yaml

# Load config
cfg_path = os.path.join(os.path.dirname(__file__), "config.yaml")
try:
    with open(cfg_path, "r") as f:
        cfg = yaml.safe_load(f)
except Exception:
    cfg = {}

bot = ChatBot(cfg_path)

# FastAPI app
app = FastAPI(title="Chatbot API", version="1.0")

# Request / Response models
class ChatRequest(BaseModel):
    message: str
    user_id: str

class ChatResponse(BaseModel):
    reply: str

class UserIdRequest(BaseModel):
    user_id: str

@app.get("/")
async def root():
    """Health check endpoint"""
    return {"status": "Chatbot server is running!", "timestamp": str(datetime.now())}

@app.get("/test")
async def test():
    """Simple test endpoint"""
    return {"message": "Server is working!"}

@app.get("/endpoints")
async def list_endpoints():
    """List all available endpoints and their usage"""
    endpoints = {
        "GET /": "Health check endpoint",
        "GET /test": "Simple test endpoint", 
        "GET /info": "Get chatbot model info",
        "GET /endpoints": "List all available endpoints",
        "POST /chat": "Send a message to chatbot and get reply (requires: message, user_id)",
        "POST /app-exit": "Handle app exit - summarize and store conversation data (requires: user_id)",
        "POST /hard-reset": "Handle hard reset - save conversation to DB and clear all data (requires: user_id)",
        "POST /get-initial-message": "Get initial message for a user (requires: user_id)",
        "POST /get-notification": "Get notification for a user (requires: user_id)",
        "POST /get-history": "Get conversation history for a user (requires: user_id)",
        "POST /reset": "Reset conversation history for a user (requires: user_id)",
        "POST /classify-category": "Classify the category of a user message (requires: message, user_id)",
        "POST /get-specialised-prompt": "Get specialised prompt for a user message (requires: message, user_id)"
    }
    return {"endpoints": endpoints, "timestamp": str(datetime.now())}

@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(req: ChatRequest):
    """Send a message to chatbot and get reply"""
    try:
        reply_text = bot.get_reply(req.message, req.user_id)
        return ChatResponse(reply=reply_text)
    except Exception as e:
        print(f"Error in chat endpoint: {e}")
        return ChatResponse(reply="Sorry, I encountered an error. Please try again.")

@app.get("/info")
async def model_info():
    """Get chatbot model info"""
    return bot.model_info()

@app.post("/app-exit")
async def app_exit(req: UserIdRequest):
    """Handle app exit - summarize and store conversation data"""
    try:
        bot.app_exit(req.user_id)
        return {"status": "App exit processed successfully", "user_id": req.user_id, "timestamp": str(datetime.now())}
    except Exception as e:
        print(f"Error in app exit endpoint: {e}")
        return {"status": "Error during app exit", "error": str(e), "user_id": req.user_id, "timestamp": str(datetime.now())}

@app.post("/hard-reset")
async def hard_reset(req: UserIdRequest):
    """Handle hard reset - save conversation to DB and clear all data"""
    try:
        bot.hard_reset(req.user_id)
        return {"status": "Hard reset completed successfully", "user_id": req.user_id, "timestamp": str(datetime.now())}
    except Exception as e:
        print(f"Error in hard reset endpoint: {e}")
        return {"status": "Error during hard reset", "error": str(e), "user_id": req.user_id, "timestamp": str(datetime.now())}

@app.post("/get-initial-message")
async def get_initial_message(req: UserIdRequest):
    """Get initial message for a user"""
    try:
        initial_message = bot.get_initial_message(req.user_id)
        return {"message": initial_message, "user_id": req.user_id, "timestamp": str(datetime.now())}
    except Exception as e:
        print(f"Error in get initial message endpoint: {e}")
        return {"status": "Error getting initial message", "error": str(e), "user_id": req.user_id, "timestamp": str(datetime.now())}

@app.post("/get-history")
async def get_history(req: UserIdRequest):
    """Get conversation history for a user"""
    try:
        history = bot.get_history(req.user_id)
        return {"history": history, "user_id": req.user_id, "timestamp": str(datetime.now())}
    except Exception as e:
        print(f"Error in get history endpoint: {e}")
        return {"status": "Error getting history", "error": str(e), "user_id": req.user_id, "timestamp": str(datetime.now())}

@app.post("/reset")
async def reset(req: UserIdRequest):
    """Reset conversation history for a user"""
    try:
        bot.reset(req.user_id)
        return {"status": "Reset completed successfully", "user_id": req.user_id, "timestamp": str(datetime.now())}
    except Exception as e:
        print(f"Error in reset endpoint: {e}")
        return {"status": "Error during reset", "error": str(e), "user_id": req.user_id, "timestamp": str(datetime.now())}

# Hosting code
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)

# Export only `app` for Vercel (ASGI)
