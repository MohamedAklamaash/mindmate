// API Response Types
export interface APIResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

// Chat Types
export interface ChatRequest {
  message: string;
  user_id: string;
}

export interface ChatResponse {
  reply: string;
}

// User Types
export interface UserIdRequest {
  user_id: string;
}

// Emotion Types
export interface EmotionRequest {
  emotion: string;
}

export interface EmotionReplyResponse {
  quote: string;
  author: string;
  thought: string;
}

// Initial Message Types
export interface InitialMessageResponse {
  message: string;
  user_id: string;
  timestamp: string;
}

// App Exit Types
export interface AppExitResponse {
  status: string;
  notifications: NotificationItem[];
  emotion_sentiment: [string | null, string | null];
  user_id: string;
  timestamp: string;
}

export interface NotificationItem {
  timestamp: string;
  notification_message: string;
}

// History Types
export interface HistoryResponse {
  history: {
    messages: ChatMessage[];
    "previous summary": string[];
    "previous insights": any[];
  };
  user_id: string;
  timestamp: string;
}

export interface ChatMessage {
  user?: string;
  ai?: string;
}

// Generic Response Types
export interface StatusResponse {
  status: string;
  user_id: string;
  timestamp: string;
  error?: string;
}

// Health Check Types
export interface HealthCheckResponse {
  status: string;
  timestamp: string;
}

export interface ModelInfoResponse {
  provider: string;
  model: string;
  client_type: string;
  [key: string]: any;
}

// Mood Analytics Types
export interface MoodEntry {
  date: string;
  emotion: string;
  sentiment: string;
}

export interface MoodAnalyticsResponse {
  analytics: {
    mood_history: MoodEntry[];
    dominant_emotion: string;
    sentiment_trend: string;
    total_days: number;
  };
  user_id: string;
  timestamp: string;
}

// Session Types
export interface Session {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  emotion: string | null;
  sentiment: string | null;
}
