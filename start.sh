#!/bin/bash

# MindMate Quick Start Script

echo "🧠 MindMate - Quick Start"
echo "========================="
echo ""

# Check if we're in the right directory
if [ ! -d "AI-Services" ] || [ ! -d "frontend" ]; then
    echo "❌ Error: Please run this script from the MindMate root directory"
    exit 1
fi

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command_exists python3; then
    echo "❌ Python 3 is not installed"
    exit 1
fi

if ! command_exists node; then
    echo "❌ Node.js is not installed"
    exit 1
fi

echo "✅ Prerequisites met"
echo ""

# Start backend
echo "🚀 Starting backend server..."
cd AI-Services

if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found. Please set up the backend first."
    exit 1
fi

source venv/bin/activate
python -m chatbot.server &
BACKEND_PID=$!
echo "✅ Backend started (PID: $BACKEND_PID)"
cd ..

# Wait for backend to be ready
echo "⏳ Waiting for backend to be ready..."
sleep 3

# Check if backend is running
if curl -s http://localhost:8000/ > /dev/null; then
    echo "✅ Backend is ready"
else
    echo "❌ Backend failed to start"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

echo ""

# Start frontend
echo "🎨 Starting frontend..."
cd frontend

if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

npm run dev &
FRONTEND_PID=$!
echo "✅ Frontend started (PID: $FRONTEND_PID)"
cd ..

echo ""
echo "✨ MindMate is running!"
echo "========================="
echo "Frontend: http://localhost:3000"
echo "Backend:  http://localhost:8000"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Trap Ctrl+C and cleanup
trap "echo ''; echo '🛑 Stopping services...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo '✅ Services stopped'; exit 0" INT

# Wait for processes
wait
