# ai_services

FastAPI backend powering MindMate's AI conversations, mood analytics, and data persistence.

---

## Folder structure

```
ai_services/
├── chatbot/
│   ├── server.py        # FastAPI app — all HTTP endpoints
│   ├── chatbot.py       # Core ChatBot class — conversation logic, summarisation, analytics
│   ├── chat.py          # Gemini API wrapper (ChatCompletionBase)
│   ├── db.py            # DB layer — PostgreSQL (ServerDB) + MongoDB (SessionDB) + unified DB facade
│   ├── structures.py    # Pydantic models — Analysis, PersonalSummary, ConversationInsights, MoodAnalytics
│   ├── prompt_manager.py# Category detection and specialised prompt selection
│   ├── custom_promt.py  # System prompt for first-message handling
│   ├── config.yaml      # Model config (name, temperature, token limits)
│   └── __init__.py
├── requirements.txt
├── Dockerfile
├── docker-compose.yml   # Local dev with existing Postgres + Mongo containers
├── .env.example
└── .gitignore
```

---

## API endpoints

All endpoints accept and return JSON. Base URL: `http://localhost:9000`.

### Users
| Method | Path | Body | Description |
|---|---|---|---|
| POST | `/register` | `{ user_id, name }` | Create or update a user |
| POST | `/get-user` | `{ user_id }` | Fetch user record |

### Sessions
| Method | Path | Body | Description |
|---|---|---|---|
| POST | `/create-session` | `{ user_id, title? }` | Create a new chat session |
| POST | `/get-sessions` | `{ user_id }` | List all sessions for a user |
| POST | `/get-session-messages` | `{ user_id, session_id }` | Get messages for a session |
| POST | `/delete-session` | `{ user_id, session_id }` | Delete a session |

### Chat
| Method | Path | Body | Description |
|---|---|---|---|
| POST | `/get-initial-message` | `{ user_id, session_id }` | Get the AI's opening message |
| POST | `/chat` | `{ user_id, session_id, message }` | Send a message, get AI reply |
| POST | `/app-exit` | `{ user_id, session_id }` | End session — runs summarisation, persists emotion/sentiment, returns notifications |
| POST | `/reset` | `{ user_id, session_id }` | Soft reset (clears in-memory state) |
| POST | `/hard-reset` | `{ user_id, session_id }` | Hard reset (clears in-memory + DB session) |

### Documents
| Method | Path | Form fields | Description |
|---|---|---|---|
| POST | `/upload-document` | `file`, `user_id`, `session_id` | Upload PDF/DOCX/TXT to inject as context |

### Analytics & insights
| Method | Path | Body | Description |
|---|---|---|---|
| POST | `/get-mood-analytics` | `{ user_id }` | 30-day mood history, dominant emotion, sentiment trend |
| POST | `/get-quote-thought` | `{ emotion }` | Generate a personalised quote/reflection |
| POST | `/get-notifications` | `{ user_id }` | Fetch stored date-based notifications |

---

## Data flow

1. User sends a message → `POST /chat`
2. `ChatBot.get_reply` classifies the topic, selects a specialised prompt, calls Gemini
3. If context window is near capacity, `maybe_summarise` compresses old messages into a `PersonalSummary` (with `ConversationInsights`)
4. On `POST /app-exit`, the remaining messages are summarised, emotion/sentiment extracted, and:
   - Summary + insights written to **PostgreSQL** `summaries` table
   - Emotion/sentiment written to the **MongoDB** `chat_sessions` document
   - Date-based notifications written to **MongoDB** `notifications` collection
5. `POST /get-mood-analytics` reads from MongoDB sessions (with Postgres as fallback) to build the 30-day overview

---

## Environment variables

```env
GOOGLE_API_KEY=your_gemini_api_key
POSTGRES_DB_URL=postgresql://user:password@localhost:5433/mindmate
MONGODB_URL=mongodb://user:password@localhost:27017/mindmate?authSource=admin
```

---

## Running locally

```bash
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in values
cd chatbot
uvicorn server:app --host 0.0.0.0 --port 9000 --reload
```

## Docker

```bash
docker build -t mindmate-ai .
docker run -p 9000:9000 --env-file .env mindmate-ai
```
