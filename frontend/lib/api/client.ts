import { API_CONFIG, ENDPOINTS } from '../constants';
import type {
  APIResponse, ChatRequest, ChatResponse, UserIdRequest,
  EmotionRequest, EmotionReplyResponse, InitialMessageResponse,
  AppExitResponse, StatusResponse, HealthCheckResponse,
  ModelInfoResponse, MoodAnalyticsResponse, Session,
} from '../types/api';

class APIClient {
  private baseURL: string;
  private timeout: number;

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.timeout = API_CONFIG.TIMEOUT;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<APIResponse<T>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers: { 'Content-Type': 'application/json', ...options.headers },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const data = await response.json();
      return response.ok ? { data, status: response.status } : { error: data.error || 'Request failed', status: response.status };
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error) {
        return { error: error.name === 'AbortError' ? 'Request timeout' : error.message, status: error.name === 'AbortError' ? 408 : 500 };
      }
      return { error: 'Unknown error', status: 500 };
    }
  }

  healthCheck = () => this.request<HealthCheckResponse>(ENDPOINTS.HEALTH);
  getModelInfo = () => this.request<ModelInfoResponse>(ENDPOINTS.MODEL_INFO);

  register = (userId: string, name: string) =>
    this.request<{ status: string }>(ENDPOINTS.REGISTER, { method: 'POST', body: JSON.stringify({ user_id: userId, name }) });

  getUser = (userId: string) =>
    this.request<{ user: { user_id: string; name: string } }>(ENDPOINTS.GET_USER, { method: 'POST', body: JSON.stringify({ user_id: userId }) });

  createSession = (userId: string, title = 'New Chat') =>
    this.request<{ session_id: string }>(ENDPOINTS.CREATE_SESSION, { method: 'POST', body: JSON.stringify({ user_id: userId, title }) });

  getSessions = (userId: string) =>
    this.request<{ sessions: Session[] }>(ENDPOINTS.GET_SESSIONS, { method: 'POST', body: JSON.stringify({ user_id: userId }) });

  deleteSession = (userId: string, sessionId: string) =>
    this.request<StatusResponse>(ENDPOINTS.DELETE_SESSION, { method: 'POST', body: JSON.stringify({ user_id: userId, session_id: sessionId }) });

  getSessionMessages = (userId: string, sessionId: string) =>
    this.request<{ messages: Array<{ user?: string; ai?: string; ts?: string }> }>(ENDPOINTS.GET_SESSION_MESSAGES, { method: 'POST', body: JSON.stringify({ user_id: userId, session_id: sessionId }) });

  sendMessage = (message: string, userId: string, sessionId: string) =>
    this.request<ChatResponse>(ENDPOINTS.CHAT, { method: 'POST', body: JSON.stringify({ message, user_id: userId, session_id: sessionId }) });

  getInitialMessage = (userId: string, sessionId: string) =>
    this.request<InitialMessageResponse>(ENDPOINTS.GET_INITIAL_MESSAGE, { method: 'POST', body: JSON.stringify({ user_id: userId, session_id: sessionId }) });

  getQuoteThought = (emotion: string) =>
    this.request<EmotionReplyResponse>(ENDPOINTS.GET_QUOTE_THOUGHT, { method: 'POST', body: JSON.stringify({ emotion } as EmotionRequest) });

  appExit = (userId: string, sessionId: string) =>
    this.request<AppExitResponse>(ENDPOINTS.APP_EXIT, { method: 'POST', body: JSON.stringify({ user_id: userId, session_id: sessionId }) });

  hardReset = (userId: string, sessionId: string) =>
    this.request<StatusResponse>(ENDPOINTS.HARD_RESET, { method: 'POST', body: JSON.stringify({ user_id: userId, session_id: sessionId }) });

  reset = (userId: string, sessionId: string) =>
    this.request<StatusResponse>(ENDPOINTS.RESET, { method: 'POST', body: JSON.stringify({ user_id: userId, session_id: sessionId }) });

  getMoodAnalytics = (userId: string) =>
    this.request<MoodAnalyticsResponse>(ENDPOINTS.GET_MOOD_ANALYTICS, { method: 'POST', body: JSON.stringify({ user_id: userId } as UserIdRequest) });

  getNotifications = (userId: string) =>
    this.request<{ notifications: Array<{ timestamp: string; notification_message: string }> }>(ENDPOINTS.GET_NOTIFICATIONS, { method: 'POST', body: JSON.stringify({ user_id: userId }) });

  async uploadDocument(file: File, userId: string, sessionId: string): Promise<APIResponse<{ status: string; chunks: number }>> {
    const form = new FormData();
    form.append('file', file);
    form.append('user_id', userId);
    form.append('session_id', sessionId);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    try {
      const res = await fetch(`${this.baseURL}${ENDPOINTS.UPLOAD_DOCUMENT}`, { method: 'POST', body: form, signal: controller.signal });
      clearTimeout(timeoutId);
      return { data: await res.json(), status: res.status };
    } catch (e) {
      clearTimeout(timeoutId);
      return { error: e instanceof Error ? e.message : 'Upload failed', status: 500 };
    }
  }
}

export const apiClient = new APIClient();
