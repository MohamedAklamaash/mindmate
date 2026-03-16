# MindMate

MindMate is an AI-powered mental health companion that provides empathetic, context-aware conversational support. It tracks emotional patterns over time, surfaces personalized insights, and reminds users of important dates they've shared — all through a clean, calming interface.

> MindMate is not a replacement for professional mental health care. If you are in crisis, please contact a qualified healthcare provider or emergency services.

---

## What it does

- Holds emotionally intelligent conversations powered by Google Gemini 2.5 Flash
- Automatically classifies the mental health topic of each message (anxiety, grief, stress, etc.) and adapts its tone accordingly
- Summarizes and compresses conversation history as context grows, so long sessions stay coherent
- Detects dominant emotion and sentiment at the end of each session and persists them to PostgreSQL
- Extracts important dates mentioned in conversation (e.g. "my exam is on Friday") and stores them as notifications in MongoDB
- Surfaces mood analytics — dominant emotion, sentiment trend, and 30-day history — on the insights page
- Generates personalized inspirational quotes and reflections based on the user's current emotional state

---

## Project structure

```
MindMate/
├── ai_services/          # FastAPI backend + AI logic
│   ├── chatbot/
│   │   ├── server.py         # FastAPI app and all endpoints
│   │   ├── chatbot.py        # ChatBot orchestrator
│   │   ├── chat.py           # Gemini API wrapper (ChatCompletionBase)
│   │   ├── db.py             # PostgreSQL (ServerDB) + MongoDB (NotificationDB)
│   │   ├── prompt_manager.py # Category classification and prompt selection
│   │   ├── custom_promt.py   # System prompts
│   │   ├── structures.py     # Pydantic models
│   │   └── config.yaml       # Non-secret config (model params, thresholds)
│   ├── test/
│   │   └── test_endpoint.py
│   ├── .env.example
│   ├── requirements.txt
│   └── Dockerfile
│
└── frontend/             # Next.js 15 frontend
    ├── app/
    │   ├── page.tsx          # Login / role selection
    │   ├── dashboard/        # Home dashboard
    │   ├── chat/             # Chat interface
    │   ├── history/          # Conversation history
    │   ├── insights/         # Mood and emotion insights
    │   └── settings/         # Account and data settings
    ├── components/
    │   ├── chat/             # ChatInterface, MessageList, ChatInput
    │   ├── insights/         # QuoteCard
    │   └── ui/               # shadcn/ui primitives
    └── lib/
        ├── api/              # API client (typed fetch wrapper)
        ├── store/            # Zustand stores (user, chat)
        ├── hooks/            # useChat
        └── types/            # API response types
```

---

## Tech stack

### AI Services (backend)

| Layer | Technology |
|---|---|
| Framework | FastAPI |
| AI Model | Google Gemini 2.5 Flash via `google-genai` |
| Primary database | PostgreSQL 17 — session summaries, emotion/sentiment insights |
| Secondary database | MongoDB 7 — notifications, chat session metadata |
| Config | `config.yaml` for model params; secrets via `.env` / environment variables |
| Validation | Pydantic v2 |
| Server | Uvicorn |
| Containerization | Docker |

Key design decisions:
- `ChatCompletionBase` wraps the Gemini API and handles both free-text and structured (JSON schema) responses
- `PromptManager` classifies each message into a mental health category and selects a specialized system prompt
- Context is automatically compressed when it approaches the model's token limit — oldest 20% of messages are summarized and stored
- At session end (`/app-exit`), the full conversation is summarized, emotion/sentiment is extracted, and notifications are persisted to MongoDB

### Frontend

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| UI components | shadcn/ui |
| Animations | Framer Motion |
| State management | Zustand |
| Icons | Lucide React |

---

## Getting started

### Prerequisites

- Python 3.11+
- Node.js 18+
- Google Gemini API key
- Running PostgreSQL instance (port 5433) with a `mindmate` database
- Running MongoDB instance (port 27017) with a `mindmate` database

### Backend

```bash
cd ai_services
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in your values
uvicorn chatbot.server:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend

```bash
cd frontend
npm install
# .env.local already has NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev
```

Or run both with:

```bash
./start.sh
```

---

## Environment variables

### `ai_services/.env`

```env
GOOGLE_API_KEY=your_gemini_api_key
POSTGRES_DB_URL=postgresql://user:password@localhost:5433/mindmate
MONGODB_URL=mongodb://user:password@localhost:27017/mindmate?authSource=admin
```

### `frontend/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## API endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/` | Health check |
| GET | `/info` | Model info |
| GET | `/endpoints` | List all endpoints |
| POST | `/chat` | Send message, get AI reply |
| POST | `/get-initial-message` | Get personalized greeting |
| POST | `/get-quote-thought` | Get quote + reflection by emotion |
| POST | `/app-exit` | Summarize session, persist to DB |
| POST | `/hard-reset` | Save everything and clear all state |
| POST | `/reset` | Clear conversation only |
| POST | `/get-history` | Retrieve conversation history |
| POST | `/store-question-info` | Store question metadata |
| POST | `/get-mood-analytics` | 30-day mood analytics |

---

## Deployment

### Backend (Docker)

```bash
cd ai_services
docker build -t mindmate-ai .
docker run -p 8000:8000 --env-file .env mindmate-ai
```

### Frontend (Vercel)

1. Push to GitHub
2. Import in Vercel
3. Set `NEXT_PUBLIC_API_URL` to your backend URL
4. Deploy
