import { useCallback } from 'react';
import { apiClient } from '../api/client';
import { useChatStore } from '../store/chatStore';
import { useUserStore } from '../store/userStore';

export function useChat(sessionId: string) {
  const { messages, addMessage, setMessages, setLoading, setError, setTyping, isLoading, isTyping, error } = useChatStore();
  const { userId, setEmotion, setSentiment } = useUserStore();

  const loadMessages = useCallback(async () => {
    if (!userId || !sessionId) return;
    const res = await apiClient.getSessionMessages(userId, sessionId);
    if (res.data?.messages) setMessages(res.data.messages);
  }, [userId, sessionId, setMessages]);

  const sendMessage = useCallback(async (message: string) => {
    if (!userId || !sessionId || !message.trim()) return;
    setLoading(true);
    setError(null);
    addMessage({ user: message });
    try {
      const response = await apiClient.sendMessage(message, userId, sessionId);
      if (response.error || !response.data) { setError(response.error || 'Failed'); return; }
      setTyping(true);
      await new Promise(r => setTimeout(r, 500));
      setTyping(false);
      addMessage({ ai: response.data.reply });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [userId, sessionId, addMessage, setLoading, setError, setTyping]);

  const getInitialMessage = useCallback(async () => {
    if (!userId || !sessionId) return;
    setLoading(true);
    try {
      const response = await apiClient.getInitialMessage(userId, sessionId);
      if (response.data?.message) {
        setTyping(true);
        await new Promise(r => setTimeout(r, 500));
        setTyping(false);
        addMessage({ ai: response.data.message });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get initial message');
    } finally {
      setLoading(false);
    }
  }, [userId, sessionId, addMessage, setLoading, setError, setTyping]);

  const appExit = useCallback(async () => {
    if (!userId || !sessionId) return;
    try {
      const response = await apiClient.appExit(userId, sessionId);
      if (response.data?.emotion_sentiment) {
        const [emotion, sentiment] = response.data.emotion_sentiment;
        setEmotion(emotion);
        setSentiment(sentiment);
      }
    } catch (_) {}
  }, [userId, sessionId, setEmotion, setSentiment]);

  return { messages, sendMessage, getInitialMessage, loadMessages, appExit, isLoading, isTyping, error };
}
