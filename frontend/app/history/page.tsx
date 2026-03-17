'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, MessageSquare, Bot, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useUserStore } from '@/lib/store/userStore';
import { apiClient } from '@/lib/api/client';
import type { ChatMessage } from '@/lib/types/api';
import Link from 'next/link';

export default function HistoryPage() {
  const router = useRouter();
  const { isAuthenticated, userId } = useUserStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) { router.push('/'); return; }
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const fetchHistory = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await apiClient.getHistory(userId);
      if (res.data?.history?.messages) setMessages(res.data.history.messages);
    } catch (_) {}
    finally { setLoading(false); }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <header className="glass border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/dashboard"><Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button></Link>
          <div>
            <h1 className="text-xl font-bold">Conversation History</h1>
            <p className="text-xs text-muted-foreground">Your current session</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          {loading && (
            <div className="text-center py-12 text-muted-foreground text-sm">Loading history...</div>
          )}

          {!loading && messages.length === 0 && (
            <Card className="glass border-0 shadow-lg">
              <CardContent className="p-12 text-center">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No conversations yet</h3>
                <p className="text-muted-foreground mb-6">Start chatting to see your conversation history here</p>
                <Link href="/chat"><Button className="gradient-primary">Start Chatting</Button></Link>
              </CardContent>
            </Card>
          )}

          {!loading && messages.map((msg, index) => (
            <motion.div key={index} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.04 }}>
              {msg.user && (
                <div className="flex gap-3 justify-end mb-2">
                  <div className="bg-primary text-white rounded-2xl rounded-tr-sm px-4 py-3 max-w-[80%] shadow-sm">
                    <p className="text-xs font-medium mb-1 opacity-70 flex items-center gap-1"><User className="w-3 h-3" /> You</p>
                    <p className="text-sm leading-relaxed">{msg.user}</p>
                  </div>
                </div>
              )}
              {msg.ai && (
                <div className="flex gap-3 mb-2">
                  <div className="glass rounded-2xl rounded-tl-sm px-4 py-3 max-w-[80%] shadow-sm">
                    <p className="text-xs font-medium mb-1 text-muted-foreground flex items-center gap-1"><Bot className="w-3 h-3" /> MindMate</p>
                    <p className="text-sm leading-relaxed">{msg.ai}</p>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      </main>
    </div>
  );
}
