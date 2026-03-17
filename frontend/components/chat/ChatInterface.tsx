'use client';

import { useEffect, useRef } from 'react';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { useChat } from '@/lib/hooks/useChat';
import { Card } from '@/components/ui/card';

export function ChatInterface() {
  const { messages, sendMessage, getInitialMessage, appExit, isLoading, isTyping } = useChat();
  const exitCalled = useRef(false);

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

  return (
    <Card className="flex flex-col h-[calc(100vh-12rem)] glass border-0 shadow-2xl overflow-hidden">
      <MessageList messages={messages} isTyping={isTyping} />
      <ChatInput onSend={sendMessage} disabled={isLoading} />
    </Card>
  );
}
