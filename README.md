# 🧠 MindMate - AI Mental Health Companion

A production-ready, full-stack AI-powered mental health companion that provides empathetic emotional support through intelligent conversations.

![Next.js](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.111-green)
![Python](https://img.shields.io/badge/Python-3.11+-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-blue)
![MongoDB](https://img.shields.io/badge/MongoDB-7-green)

## 🌟 Features

### Core Capabilities
- 💬 **Intelligent Conversations** - Context-aware AI responses using Google Gemini 2.5 Flash
- 🎯 **Category Classification** - Automatic detection of mental health topics
- 📊 **Emotion Tracking** - Sentiment analysis and emotional insights
- 💡 **Inspirational Quotes** - Personalized quotes based on emotional state
- 📅 **Smart Notifications** - Important date reminders persisted to MongoDB
- 📖 **Conversation History** - Persistent chat history with summaries in PostgreSQL
- 🔄 **Session Management** - Automatic context summarization

### Frontend Features
- 🎨 **Beautiful UI** - Mental health-focused design with calming colors
- ⚡ **Real-time Chat** - Smooth animations and typing indicators
- 📱 **Fully Responsive** - Mobile-first design
- ♿ **Accessible** - WCAG 2.1 AA compliant
- 🔒 **Privacy-First** - Local storage with user control
- 🚀 **Performance Optimized** - Lighthouse score 90+

## 🏗️ Architecture

### Backend (FastAPI + Google Gemini)
```
backend/
├── chatbot/
│   ├── server.py          # FastAPI server
│   ├── chatbot.py         # Main chatbot logic
│   ├── chat.py            # Chat completion base
│   ├── prompt_manager.py  # Prompt management
│   ├── custom_promt.py    # Specialized prompts
│   ├── db.py              # PostgreSQL + MongoDB management
│   ├── structures.py      # Pydantic models
│   └── config.yaml        # Non-sensitive config (no secrets)
└── test/
    └── test_endpoint.py   # Comprehensive tests
```

### Frontend (Next.js + TypeScript)
```
frontend/
├── app/                   # Next.js App Router
│   ├── chat/             # Chat interface
│   ├── dashboard/        # Dashboard
│   ├── history/          # Conversation history
│   ├── insights/         # Mood insights
│   ├── settings/         # Settings
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Home page
├── components/           # React components
│   ├── ui/              # shadcn/ui components
│   ├── chat/            # Chat components
│   └── insights/        # Insights components
└── lib/                 # Core utilities
    ├── api/            # API client
    ├── hooks/          # Custom hooks
    ├── store/          # State management
    └── types/          # TypeScript types
```

### Database Architecture
- **PostgreSQL** — Persistent session summaries with emotion/sentiment insights
- **MongoDB** — Notifications and chat session metadata

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- Google Gemini API key
- PostgreSQL (Docker recommended)
- MongoDB (Docker recommended)

### Option 1: Automated Start (Recommended)
```bash
cd /home/aklamaash/Desktop/MindMate
./start.sh
```

### Option 2: Manual Start

#### 1. Setup Backend
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your values

# Start server
uvicorn chatbot.server:app --host 0.0.0.0 --port 8000 --reload
```

Backend will run on `http://localhost:8000`

#### 2. Setup Frontend
```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.local.example .env.local
# Edit .env.local if needed

# Start development server
npm run dev
```

Frontend will run on `http://localhost:3000`

## 🔐 Environment Variables

### Backend (`backend/.env`)
```env
GOOGLE_API_KEY=your_google_gemini_api_key
POSTGRES_DB_URL=postgresql://user:password@localhost:5433/mindmate
MONGODB_URL=mongodb://user:password@localhost:27017/mindmate?authSource=admin
```

> See `backend/.env.example` for a template. Never commit `.env` to version control.

### Frontend (`frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 🔌 API Endpoints

### Health & Info
- `GET /` - Health check
- `GET /test` - Server test
- `GET /info` - Model information
- `GET /endpoints` - List all endpoints

### Chat
- `POST /chat` - Send message and get AI reply
- `POST /get-initial-message` - Get personalized greeting

### Emotions
- `POST /get-quote-thought` - Get inspirational quote based on emotion

### Session Management
- `POST /app-exit` - Summarize session, persist to DB, get notifications
- `POST /hard-reset` - Complete data reset
- `POST /reset` - Clear conversation history

### History & Analytics
- `POST /get-history` - Retrieve conversation history
- `POST /store-question-info` - Store question metadata
- `POST /get-mood-analytics` - Get mood analytics over last 30 days

## 🎨 Design System

### Color Palette
```css
/* Primary - Calming Blue */
--primary: oklch(0.6 0.15 240);

/* Secondary - Warm Purple */
--secondary: oklch(0.65 0.12 290);

/* Accent - Soft Green (Growth) */
--accent: oklch(0.7 0.1 150);
```

## 🧪 Testing

### Backend Tests
```bash
cd backend
python test/test_endpoint.py
```

### Frontend Type Check
```bash
cd frontend
npm run type-check
```

## 📦 Deployment

### Backend (Docker)
```bash
cd backend
docker build -t mindmate-backend .
docker run -p 8000:8000 --env-file .env mindmate-backend
```

### Frontend (Vercel - Recommended)
1. Push to GitHub
2. Import project in Vercel
3. Set `NEXT_PUBLIC_API_URL` to backend URL
4. Deploy

## 🛠️ Tech Stack

### Backend
- **Framework**: FastAPI
- **AI Model**: Google Gemini 2.5 Flash
- **Primary DB**: PostgreSQL (summaries, insights)
- **Secondary DB**: MongoDB (notifications, sessions)
- **Validation**: Pydantic
- **Server**: Uvicorn

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **State Management**: Zustand
- **Animations**: Framer Motion
- **Icons**: Lucide React

## 📊 Project Status

### ✅ Completed
- [x] Backend API with all endpoints
- [x] PostgreSQL for session summaries
- [x] MongoDB for notifications and sessions
- [x] Config driven by environment variables (no hardcoded secrets)
- [x] Frontend with chat interface
- [x] Type-safe API integration
- [x] Mood analytics endpoint
- [x] State management
- [x] Responsive design
- [x] Accessibility features
- [x] Error handling

### 🚧 Future Enhancements
- [ ] Insights dashboard with charts
- [ ] Dark mode
- [ ] Voice input
- [ ] PWA support
- [ ] Push notifications
- [ ] Multi-language support

## ⚠️ Disclaimer

MindMate is an AI companion for emotional support and is not a replacement for professional mental health services. If you're experiencing a mental health crisis, please contact a qualified healthcare provider or emergency services.

---

**Built with ❤️ for mental health awareness**

*Last Updated: March 2026*
