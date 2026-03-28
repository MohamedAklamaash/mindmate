# MindMate

An AI-powered mental health companion that holds emotionally intelligent conversations, tracks your mood over time, and surfaces personalized insights — all through a clean, calming interface.

> MindMate is not a replacement for professional mental health care. If you are in crisis, please contact a qualified healthcare provider or emergency services.

---

## What it does

- Conversations powered by **Google Gemini 2.5 Flash** that adapt tone based on the detected mental health topic (anxiety, grief, stress, etc.)
- Summarizes and compresses conversation history automatically so long sessions stay coherent
- Detects dominant emotion and sentiment at the end of each session and persists them to PostgreSQL
- Extracts important dates mentioned in conversation (e.g. "my exam is on Friday") and stores them as notifications in MongoDB
- Surfaces mood analytics — dominant emotion, sentiment trend, and 30-day history — on the insights page
- Generates personalized inspirational quotes and reflections based on your current emotional state
- Multi-session chat (ChatGPT-style) with full history per session
- Upload documents (PDF, DOCX, TXT) to give the AI additional context

---

## Stack

| Layer | Tech |
|---|---|
| AI backend | FastAPI + Langchain |
| Frontend | Next.js 15 + Tailwind + shadcn/ui |
| Relational DB | PostgreSQL (mood summaries, users) |
| Document DB | MongoDB (chat sessions, notifications) |

---

## Quick start

**Prerequisites:** Python 3.11+, Node.js 18+, running PostgreSQL (port 5433) and MongoDB (port 27017) instances, Google Gemini API key.

```bash
git clone <repo>
cd MindMate
./start.sh
```

Or manually:

```bash
cd ai_services
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
cd chatbot
uvicorn server:app --host 0.0.0.0 --port 9000 --reload

cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:3000`, backend at `http://localhost:9000`.

---

## Environment variables

**`ai_services/.env`**
```env
GOOGLE_API_KEY=your_gemini_api_key
POSTGRES_DB_URL=postgresql://user:password@localhost:5433/mindmate
MONGODB_URL=mongodb://user:password@localhost:27017/mindmate?authSource=admin
```

**`frontend/.env.local`**
```env
NEXT_PUBLIC_API_URL=http://localhost:9000
```

---

## Deployment

**Backend (Docker)**
```bash
cd ai_services
docker build -t mindmate-ai .
docker run -p 9000:9000 --env-file .env mindmate-ai
```

**Frontend (Vercel)**
1. Push to GitHub
2. Import in Vercel, set `NEXT_PUBLIC_API_URL` to your backend URL
3. Deploy

See [`ai_services/README.md`](ai_services/README.md) and [`frontend/README.md`](frontend/README.md) for detailed docs on each service.
