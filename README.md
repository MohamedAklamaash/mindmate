# 🧠 MindMate - AI Mental Health Companion

A production-ready, full-stack AI-powered mental health companion that provides empathetic emotional support through intelligent conversations.

![Next.js](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.111-green)
![Python](https://img.shields.io/badge/Python-3.14-blue)

## 🌟 Features

### Core Capabilities
- 💬 **Intelligent Conversations** - Context-aware AI responses using Google Gemini 2.5 Flash
- 🎯 **Category Classification** - Automatic detection of mental health topics
- 📊 **Emotion Tracking** - Sentiment analysis and emotional insights
- 💡 **Inspirational Quotes** - Personalized quotes based on emotional state
- 📅 **Smart Notifications** - Important date reminders from conversations
- 📖 **Conversation History** - Persistent chat history with summaries
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
AI-Services/
├── chatbot/
│   ├── server.py          # FastAPI server
│   ├── chatbot.py         # Main chatbot logic
│   ├── chat.py            # Chat completion base
│   ├── prompt_manager.py  # Prompt management
│   ├── custom_promt.py    # Specialized prompts
│   ├── db.py              # Database management
│   └── structures.py      # Pydantic models
└── test/
    └── test_endpoint.py   # Comprehensive tests
```

### Frontend (Next.js + TypeScript)
```
frontend/
├── app/                   # Next.js App Router
│   ├── chat/             # Chat interface
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

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- Google Gemini API key

### Option 1: Automated Start (Recommended)
```bash
cd /home/aklamaash/Desktop/MindMate
./start.sh
```

### Option 2: Manual Start

#### 1. Setup Backend
```bash
cd AI-Services

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure API key in chatbot/config.yaml
# api_key: YOUR_GOOGLE_API_KEY

# Start server
python -m chatbot.server
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

## 📚 Documentation

- **[FRONTEND_PLAN.md](./FRONTEND_PLAN.md)** - Complete frontend architecture and design system
- **[IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)** - Step-by-step implementation guide
- **[frontend/README.md](./frontend/README.md)** - Frontend-specific documentation

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
- `POST /app-exit` - Summarize session and get notifications
- `POST /hard-reset` - Complete data reset
- `POST /reset` - Clear conversation history

### History
- `POST /get-history` - Retrieve conversation history
- `POST /store-question-info` - Store question metadata

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

### Typography
- **Font Family**: Geist Sans (Variable)
- **Monospace**: Geist Mono (Variable)

## 🧪 Testing

### Backend Tests
```bash
cd AI-Services
python test/test_endpoint.py
```

### Frontend Type Check
```bash
cd frontend
npm run type-check
```

## 📦 Deployment

### Backend (Vercel/Railway/Render)
1. Deploy FastAPI application
2. Set environment variables (API keys)
3. Configure CORS for frontend domain

### Frontend (Vercel - Recommended)
1. Push to GitHub
2. Import project in Vercel
3. Set `NEXT_PUBLIC_API_URL` to backend URL
4. Deploy

## 🔐 Environment Variables

### Backend (`AI-Services/chatbot/config.yaml`)
```yaml
api_key: YOUR_GOOGLE_API_KEY
model_name: gemini-2.5-flash
temperature: 0.7
```

### Frontend (`frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 🛠️ Tech Stack

### Backend
- **Framework**: FastAPI
- **AI Model**: Google Gemini 2.5 Flash
- **Database**: SQLite (local) + Firebase (cloud)
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
- [x] Frontend with chat interface
- [x] Type-safe API integration
- [x] State management
- [x] Responsive design
- [x] Accessibility features
- [x] Error handling
- [x] Loading states
- [x] Documentation

### 🚧 Future Enhancements
- [ ] History page with timeline
- [ ] Insights dashboard with charts
- [ ] Settings page
- [ ] Dark mode
- [ ] Voice input
- [ ] PWA support
- [ ] Push notifications
- [ ] Multi-language support

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - See LICENSE file for details

## 🙏 Acknowledgments

- Google Gemini for AI capabilities
- shadcn/ui for beautiful components
- Next.js team for excellent framework
- Mental health professionals for guidance

## 📞 Support

For issues or questions:
- Open an issue on GitHub
- Check documentation files
- Review implementation guide

## ⚠️ Disclaimer

MindMate is an AI companion for emotional support and is not a replacement for professional mental health services. If you're experiencing a mental health crisis, please contact a qualified healthcare provider or emergency services.

---

**Built with ❤️ for mental health awareness**

*Last Updated: March 2026*
