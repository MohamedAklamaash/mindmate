export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
} as const;

export const ENDPOINTS = {
  HEALTH: '/',
  MODEL_INFO: '/info',
  REGISTER: '/register',
  GET_USER: '/get-user',
  CHAT: '/chat',
  GET_INITIAL_MESSAGE: '/get-initial-message',
  GET_QUOTE_THOUGHT: '/get-quote-thought',
  APP_EXIT: '/app-exit',
  HARD_RESET: '/hard-reset',
  RESET: '/reset',
  CREATE_SESSION: '/create-session',
  GET_SESSIONS: '/get-sessions',
  DELETE_SESSION: '/delete-session',
  GET_SESSION_MESSAGES: '/get-session-messages',
  GET_MOOD_ANALYTICS: '/get-mood-analytics',
  GET_NOTIFICATIONS: '/get-notifications',
  UPLOAD_DOCUMENT: '/upload-document',
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
