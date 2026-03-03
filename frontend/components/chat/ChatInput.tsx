'use client';

import { useState, KeyboardEvent } from 'react';
import { Send, Smile } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MESSAGE_MAX_LENGTH } from '@/lib/constants';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="glass border-t p-4">
      <div className="flex gap-3 items-end max-w-5xl mx-auto">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value.slice(0, MESSAGE_MAX_LENGTH))}
          onKeyDown={handleKeyDown}
          placeholder="Share what's on your mind..."
          disabled={disabled}
          className="min-h-[60px] max-h-[200px] resize-none border-2 focus:border-primary transition-colors"
          aria-label="Chat message input"
        />
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            onClick={handleSend}
            disabled={!message.trim() || disabled}
            size="icon"
            className="h-[60px] w-[60px] shrink-0 gradient-primary shadow-lg"
            aria-label="Send message"
          >
            <Send className="h-5 w-5" />
          </Button>
        </motion.div>
      </div>
      <div className="flex items-center justify-between max-w-5xl mx-auto mt-2 px-1">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Smile className="w-4 h-4" />
          <span>Press Enter to send, Shift+Enter for new line</span>
        </div>
        <p className="text-xs text-muted-foreground">
          {message.length}/{MESSAGE_MAX_LENGTH}
        </p>
      </div>
    </div>
  );
}
