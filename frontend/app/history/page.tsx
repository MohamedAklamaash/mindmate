'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, MessageSquare, Bot, User, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useUserStore } from '@/lib/store/userStore';
import { useAuthGuard } from '@/lib/hooks/useAuthGuard';
import { apiClient } from '@/lib/api/client';
import type { Session, ChatMessage } from '@/lib/types/api';
import Link from 'next/link';

export default function HistoryPage() {
  const router = useRouter();
  const { userId } = useUserStore();
  const { ready } = useAuthGuard();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [sessionMessages, setSessionMessages] = useState<Record<string, ChatMessage[]>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!ready || !userId) return;
    setLoading(true);
    apiClient.getSessions(userId)
      .then(r => { if (r.data?.sessions) setSessions(r.data.sessions); })
      .finally(() => setLoading(false));
  }, [ready, userId]);

  if (!ready) return null;

  const toggleSession = async (sessionId: string) => {
    if (expanded === sessionId) { setExpanded(null); return; }
    setExpanded(sessionId);
    if (!sessionMessages[sessionId] && userId) {
      const res = await apiClient.getSessionMessages(userId, sessionId);
      if (res.data?.messages) setSessionMessages(prev => ({ ...prev, [sessionId]: res.data!.messages }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <header className="glass border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/dashboard"><Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button></Link>
          <div>
            <h1 className="text-xl font-bold">Conversation History</h1>
            <p className="text-xs text-muted-foreground">{sessions.length} session{sessions.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl space-y-3">
        {loading && <p className="text-center text-sm text-muted-foreground py-12">Loading...</p>}

        {!loading && sessions.length === 0 && (
          <Card className="glass border-0 shadow-lg">
            <CardContent className="p-12 text-center">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No conversations yet</h3>
              <p className="text-muted-foreground mb-6">Start chatting to see your history here</p>
              <Link href="/chat"><Button className="gradient-primary">Start Chatting</Button></Link>
            </CardContent>
          </Card>
        )}

        {sessions.map((session, i) => (
          <motion.div key={session.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
            <Card className="glass border-0 shadow-md overflow-hidden">
              <CardHeader
                className="py-3 px-4 cursor-pointer flex flex-row items-center justify-between hover:bg-muted/20 transition-colors"
                onClick={() => toggleSession(session.id)}
              >
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-4 h-4 text-primary shrink-0" />
                  <div>
                    <p className="text-sm font-medium leading-tight">{session.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(session.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      {session.emotion && <span className="ml-2 capitalize">· {session.emotion}</span>}
                    </p>
                  </div>
                </div>
                {expanded === session.id ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
              </CardHeader>

              <AnimatePresence>
                {expanded === session.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-2 border-t pt-3">
                      {!sessionMessages[session.id] && (
                        <p className="text-xs text-muted-foreground text-center py-2">Loading messages...</p>
                      )}
                      {sessionMessages[session.id]?.map((msg, idx) => (
                        <div key={idx}>
                          {msg.user && (
                            <div className="flex justify-end mb-1">
                              <div className="bg-primary rounded-2xl rounded-tr-sm px-3 py-2 max-w-[80%]">
                                <p className="text-xs text-primary-foreground/70 flex items-center gap-1 mb-0.5"><User className="w-3 h-3" /> You</p>
                                <p className="text-sm text-primary-foreground leading-relaxed">{msg.user}</p>
                              </div>
                            </div>
                          )}
                          {msg.ai && (
                            <div className="flex mb-1">
                              <div className="bg-muted rounded-2xl rounded-tl-sm px-3 py-2 max-w-[80%]">
                                <p className="text-xs text-muted-foreground flex items-center gap-1 mb-0.5"><Bot className="w-3 h-3" /> MindMate</p>
                                <p className="text-sm text-foreground leading-relaxed">{msg.ai}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </motion.div>
        ))}
      </main>
    </div>
  );
}
