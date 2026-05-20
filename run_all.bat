@echo off
echo Starting SmartAttendance AI System...

:: Start Python AI Microservice
start "AI Microservice" cmd /k "cd ai_module && call venv\Scripts\activate.bat && python -m uvicorn app:app --host 0.0.0.0 --port 8000"

:: Start Node.js Backend
start "Node Backend" cmd /k "cd backend && npm run dev"

:: Start React Frontend
start "React Frontend" cmd /k "cd frontend && npm run dev"

echo All services initiated.
pause
