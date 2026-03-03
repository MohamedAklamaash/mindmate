'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, User } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { ChatMessage } from '@/lib/types/api';

interface MessageBubbleProps {
  message: ChatMessage;
  index: number;
}

export function MessageBubble({ message, index }: MessageBubbleProps) {
  const isUser = 'user' in message && message.user;
  const text = isUser ? message.user : message.ai;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={cn(
        'flex gap-3 mb-6',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: index * 0.05 + 0.1, type: 'spring' }}
      >
        <Avatar className={cn(
          'h-10 w-10 shrink-0 border-2',
          isUser ? 'gradient-primary border-primary' : 'bg-gradient-to-br from-purple-500 to-pink-500 border-secondary'
        )}>
          <AvatarFallback className="bg-transparent">
            {isUser ? <User className="h-5 w-5 text-white" /> : <Bot className="h-5 w-5 text-white" />}
          </AvatarFallback>
        </Avatar>
      </motion.div>

      <motion.div
        className={cn(
          'rounded-2xl px-5 py-3 max-w-[75%] shadow-md',
          isUser
            ? 'gradient-primary text-white'
            : 'glass text-foreground'
        )}
        whileHover={{ scale: 1.02 }}
        transition={{ type: 'spring', stiffness: 300 }}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{text}</p>
      </motion.div>
    </motion.div>
  );
}

interface TypingIndicatorProps {
  show: boolean;
}

export function TypingIndicator({ show }: TypingIndicatorProps) {
  if (!show) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex gap-3 mb-6"
    >
      <Avatar className="h-10 w-10 shrink-0 bg-gradient-to-br from-purple-500 to-pink-500 border-2 border-secondary">
        <AvatarFallback className="bg-transparent">
          <Bot className="h-5 w-5 text-white" />
        </AvatarFallback>
      </Avatar>

      <div className="glass rounded-2xl px-5 py-4 shadow-md">
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-primary rounded-full"
              animate={{ y: [0, -8, 0] }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: i * 0.15,
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

interface MessageListProps {
  messages: ChatMessage[];
  isTyping: boolean;
}

export function MessageList({ messages, isTyping }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6">
      {messages.length === 0 && !isTyping && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center h-full text-center"
        >
          <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center mb-4 animate-float">
            <Bot className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-foreground">Start a conversation</h3>
          <p className="text-muted-foreground max-w-md">
            Share what&apos;s on your mind. I&apos;m here to listen and support you.
          </p>
        </motion.div>
      )}
      <AnimatePresence mode="popLayout">
        {messages.map((message, index) => (
          <MessageBubble key={index} message={message} index={index} />
        ))}
        <TypingIndicator show={isTyping} />
      </AnimatePresence>
      <div ref={bottomRef} />
    </div>
  );
}
