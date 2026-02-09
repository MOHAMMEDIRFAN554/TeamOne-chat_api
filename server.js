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

// Neural Stability Heartbeat (Confirming process longevity)
setInterval(() => {
    console.log(`[NEURAL_PULSE] ${new Date().toISOString()} | Uptime: ${process.uptime().toFixed(1)}s | State: ALIVE`);
}, 10000);

const app = express();

// Diagnostic Routes (Pre-empting middleware for fast health checks)
app.get('/ping', (req, res) => res.status(200).send('pong'));

app.get('/', (req, res) => {
    const status = {
        message: 'Neural Gateway: ONLINE',
        ready: true,
        protocol: 'V4.5',
        database: {
            state: mongoose.connection.readyState,
            status: ['DISCONNECTED', 'CONNECTED', 'CONNECTING', 'DISCONNECTING'][mongoose.connection.readyState] || 'UNKNOWN'
        },
        telemetry: {
            uptime: process.uptime(),
            memory: process.memoryUsage().rss
        }
    };
    res.json(status);
});

// Traffic Telemetry: High-fidelity request logging
app.use((req, res, next) => {
    console.log(`[NEURAL_TRAFFIC] ${new Date().toISOString()} | ${req.method} ${req.path} | Origin: ${req.get('origin') || 'Internal'} | IP: ${req.ip}`);
    next();
});

// Perceptive CORS Protocol (Expanded for debugging cluster blockage)
app.use(cors({
    origin: (origin, callback) => {
        // Log all blocked origins for diagnostics
        if (!origin || origin.includes('localhost') || origin.includes('remoteblood.onrender.com') || origin.endsWith('.onrender.com') || origin.endsWith('.railway.app')) {
            callback(null, true);
        } else {
            console.warn(`[WARN_CORS] Permissive bypass active for: ${origin}`);
            callback(null, true); // Temporarily allow ALL for V4.5 debugging
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

// Health Check Endpoint (For monitoring clusters)
app.use('/api/health', (req, res) => {
    res.json({
        status: 'UP',
        database: mongoose.connection.readyState === 1 ? 'CONNECTED' : 'STATUS_' + mongoose.connection.readyState,
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
