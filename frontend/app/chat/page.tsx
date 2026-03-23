'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Plus, Trash2, MessageSquare, Sparkles, Paperclip, Loader2, FileText, X, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MessageList } from '@/components/chat/MessageList';
import { ChatInput } from '@/components/chat/ChatInput';
import { useUserStore } from '@/lib/store/userStore';
import { useChatStore } from '@/lib/store/chatStore';
import { useChat } from '@/lib/hooks/useChat';
import { useAuthGuard } from '@/lib/hooks/useAuthGuard';
import { apiClient } from '@/lib/api/client';
import type { Session } from '@/lib/types/api';
import { toast } from 'sonner';
import Link from 'next/link';

export default function ChatPage() {
  const router = useRouter();
  const { isAuthenticated, userId, userName } = useUserStore();
  const { ready } = useAuthGuard();
  const { clearMessages } = useChatStore();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const exitCalled = useRef(false);

  const { messages, sendMessage, getInitialMessage, loadMessages, appExit, isLoading, isTyping } = useChat(activeSessionId ?? '');

  useEffect(() => {
    if (!ready) return;
    loadSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  useEffect(() => {
    if (!activeSessionId) return;
    exitCalled.current = false;
    clearMessages();
    loadMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSessionId]);

  useEffect(() => {
    return () => {
      if (!exitCalled.current && activeSessionId && messages.length > 0) {
        exitCalled.current = true;
        appExit();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSessionId, messages.length]);

  const loadSessions = async () => {
    if (!userId) return;
    const res = await apiClient.getSessions(userId);
    if (res.data?.sessions) setSessions(res.data.sessions);
  };

  const newChat = async () => {
    if (!userId) return;
    if (activeSessionId && messages.length > 0) {
      exitCalled.current = true;
      await appExit();
    }
    const res = await apiClient.createSession(userId);
    if (res.data?.session_id) {
      const sessionId = res.data.session_id;
      await loadSessions();
      setActiveSessionId(sessionId);
      clearMessages();
      exitCalled.current = false;
      setTimeout(() => getInitialMessage(), 100);
    }
  };

  const selectSession = async (sessionId: string) => {
    if (sessionId === activeSessionId) return;
    if (activeSessionId && messages.length > 0 && !exitCalled.current) {
      exitCalled.current = true;
      await appExit();
    }
    setActiveSessionId(sessionId);
  };

  const deleteSession = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (!userId) return;
    await apiClient.deleteSession(userId, sessionId);
    if (activeSessionId === sessionId) {
      setActiveSessionId(null);
      clearMessages();
    }
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    toast.success('Chat deleted');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId || !activeSessionId) return;
    setUploading(true);
    const res = await apiClient.uploadDocument(file, userId, activeSessionId);
    setUploading(false);
    if (res.data?.status === 'ok') {
      setUploadedFile(file.name);
      toast.success(`Document uploaded — ${res.data.chunks} sections processed`);
    } else {
      toast.error('Upload failed');
    }
    e.target.value = '';
  };

  if (!ready) return null;

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 overflow-hidden">
      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 260, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col glass border-r overflow-hidden shrink-0"
          >
            {/* Sidebar header */}
            <div className="p-4 border-b flex items-center justify-between">
              <Link href="/dashboard" className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full gradient-primary flex items-center justify-center">
                  <Brain className="w-4 h-4 text-white" />
                </div>
                <span className="font-semibold text-sm">MindMate</span>
              </Link>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={newChat} title="New chat">
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Session list */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {sessions.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-8">No chats yet.<br />Click + to start.</p>
              )}
              {sessions.map(session => (
                <button
                  key={session.id}
                  onClick={() => selectSession(session.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 group transition-colors ${activeSessionId === session.id ? 'bg-primary/10 text-primary' : 'hover:bg-muted/50 text-foreground'}`}
                >
                  <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-60" />
                  <span className="flex-1 truncate">{session.title}</span>
                  <Trash2
                    className="w-3.5 h-3.5 shrink-0 opacity-0 group-hover:opacity-60 hover:!opacity-100 hover:text-destructive transition-opacity"
                    onClick={(e) => deleteSession(e, session.id)}
                  />
                </button>
              ))}
            </div>

            {/* User */}
            <div className="p-3 border-t">
              <p className="text-xs text-muted-foreground truncate">{userName}</p>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Top bar */}
        <header className="glass border-b px-4 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSidebarOpen(o => !o)}>
              <Menu className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium">
              {activeSessionId ? (sessions.find(s => s.id === activeSessionId)?.title ?? 'Chat') : 'MindMate'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary animate-pulse" />
            <span className="text-xs text-muted-foreground hidden sm:inline">Online</span>
          </div>
        </header>

        {/* Chat area */}
        {!activeSessionId ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-4">
            <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-semibold">How are you feeling today?</h2>
            <p className="text-muted-foreground text-sm max-w-sm">Start a new conversation or select one from the sidebar.</p>
            <Button className="gradient-primary" onClick={newChat}>
              <Plus className="w-4 h-4 mr-2" /> New Chat
            </Button>
          </div>
        ) : (
          <div className="flex flex-col flex-1 min-h-0">
            {uploadedFile && (
              <div className="flex items-center gap-2 px-4 py-2 bg-primary/5 border-b text-sm shrink-0">
                <FileText className="w-4 h-4 text-primary" />
                <span className="flex-1 truncate text-muted-foreground">{uploadedFile}</span>
                <button onClick={() => setUploadedFile(null)}><X className="w-4 h-4 text-muted-foreground" /></button>
              </div>
            )}
            <MessageList messages={messages} isTyping={isTyping} />
            <div className="flex items-end gap-2 px-4 pb-1 shrink-0">
              <input ref={fileRef} type="file" accept=".pdf,.txt,.doc,.docx" className="hidden" onChange={handleFileChange} />
              <Button variant="ghost" size="icon" className="shrink-0 mb-1" onClick={() => fileRef.current?.click()} disabled={uploading} title="Upload document">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
              </Button>
              <div className="flex-1">
                <ChatInput onSend={sendMessage} disabled={isLoading} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
