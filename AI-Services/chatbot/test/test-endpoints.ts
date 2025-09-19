// TypeScript test code for Chatbot API endpoints
// Run with: npx ts-node test-endpoints.ts
// Or compile and run: tsc test-endpoints.ts && node test-endpoints.js

// Request/Response interfaces matching the Python models
interface ChatRequest {
  message: string;
  user_id: string;
}

interface ChatResponse {
  reply: string;
}

interface UserIdRequest {
  user_id: string;
}

interface EmotionRequest {
  emotion: string;
}

interface EmotionReplyResponse {
  quote: string;
  author: string;
  thought: string;
}

interface InitialMessageResponse {
  message: string;
  user_id: string;
  timestamp: string;
}

interface AppExitResponse {
  status: string;
  notifications?: any;
  emotion_sentiment?: any;
  user_id: string;
  timestamp: string;
}

interface HistoryResponse {
  history: any;
  user_id: string;
  timestamp: string;
}

interface StatusResponse {
  status: string;
  user_id: string;
  timestamp: string;
}

interface HealthCheckResponse {
  status: string;
  timestamp: string;
}

interface TestResponse {
  message: string;
}

interface EndpointsResponse {
  endpoints: { [key: string]: string };
  timestamp: string;
}

class ChatbotAPITester {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:8000') {
    this.baseUrl = baseUrl;
  }

  // Helper method for making HTTP requests
  private async makeRequest<T>(
    endpoint: string, 
    method: 'GET' | 'POST' = 'GET', 
    body?: any
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (body && method === 'POST') {
      options.body = JSON.stringify(body);
    }

    try {
      console.log(`🚀 Making ${method} request to: ${url}`);
      if (body) {
        console.log(`📤 Request body:`, JSON.stringify(body, null, 2));
      }

      const response = await fetch(url, options);
      const data = await response.json() as T;

      console.log(`✅ Response (${response.status}):`, JSON.stringify(data, null, 2));
      console.log('─'.repeat(50));

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return data;
    } catch (error) {
      console.error(`❌ Error calling ${endpoint}:`, error);
      console.log('─'.repeat(50));
      throw error;
    }
  }

  // GET endpoints
  async testHealthCheck(): Promise<HealthCheckResponse> {
    return this.makeRequest<HealthCheckResponse>('/');
  }

  async testSimpleTest(): Promise<TestResponse> {
    return this.makeRequest<TestResponse>('/test');
  }

  async testListEndpoints(): Promise<EndpointsResponse> {
    return this.makeRequest<EndpointsResponse>('/endpoints');
  }

  async testModelInfo(): Promise<any> {
    return this.makeRequest<any>('/info');
  }

  // POST endpoints
  async testChat(message: string, userId: string): Promise<ChatResponse> {
    const request: ChatRequest = { message, user_id: userId };
    return this.makeRequest<ChatResponse>('/chat', 'POST', request);
  }

  async testGetQuoteThought(emotion: string): Promise<EmotionReplyResponse> {
    const request: EmotionRequest = { emotion };
    return this.makeRequest<EmotionReplyResponse>('/get-quote-thought', 'POST', request);
  }

  async testGetInitialMessage(userId: string): Promise<InitialMessageResponse> {
    const request: UserIdRequest = { user_id: userId };
    return this.makeRequest<InitialMessageResponse>('/get-initial-message', 'POST', request);
  }

  async testStoreQuestionInfo(message: string, userId: string): Promise<StatusResponse> {
    const request: ChatRequest = { message, user_id: userId };
    return this.makeRequest<StatusResponse>('/store-question-info', 'POST', request);
  }

  async testAppExit(userId: string): Promise<AppExitResponse> {
    const request: UserIdRequest = { user_id: userId };
    return this.makeRequest<AppExitResponse>('/app-exit', 'POST', request);
  }

  async testHardReset(userId: string): Promise<StatusResponse> {
    const request: UserIdRequest = { user_id: userId };
    return this.makeRequest<StatusResponse>('/hard-reset', 'POST', request);
  }

  async testGetHistory(userId: string): Promise<HistoryResponse> {
    const request: UserIdRequest = { user_id: userId };
    return this.makeRequest<HistoryResponse>('/get-history', 'POST', request);
  }

  async testReset(userId: string): Promise<StatusResponse> {
    const request: UserIdRequest = { user_id: userId };
    return this.makeRequest<StatusResponse>('/reset', 'POST', request);
  }

  // Comprehensive test runner
  async runAllTests(userId: string = 'test-user-123'): Promise<void> {
    console.log('🧪 Starting comprehensive API tests...\n');

    const tests = [
      // GET endpoints
      { name: 'Health Check', fn: () => this.testHealthCheck() },
      { name: 'Simple Test', fn: () => this.testSimpleTest() },
      { name: 'List Endpoints', fn: () => this.testListEndpoints() },
      { name: 'Model Info', fn: () => this.testModelInfo() },

      // POST endpoints
      { name: 'Get Initial Message', fn: () => this.testGetInitialMessage(userId) },
      { name: 'Chat', fn: () => this.testChat('Hello! How are you today?', userId) },
      { name: 'Store Question Info', fn: () => this.testStoreQuestionInfo('What is anxiety?', userId) },
      { name: 'Get Quote & Thought', fn: () => this.testGetQuoteThought('happy') },
      { name: 'Get History', fn: () => this.testGetHistory(userId) },
      { name: 'Reset', fn: () => this.testReset(userId) },
      { name: 'Hard Reset', fn: () => this.testHardReset(userId) },
      { name: 'App Exit', fn: () => this.testAppExit(userId) },
    ];

    let passed = 0;
    let failed = 0;

    for (const test of tests) {
      try {
        console.log(`🔬 Testing: ${test.name}`);
        await test.fn();
        passed++;
        console.log(`✅ ${test.name} - PASSED\n`);
      } catch (error) {
        failed++;
        console.log(`❌ ${test.name} - FAILED\n`);
      }
      
      // Add a small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('📊 Test Results:');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  }

  // Individual test scenarios
  async runChatScenario(userId: string = 'chat-test-user'): Promise<void> {
    console.log('💬 Running chat scenario...\n');

    try {
      // Get initial message
      await this.testGetInitialMessage(userId);
      
      // Send a few messages
      await this.testChat('Hi there!', userId);
      await this.testChat('I\'m feeling a bit anxious today', userId);
      await this.testChat('Can you help me with some coping strategies?', userId);
      
      // Store some question info
      await this.testStoreQuestionInfo('How to manage stress?', userId);
      
      // Get history
      await this.testGetHistory(userId);
      
      console.log('✅ Chat scenario completed successfully!');
    } catch (error) {
      console.error('❌ Chat scenario failed:', error);
    }
  }

  async runEmotionScenario(): Promise<void> {
    console.log('😊 Running emotion scenario...\n');

    const emotions = ['happy', 'sad', 'anxious', 'excited', 'calm', 'frustrated'];

    for (const emotion of emotions) {
      try {
        await this.testGetQuoteThought(emotion);
      } catch (error) {
        console.error(`❌ Failed to get quote for emotion: ${emotion}`);
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('✅ Emotion scenario completed!');
  }
}

// Usage examples and main execution
async function main() {
  // You can change this to your server URL
  const tester = new ChatbotAPITester('http://localhost:8000');

  console.log('🚀 Chatbot API Tester\n');
  console.log('Available test methods:');
  console.log('- runAllTests(): Run all endpoint tests');
  console.log('- runChatScenario(): Test chat flow');
  console.log('- runEmotionScenario(): Test emotion quotes');
  console.log('- Individual test methods for each endpoint\n');

  // Uncomment the test you want to run:
  
  // Run all tests
  await tester.runAllTests();
  
  // Or run specific scenarios:
  // await tester.runChatScenario();
  // await tester.runEmotionScenario();
  
  // Or test individual endpoints:
  // await tester.testHealthCheck();
  // await tester.testChat('Hello!', 'user123');
  // await tester.testGetQuoteThought('happy');
}

// Export for use in other files
export { ChatbotAPITester };

// Run if this file is executed directly
if (typeof require !== 'undefined' && require.main === module) {
  main().catch(console.error);
}
