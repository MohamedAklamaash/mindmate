import { API_CONFIG, ENDPOINTS } from '../constants';
import type {
  APIResponse,
  ChatRequest,
  ChatResponse,
  UserIdRequest,
  EmotionRequest,
  EmotionReplyResponse,
  InitialMessageResponse,
  AppExitResponse,
  HistoryResponse,
  StatusResponse,
  HealthCheckResponse,
  ModelInfoResponse,
  MoodAnalyticsResponse,
} from '../types/api';

class APIClient {
  private baseURL: string;
  private timeout: number;

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.timeout = API_CONFIG.TIMEOUT;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<APIResponse<T>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        return {
          error: data.error || 'Request failed',
          status: response.status,
        };
      }

      return {
        data,
        status: response.status,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return {
            error: 'Request timeout',
            status: 408,
          };
        }
        return {
          error: error.message,
          status: 500,
        };
      }
      
      return {
        error: 'Unknown error occurred',
        status: 500,
      };
    }
  }

  // Health & Info
  async healthCheck(): Promise<APIResponse<HealthCheckResponse>> {
    return this.request<HealthCheckResponse>(ENDPOINTS.HEALTH);
  }

  async getModelInfo(): Promise<APIResponse<ModelInfoResponse>> {
    return this.request<ModelInfoResponse>(ENDPOINTS.MODEL_INFO);
  }

  // Chat
  async sendMessage(message: string, userId: string): Promise<APIResponse<ChatResponse>> {
    return this.request<ChatResponse>(ENDPOINTS.CHAT, {
      method: 'POST',
      body: JSON.stringify({ message, user_id: userId } as ChatRequest),
    });
  }

  async getInitialMessage(userId: string): Promise<APIResponse<InitialMessageResponse>> {
    return this.request<InitialMessageResponse>(ENDPOINTS.GET_INITIAL_MESSAGE, {
      method: 'POST',
      body: JSON.stringify({ user_id: userId } as UserIdRequest),
    });
  }

  // Emotions
  async getQuoteThought(emotion: string): Promise<APIResponse<EmotionReplyResponse>> {
    return this.request<EmotionReplyResponse>(ENDPOINTS.GET_QUOTE_THOUGHT, {
      method: 'POST',
      body: JSON.stringify({ emotion } as EmotionRequest),
    });
  }

  // Session Management
  async appExit(userId: string): Promise<APIResponse<AppExitResponse>> {
    return this.request<AppExitResponse>(ENDPOINTS.APP_EXIT, {
      method: 'POST',
      body: JSON.stringify({ user_id: userId } as UserIdRequest),
    });
  }

  async hardReset(userId: string): Promise<APIResponse<StatusResponse>> {
    return this.request<StatusResponse>(ENDPOINTS.HARD_RESET, {
      method: 'POST',
      body: JSON.stringify({ user_id: userId } as UserIdRequest),
    });
  }

  async reset(userId: string): Promise<APIResponse<StatusResponse>> {
    return this.request<StatusResponse>(ENDPOINTS.RESET, {
      method: 'POST',
      body: JSON.stringify({ user_id: userId } as UserIdRequest),
    });
  }

  // History
  async getHistory(userId: string): Promise<APIResponse<HistoryResponse>> {
    return this.request<HistoryResponse>(ENDPOINTS.GET_HISTORY, {
      method: 'POST',
      body: JSON.stringify({ user_id: userId } as UserIdRequest),
    });
  }

  async storeQuestionInfo(message: string, userId: string): Promise<APIResponse<StatusResponse>> {
    return this.request<StatusResponse>(ENDPOINTS.STORE_QUESTION_INFO, {
      method: 'POST',
      body: JSON.stringify({ message, user_id: userId } as ChatRequest),
    });
  }

  async getMoodAnalytics(userId: string): Promise<APIResponse<MoodAnalyticsResponse>> {
    return this.request<MoodAnalyticsResponse>(ENDPOINTS.GET_MOOD_ANALYTICS, {
      method: 'POST',
      body: JSON.stringify({ user_id: userId } as UserIdRequest),
    });
  }
}

export const apiClient = new APIClient();
