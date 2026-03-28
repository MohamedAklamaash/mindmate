# frontend

Next.js 15 frontend for MindMate.

---

## Folder structure

```
frontend/
├── app/
│   ├── page.tsx              # Landing / login page
│   ├── layout.tsx            # Root layout
│   ├── globals.css
│   ├── dashboard/page.tsx    # Home after login — session list + new chat
│   ├── chat/page.tsx         # Chat interface with multi-session sidebar
│   ├── insights/page.tsx     # 30-day mood overview, emotion state, quote
│   ├── history/page.tsx      # Past sessions with expandable messages
│   └── settings/page.tsx     # User settings
├── components/
│   ├── chat/
│   │   ├── ChatInput.tsx     # Message input with doc upload badge
│   │   └── MessageList.tsx   # Renders conversation messages
│   ├── insights/
│   │   └── QuoteCard.tsx     # Displays personalised quote/reflection
│   └── ui/                   # shadcn/ui primitives
├── lib/
│   ├── api/
│   │   └── client.ts         # Typed API client for all backend endpoints
│   ├── store/
│   │   ├── userStore.ts      # Zustand — user identity, emotion, sentiment
│   │   └── chatStore.ts      # Zustand — active session state
│   ├── hooks/
│   │   ├── useAuthGuard.ts   # Redirects unauthenticated users, waits for hydration
│   │   └── useChat.ts        # Chat send/receive logic
│   ├── types/
│   │   └── api.ts            # TypeScript types matching backend responses
│   └── constants.ts          # API endpoint constants
├── .env.local
└── next.config.ts
```

---

## Pages

| Route | Description |
|---|---|
| `/` | Landing page — enter name to register and enter the app |
| `/dashboard` | Session list, create new chat |
| `/chat` | Active chat with session sidebar, doc upload, multi-session support |
| `/insights` | Current emotion state, 30-day sentiment bars, personalised reflection |
| `/history` | All past sessions with expandable message history |
| `/settings` | User preferences |

---

## Environment variables

```env
NEXT_PUBLIC_API_URL=http://localhost:9000
```

---

## Running locally

```bash
npm install
npm run dev
```

Runs at `http://localhost:3000`.

## Deploy (Vercel)

1. Push to GitHub
2. Import in Vercel
3. Set `NEXT_PUBLIC_API_URL` to your backend URL
4. Deploy
