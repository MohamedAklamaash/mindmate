import { useState, useCallback } from 'react';
import { apiClient } from '../api/client';
import { useChatStore } from '../store/chatStore';
import { useUserStore } from '../store/userStore';

export function useChat() {
  const { messages, addMessage, setLoading, setError, isLoading, error } = useChatStore();
  const { userId } = useUserStore();
  const [isTyping, setIsTyping] = useState(false);

  const sendMessage = useCallback(
    async (message: string) => {
      if (!userId || !message.trim()) return;

      setLoading(true);
      setError(null);
      
      // Add user message immediately
      addMessage({ user: message });

      try {
        const response = await apiClient.sendMessage(message, userId);
        
        if (response.error || !response.data) {
          setError(response.error || 'Failed to send message');
          return;
        }

        // Simulate typing effect
        setIsTyping(true);
        await new Promise(resolve => setTimeout(resolve, 500));
        setIsTyping(false);

        // Add AI response
        addMessage({ ai: response.data.reply });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    },
    [userId, addMessage, setLoading, setError]
  );

  const getInitialMessage = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const response = await apiClient.getInitialMessage(userId);
      
      if (response.data?.message) {
        setIsTyping(true);
        await new Promise(resolve => setTimeout(resolve, 500));
        setIsTyping(false);
        addMessage({ ai: response.data.message });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get initial message');
    } finally {
      setLoading(false);
    }
  }, [userId, addMessage, setLoading, setError]);

  return {
    messages,
    sendMessage,
    getInitialMessage,
    isLoading,
    isTyping,
    error,
  };
}
