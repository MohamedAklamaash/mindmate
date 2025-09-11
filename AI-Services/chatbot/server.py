from fastapi import FastAPI
from pydantic import BaseModel
from datetime import datetime
from chatbot import ChatBot
import os
import yaml

# Load config
cfg_path = os.path.join(os.path.dirname(__file__), "config.yaml")
with open(cfg_path, "r") as f:
    cfg = yaml.safe_load(f)

bot = ChatBot(cfg_path)

# FastAPI app
app = FastAPI(title="Chatbot API", version="1.0")

# Request / Response models
class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    reply: str

@app.get("/")
async def root():
    """Health check endpoint"""
    return {"status": "Chatbot server is running!", "timestamp": str(datetime.now())}

@app.get("/test")
async def test():
    """Simple test endpoint"""
    return {"message": "Server is working!"}

@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(req: ChatRequest):
    """Send a message to chatbot and get reply"""
    try:
        reply_text = bot.get_reply(req.message)
        return ChatResponse(reply=reply_text)
    except Exception as e:
        print(f"Error in chat endpoint: {e}")
        return ChatResponse(reply="Sorry, I encountered an error. Please try again.")

@app.get("/info")
async def model_info():
    """Get chatbot model info"""
    return bot.model_info()

@app.get("/app-exit")
async def app_exit():
    """Handle app exit - summarize and store conversation data"""
    try:
        bot.app_exit()
        return {"status": "App exit processed successfully", "timestamp": str(datetime.now())}
    except Exception as e:
        print(f"Error in app exit endpoint: {e}")
        return {"status": "Error during app exit", "error": str(e), "timestamp": str(datetime.now())}

@app.get("/hard-reset")
async def hard_reset():
    """Handle hard reset - save conversation to DB and clear all data"""
    try:
        bot.hard_reset()
        return {"status": "Hard reset completed successfully", "timestamp": str(datetime.now())}
    except Exception as e:
        print(f"Error in hard reset endpoint: {e}")
        return {"status": "Error during hard reset", "error": str(e), "timestamp": str(datetime.now())}


# Hosting code
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)

# Export app for Vercel
# This is the ASGI application that Vercel will use
handler = app
