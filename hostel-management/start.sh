#!/bin/bash
echo "🏫 Starting Hostel Management System..."

# Start backend
echo "📦 Starting backend on port 5000..."
cd backend && npm install && npm run seed && npm run dev &

# Start frontend
echo "🌐 Starting frontend on port 3000..."
cd ../frontend && npm install && npm start &

echo "✅ System starting!"
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:5000/api/health"
wait
