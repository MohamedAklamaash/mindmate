from fastapi import FastAPI
from pydantic import BaseModel
from datetime import datetime
from chatbot import ChatBot
import os
import yaml
from google import genai

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

class EmotionRequest(BaseModel):
    emotion: str

class EmotionReplyResponse(BaseModel):
    quote: str
    author: str
    thought: str

# Automatically call "change_initial_message" once every 24 hours (every night)
import threading
import time

def schedule_change_initial_message():
    while True:
        now = datetime.now()
        # Calculate seconds until next midnight
        next_midnight = (now.replace(hour=0, minute=0, second=0, microsecond=0) + 
                         timedelta(days=1))
        seconds_until_midnight = (next_midnight - now).total_seconds()
        time.sleep(seconds_until_midnight)
        try:
            bot.change_initial_message()
            print(f"Initial message changed for all users at {datetime.now()}")
        except Exception as e:
            print(f"Error changing initial message: {e}")

# Start the scheduler in a background thread
from datetime import timedelta
threading.Thread(target=schedule_change_initial_message, daemon=True).start()

# Schedule context clearing for all users every 24 hours
def schedule_clear_context():
    while True:
        now = datetime.now()
        # Calculate seconds until next midnight
        next_midnight = (now.replace(hour=0, minute=0, second=0, microsecond=0) + 
                         timedelta(days=1))
        seconds_until_midnight = (next_midnight - now).total_seconds()
        time.sleep(seconds_until_midnight)
        try:
            bot.clear_context_for_all_users()
            print(f"Context cleared for all users at {datetime.now()}")
        except Exception as e:
            print(f"Error clearing context for all users: {e}")

# Start the context clearing scheduler in a background thread
threading.Thread(target=schedule_clear_context, daemon=True).start()


@app.get("/")
async def root():
    """Health check endpoint"""
    return {"status": "Chatbot server is running!", "timestamp": str(datetime.now())}

@app.get("/test")
async def test():
    """Simple test endpoint"""
    return {"message": "Server is working!"}

@app.post("/get-quote-thought", response_model=EmotionReplyResponse)
async def get_quote_thought(req: EmotionRequest):
    """Get the quote and thought of the user."""
    try:
        prompt = f"""
You are an assistant that provides inspiration based on a user's emotion.

Given the emotion "{req.emotion}" as input, respond with:
1. A real, well-known quote that matches the emotion.
2. The author of the quote (must be accurate and real).
3. A four-line original inspirational thought or reflection, written by you, that is relevant to the emotion and the quote.

Both the quote and the thought must be clearly related to the input emotion.
"""
        client = genai.Client(api_key=cfg['api_key'])
        response = client.models.generate_content(
            model=cfg['model_name'],
            contents=prompt,
            config={
                "response_mime_type": "application/json",
                "response_schema": EmotionReplyResponse,
            },
        )

        # Use the parsed response directly
        emotion_response = response.parsed

        return {
            "quote": emotion_response.quote,
            "author": emotion_response.author,
            "thought": emotion_response.thought
        }
        
    except Exception as e:
        print(f"Error in get quote thought endpoint: {e}")
        return{
            "quote":"Error occurred", 
            "author":"System", 
            "thought":"Sorry, I encountered an error while processing your request."
        }

@app.post("/get-initial-message")
async def get_initial_message(req: UserIdRequest):
    """Get initial message for a user"""
    try:
        initial_message = bot.get_initial_message(req.user_id)
        return {"message": initial_message, "user_id": req.user_id, "timestamp": str(datetime.now())}
    except Exception as e:
        print(f"Error in get initial message endpoint: {e}")
        return {"status": "Error getting initial message", "error": str(e), "user_id": req.user_id, "timestamp": str(datetime.now())}

@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(req: ChatRequest):
    """Send a message to chatbot and get reply"""
    try:
        reply_text = bot.get_reply(req.message, req.user_id)
        return ChatResponse(reply=reply_text)
    except Exception as e:
        print(f"Error in chat endpoint: {e}")
        return ChatResponse(reply="Sorry, I encountered an error. Please try again.")

@app.post("/store-question-info")
async def store_question_info(req: ChatRequest):
    """Store question information for a user"""
    try:
        bot.store_question_info(req.user_id, req.message)
        return {"status": "Question info stored successfully", "user_id": req.user_id, "timestamp": str(datetime.now())}
    except Exception as e:
        print(f"Error in store question info endpoint: {e}")
        return {"status": "Error storing question info", "error": str(e), "user_id": req.user_id, "timestamp": str(datetime.now())}

@app.post("/app-exit")
async def app_exit(req: UserIdRequest):
    """Handle app exit - summarize and store conversation data"""
    try:
        notifications , emotion_sentiment = bot.app_exit(req.user_id)
        return {
            "status": "App exit completed successfully", 
            "notifications": notifications,
            "emotion_sentiment": emotion_sentiment,
            "user_id": req.user_id, 
            "timestamp": str(datetime.now())
        }
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

@app.get("/endpoints")
async def list_endpoints():
    """List all available endpoints and their usage"""
    endpoints = {
        "GET /": "Health check endpoint",
        "GET /test": "Simple test endpoint", 
        "GET /endpoints": "List all available endpoints",
        "POST /chat": "Send a message to chatbot and get reply (requires: message, user_id)",
        "POST /app-exit": "Handle app exit - summarize and store conversation data (requires: user_id)",
        "POST /hard-reset": "Handle hard reset - save conversation to DB and clear all data (requires: user_id)",
        "POST /get-initial-message": "Get initial message for a user (requires: user_id)",
        "POST /store-question-info": "Store question information for a user (requires: message, user_id)",
        "POST /get-notification": "Get notification for a user (requires: user_id)",
        "POST /get-history": "Get conversation history for a user (requires: user_id)",
        "POST /reset": "Reset conversation history for a user (requires: user_id)",
        "POST /classify-category": "Classify the category of a user message (requires: message, user_id)",
        "POST /get-specialised-prompt": "Get specialised prompt for a user message (requires: message, user_id)"
    }
    return {"endpoints": endpoints, "timestamp": str(datetime.now())}

@app.get("/info")
async def model_info():
    """Get chatbot model info"""
    return bot.model_info()
# Hosting code
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)

# Export only `app` for Vercel (ASGI)
