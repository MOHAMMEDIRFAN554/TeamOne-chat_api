const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const mongoose = require('mongoose');

dotenv.config();

connectDB();

// Protocol Enforcement: Default to production unless explicitly local
if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'production';
}

const app = express();

// Traffic Telemetry: High-fidelity request logging
app.use((req, res, next) => {
    console.log(`[NEURAL_TRAFFIC] ${new Date().toISOString()} | ${req.method} ${req.path} | Origin: ${req.get('origin') || 'Internal'}`);
    next();
});

// Deployment CORS Configuration
const allowedOrigins = [
    'https://teamone-chat.onrender.com',
    'http://localhost:5173',
    'http://localhost:3000'
];

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl)
        // Or specific allowed origins
        // Or any .onrender.com domain to prevent blockage
        if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.onrender.com')) {
            callback(null, true);
        } else {
            console.warn(`[BLOCK_CORS] Unauthorized access attempt from: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/workspaces', require('./routes/workspaceRoutes'));
app.use('/api/threads', require('./routes/threadRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/files', require('./routes/fileRoutes'));
app.use('/api/search', require('./routes/searchRoutes'));

app.get('/', (req, res) => {
    const status = {
        message: 'Neural Gateway: ONLINE',
        database: mongoose.connection.readyState === 1 ? 'CONNECTED' : 'CONNECTING/DISCONNECTED',
        environment: process.env.NODE_ENV
    };
    res.json(status);
});

app.get('/api/health', (req, res) => {
    res.json({
        status: 'UP',
        environment: process.env.NODE_ENV,
        database: mongoose.connection.readyState === 1 ? 'CONNECTED' : 'DISCONNECTED',
        timestamp: new Date().toISOString()
    });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode);
    res.json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
});

const PORT = process.env.PORT || 5000;

// Direct Listener Binding
app.listen(PORT, () => {
    console.log('--- SYSTEM_INITIALIZATION ---');
    console.log(`Neural Core: ACTIVE`);
    console.log(`Protocol Level: V4.4`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
    console.log(`Gateway Port: ${PORT}`);
    console.log(`CORS Policy: RESTRICTED`);
    console.log('--- READY_FOR_SIGNAL ---');
});

// Termination Signals & Crash Telemetry
process.on('SIGTERM', () => {
    console.log('[SYSTEM_TERMINATION] SIGTERM received. Gracefully closing neural links...');
});

process.on('SIGINT', () => {
    console.log('[SYSTEM_TERMINATION] SIGINT received. Shutting down cluster...');
});

process.on('unhandledRejection', (err) => {
    console.error(`[CRITICAL_REJECTION] Unhandled Rejection: ${err.message}`);
    console.error(err.stack);
});

process.on('uncaughtException', (err) => {
    console.error(`[CRITICAL_EXCEPTION] Uncaught Exception: ${err.message}`);
    console.error(err.stack);
    process.exit(1);
});
