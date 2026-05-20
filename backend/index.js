require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const connectDB = require('./utils/db');
const cors = require('cors');

const app = express();
const {authMiddleware }= require('./middleware/authMiddleware')
const authRoutes = require('./routes/auth');
const courseRoutes = require('./routes/courseRoutes');
const groupRoutes = require('./routes/groupRoutes');
const userRoutes = require('./routes/userRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const faceRecognitionRoutes = require('./routes/faceRecognition');
const classRoutes = require('./routes/classRoutes');
const classroomRoutes = require('./routes/classroomRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes')
const attendanceStatsRoutes = require('./routes/attendanceStats')
const resultRoutes = require('./routes/resultRoutes');
const emailRoutes = require('./routes/emailRoutes');
const logsRoutes = require('./routes/logsRoutes');
const parentRoutes = require('./routes/parentRoutes');
const assessmentRoutes = require('./routes/assessmentRoutes');

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: ['https://smartattend-rho.vercel.app', 'https://project-i3sw.vercel.app','https://project-bkly.vercel.app','http://localhost:5173','http://localhost:5174', "https://smartattend-ishika2236s-projects.vercel.app", "https://smartattend-rho.vercel.app", "https://smartattend-git-master-ishika2236s-projects.vercel.app"],
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        credentials: true,
    }
});

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Join room based on User ID to receive personal updates (results, personal notifications)
    socket.on('join-user', (userId) => {
        socket.join(`user_${userId}`);
        console.log(`User ${socket.id} joined room user_${userId}`);
    });

    // Join room based on Classroom ID for group updates (new classes, attendance window changes)
    socket.on('join-classroom', (classroomId) => {
        socket.join(`classroom_${classroomId}`);
        console.log(`User ${socket.id} joined room classroom_${classroomId}`);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Make io accessible to our routes
app.set('socketio', io);


// Static Files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Middleware
app.use(express.json());
app.use((req, res, next) => {
    console.log(`Incoming request: ${req.method} ${req.url}`);
    next();
});
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: ['https://smartattend-rho.vercel.app', 'https://project-i3sw.vercel.app','https://project-bkly.vercel.app','http://localhost:5173','http://localhost:5174', "https://smartattend-ishika2236s-projects.vercel.app", "https://smartattend-rho.vercel.app", "https://smartattend-git-master-ishika2236s-projects.vercel.app"],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
}));


// Routing
app.use('/api/auth', authRoutes);
app.use('/api/face-recognition', faceRecognitionRoutes);
app.use('/api/courses',authMiddleware, courseRoutes);
app.use('/api/groups',authMiddleware, groupRoutes);
app.use('/api/users',authMiddleware, userRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/classroom', classroomRoutes);
// Robust routing for attendanceStats to handle inconsistent frontend naming
const handleAttendanceStatsTypos = (req, res, next) => {
    // Redirect /api/attendance-stats or /api/attendance_stats to /api/attendanceStats
    if (req.url.includes('attendance-stats') || req.url.includes('attendance_stats') || req.url.includes('attendance_ts')) {
        req.url = req.url.replace('attendance-stats', 'attendanceStats')
                        .replace('attendance_stats', 'attendanceStats')
                        .replace('attendance_ts', 'attendanceStats');
    }
    next();
};

app.use('/api/attendanceStats', handleAttendanceStatsTypos, attendanceStatsRoutes);
// Fallback for misspelled versions
app.use('/api/attendance-stats', handleAttendanceStatsTypos, attendanceStatsRoutes);
app.use('/api/attendance_ts', handleAttendanceStatsTypos, attendanceStatsRoutes);
app.use('/api/attendance_stats', handleAttendanceStatsTypos, attendanceStatsRoutes);
app.use('/api/attendance', attendanceRoutes);

app.use('/api/results', resultRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/logs', logsRoutes);
app.use('/api/parent', parentRoutes);
app.use('/api/assessments', assessmentRoutes);

// Connect to MongoDB
connectDB();
app.get('/', (req, res) => {
    res.send('Hello World, I am the backend');
});
// Error handling middleware

// Centralized Error Handling Middleware
app.use((err, req, res, next) => {
    console.error('--- GLOBAL ERROR CAUGHT ---');
    console.error('Error Message:', err.message);
    console.error('Stack Trace:', err.stack);
    console.error('---------------------------');
    
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        message: err.message || 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

