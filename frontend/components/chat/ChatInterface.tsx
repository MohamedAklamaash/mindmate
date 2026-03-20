'use client';

import { useEffect, useRef, useState } from 'react';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { useChat } from '@/lib/hooks/useChat';
import { useUserStore } from '@/lib/store/userStore';
import { apiClient } from '@/lib/api/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Paperclip, X, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function ChatInterface() {
  const { messages, sendMessage, getInitialMessage, appExit, isLoading, isTyping } = useChat();
  const { userId } = useUserStore();
  const exitCalled = useRef(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (messages.length === 0) getInitialMessage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      if (!exitCalled.current && messages.length > 0) {
        exitCalled.current = true;
        appExit();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    setUploading(true);
    const res = await apiClient.uploadDocument(file, userId);
    setUploading(false);
    if (res.data?.status === 'ok') {
      setUploadedFile(file.name);
      toast.success(`Document uploaded — ${res.data.chunks} sections processed`);
    } else {
      toast.error('Upload failed. Please try again.');
    }
    e.target.value = '';
  };

  return (
    <Card className="flex flex-col h-[calc(100vh-12rem)] glass border-0 shadow-2xl overflow-hidden">
      {uploadedFile && (
        <div className="flex items-center gap-2 px-4 py-2 bg-primary/5 border-b text-sm">
          <FileText className="w-4 h-4 text-primary" />
          <span className="flex-1 truncate text-muted-foreground">{uploadedFile}</span>
          <button onClick={() => setUploadedFile(null)}><X className="w-4 h-4 text-muted-foreground hover:text-foreground" /></button>
        </div>
      )}
      <MessageList messages={messages} isTyping={isTyping} />
      <div className="flex items-end gap-2 px-4 pb-1">
        <input ref={fileRef} type="file" accept=".pdf,.txt,.doc,.docx" className="hidden" onChange={handleFileChange} />
        <Button variant="ghost" size="icon" className="shrink-0 mb-1" onClick={() => fileRef.current?.click()} disabled={uploading} title="Upload document">
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
        </Button>
        <div className="flex-1">
          <ChatInput onSend={sendMessage} disabled={isLoading} />
        </div>
      </div>
    </Card>
  );
}
