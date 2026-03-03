# MindMate Frontend

A modern, accessible, and production-ready frontend for MindMate - an AI-powered mental health companion.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **State Management**: Zustand
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Form Handling**: React Hook Form + Zod

## Features

- 🧠 **Intelligent Chat Interface** - Real-time AI conversations with typing indicators
- 💙 **Mental Health Focused Design** - Calming color palette and empathetic UX
- 📱 **Fully Responsive** - Mobile-first design that works on all devices
- ♿ **Accessible** - WCAG 2.1 AA compliant with keyboard navigation
- 🎨 **Beautiful UI** - Modern design with smooth animations
- 🔒 **Privacy First** - Local storage with user control
- ⚡ **Performance Optimized** - Fast loading and smooth interactions

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Backend API running (see `/AI-Services`)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cp .env.local.example .env.local
# Edit .env.local with your backend API URL
```

3. Run development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
frontend/
├── app/                    # Next.js App Router
│   ├── chat/              # Chat page
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── chat/             # Chat-specific components
│   └── insights/         # Insights components
├── lib/                  # Core utilities
│   ├── api/             # API client
│   ├── hooks/           # Custom React hooks
│   ├── store/           # Zustand stores
│   ├── types/           # TypeScript types
│   └── constants.ts     # App constants
└── public/              # Static assets
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript compiler check

## API Integration

The frontend connects to the FastAPI backend at `http://localhost:8000` by default.

### Key Endpoints Used:
- `POST /chat` - Send messages
- `POST /get-initial-message` - Get greeting
- `POST /get-quote-thought` - Get inspirational quotes
- `POST /app-exit` - Session summary
- `POST /get-history` - Conversation history

See `lib/api/client.ts` for full API implementation.

## Design System

### Colors
- **Primary**: Calming Blue - `oklch(0.6 0.15 240)`
- **Secondary**: Warm Purple - `oklch(0.65 0.12 290)`
- **Accent**: Soft Green - `oklch(0.7 0.1 150)`

### Typography
- **Font**: Geist Sans (Variable)
- **Monospace**: Geist Mono (Variable)

### Spacing
- Base unit: 4px
- Scale: 4, 8, 12, 16, 24, 32, 48, 64, 96

## Accessibility

- Semantic HTML structure
- ARIA labels on interactive elements
- Keyboard navigation support
- Focus indicators
- Color contrast ratios meet WCAG AA
- Screen reader tested

## Performance

- Lighthouse score: 90+
- Code splitting by route
- Image optimization
- Font optimization
- Lazy loading

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Set environment variables
4. Deploy

### Manual Deployment

```bash
npm run build
npm run start
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:8000` |

## Contributing

1. Follow the existing code style
2. Write meaningful commit messages
3. Test on multiple devices
4. Ensure accessibility compliance

## License

MIT

## Support

For issues or questions, please open an issue on GitHub.

---

Built with ❤️ for mental health awareness
