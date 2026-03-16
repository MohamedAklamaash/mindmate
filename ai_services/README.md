# MindMate ChatBot API

AI-powered mental health chatbot with mood analytics and conversation management.

## Features

- **Intelligent Conversations**: Context-aware responses using Google Gemini AI
- **Mood Analytics**: Track emotional patterns over time
- **Conversation Management**: Automatic summarization and context clearing
- **Quote Generation**: Inspirational quotes based on user emotions
- **Multi-user Support**: Individual user data isolation

## Quick Start

### Local Development

```bash
# Install dependencies
pip install -r requirements.txt

# Run server
python chatbot/server.py
```

### Docker

```bash
# Build and run
docker build -t mindmate-api .
docker run -p 8000:8000 mindmate-api
```

## API Endpoints

- `POST /chat` - Send message and get reply
- `POST /get-mood-analytics` - Get user mood analytics
- `POST /app-exit` - Handle app exit and summarization
- `POST /get-quote-thought` - Generate inspirational quotes
- `GET /endpoints` - List all available endpoints

## Configuration

Create `chatbot/config.yaml`:

```yaml
api_key: "your-gemini-api-key"
model_name: "gemini-1.5-flash"
```

## Environment Variables

- `PORT` - Server port (default: 8000)
- `HOST` - Server host (default: 0.0.0.0)

## License

MIT License
