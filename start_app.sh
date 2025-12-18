#!/bin/bash

# Define ports to clear
BACKEND_PORT=3001
FRONTEND_PORT=6500

echo "🚀 Starting EasyFrenchBro Launch Sequence..."

# 1. Kill existing processes on ports
echo "🧹 Cleaning up existing processes on ports $BACKEND_PORT and $FRONTEND_PORT..."
lsof -ti:$BACKEND_PORT | xargs kill -9 2>/dev/null
lsof -ti:$FRONTEND_PORT | xargs kill -9 2>/dev/null
echo "✅ Ports cleared."

# 2. Install Dependencies
echo "📦 Installing dependencies..."
npm install
echo "✅ Dependencies installed."

# 3. Start Backend
echo "🗄️ Starting Backend Server..."
nohup node server.js > backend.log 2>&1 &
echo "✅ Backend started (pid $!). Logging to backend.log."

# 4. Start Frontend
echo "🎨 Starting Frontend..."
# Using --host to ensure network availability if needed, but simple npx vite is standard
nohup npx vite --port $FRONTEND_PORT > frontend.log 2>&1 &
echo "✅ Frontend started (pid $!). Logging to frontend.log."

# 5. Wait for servers to spin up
echo "⏳ Waiting 5 seconds for services to initialize..."
sleep 5

# 6. Launch Chrome
TARGET_URL="http://localhost:$FRONTEND_PORT"
echo "🌐 Opening $TARGET_URL in Google Chrome..."
open -a "Google Chrome" "$TARGET_URL" 2>/dev/null || open "$TARGET_URL"

echo "🎉 EasyFrenchBro is running!"
