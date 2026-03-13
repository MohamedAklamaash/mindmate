export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
} as const;

export const ENDPOINTS = {
  // Health & Info
  HEALTH: '/',
  TEST: '/test',
  ENDPOINTS_LIST: '/endpoints',
  MODEL_INFO: '/info',
  
  // Chat
  CHAT: '/chat',
  GET_INITIAL_MESSAGE: '/get-initial-message',
  
  // Emotions
  GET_QUOTE_THOUGHT: '/get-quote-thought',
  
  // Session
  APP_EXIT: '/app-exit',
  HARD_RESET: '/hard-reset',
  RESET: '/reset',
  
  // History
  GET_HISTORY: '/get-history',
  STORE_QUESTION_INFO: '/store-question-info',
  GET_MOOD_ANALYTICS: '/get-mood-analytics',
} as const;

export const EMOTION_COLORS = {
  happy: 'hsl(45, 100%, 51%)',
  sad: 'hsl(210, 50%, 40%)',
  anxious: 'hsl(25, 95%, 53%)',
  calm: 'hsl(150, 40%, 50%)',
  stressed: 'hsl(0, 84%, 60%)',
  neutral: 'hsl(215, 16%, 47%)',
} as const;

export const MESSAGE_MAX_LENGTH = 2000;
export const USER_ID_KEY = 'mindmate_user_id';
