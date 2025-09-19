# Chatbot API Testing with TypeScript

This test directory contains TypeScript test code to test all the endpoints in the Chatbot API server.

## Setup

1. **Navigate to the test directory:**
   ```bash
   cd test
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Make sure your chatbot server is running:**
   ```bash
   # From the parent directory (AI-Services/chatbot/)
   cd ..
   python server.py
   ```
   The server should be running on `http://localhost:8000` by default.

## Running Tests

### Option 1: Direct execution with ts-node (Recommended)
```bash
npm test
# or
npx ts-node test-endpoints.ts
```

### Option 2: Compile first, then run
```bash
npm run build
node test-endpoints.js
```

### Option 3: Development mode with auto-restart
```bash
npm run dev
```

## Available Test Methods

The `ChatbotAPITester` class provides several testing options:

### 1. Run All Tests
Tests all available endpoints systematically:
```typescript
const tester = new ChatbotAPITester('http://localhost:8000');
await tester.runAllTests();
```

### 2. Chat Scenario Test
Tests a complete chat flow:
```typescript
await tester.runChatScenario('test-user-123');
```

### 3. Emotion Scenario Test
Tests emotion-based quote generation:
```typescript
await tester.runEmotionScenario();
```

### 4. Individual Endpoint Tests
Test specific endpoints:
```typescript
// GET endpoints
await tester.testHealthCheck();
await tester.testSimpleTest();
await tester.testListEndpoints();
await tester.testModelInfo();

// POST endpoints
await tester.testChat('Hello!', 'user123');
await tester.testGetQuoteThought('happy');
await tester.testGetInitialMessage('user123');
await tester.testStoreQuestionInfo('What is anxiety?', 'user123');
await tester.testAppExit('user123');
await tester.testHardReset('user123');
await tester.testGetHistory('user123');
await tester.testReset('user123');
```

## Customizing Tests

### Change Server URL
```typescript
const tester = new ChatbotAPITester('http://your-server-url:port');
```

### Modify Test Data
Edit the test methods in `test-endpoints.ts` to use different:
- User IDs
- Messages
- Emotions
- Test scenarios

## API Endpoints Tested

### GET Endpoints
- `GET /` - Health check
- `GET /test` - Simple test
- `GET /endpoints` - List all endpoints
- `GET /info` - Model information

### POST Endpoints
- `POST /chat` - Send message to chatbot
- `POST /get-quote-thought` - Get inspirational quote based on emotion
- `POST /get-initial-message` - Get initial message for user
- `POST /store-question-info` - Store question information
- `POST /app-exit` - Handle app exit
- `POST /hard-reset` - Perform hard reset
- `POST /get-history` - Get conversation history
- `POST /reset` - Reset conversation

## Example Output

When you run the tests, you'll see detailed output like:

```
🧪 Starting comprehensive API tests...

🔬 Testing: Health Check
🚀 Making GET request to: http://localhost:8000/
✅ Response (200): {
  "status": "Chatbot server is running!",
  "timestamp": "2024-01-01 12:00:00.000000"
}
──────────────────────────────────────────────────
✅ Health Check - PASSED

🔬 Testing: Chat
🚀 Making POST request to: http://localhost:8000/chat
📤 Request body: {
  "message": "Hello! How are you today?",
  "user_id": "test-user-123"
}
✅ Response (200): {
  "reply": "Hello! I'm doing well, thank you for asking..."
}
──────────────────────────────────────────────────
✅ Chat - PASSED

📊 Test Results:
✅ Passed: 12
❌ Failed: 0
📈 Success Rate: 100.0%
```

## Troubleshooting

1. **Server not running**: Make sure `python server.py` is running on port 8000 from the parent directory
2. **Import errors**: Make sure you've installed dependencies with `npm install` in the test directory
3. **TypeScript errors**: Make sure TypeScript is installed globally or use npx
4. **Network errors**: Check if the server URL is correct in your test configuration
5. **Path issues**: Make sure you're running tests from the `/test` directory

## Using in Your Own Code

You can import and use the tester in your own TypeScript files:

```typescript
import { ChatbotAPITester } from './test-endpoints';

const tester = new ChatbotAPITester('http://localhost:8000');

// Use any of the test methods
await tester.testChat('How can I reduce stress?', 'my-user-id');
```
