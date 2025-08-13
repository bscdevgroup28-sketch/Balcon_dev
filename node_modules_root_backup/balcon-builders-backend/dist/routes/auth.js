"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const logger_1 = require("../utils/logger");
const router = express_1.default.Router();
// Mock user data for Phase 5B demo
const users = [
    { id: 1, email: 'admin@balcon.com', password: '$2b$10$hash1', role: 'super_admin' },
    { id: 2, email: 'manager@balcon.com', password: '$2b$10$hash2', role: 'project_manager' },
    { id: 3, email: 'estimator@balcon.com', password: '$2b$10$hash3', role: 'estimator' },
    { id: 4, email: 'customer@balcon.com', password: '$2b$10$hash4', role: 'customer' },
    { id: 5, email: 'sales@balcon.com', password: '$2b$10$hash5', role: 'sales_rep' },
    { id: 6, email: 'installer@balcon.com', password: '$2b$10$hash6', role: 'installer' }
];
// Login endpoint
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Email and password are required'
            });
        }
        // Find user
        const user = users.find(u => u.email === email);
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }
        // For demo purposes, accept any password
        // In real implementation, use bcrypt.compare(password, user.password)
        // Generate JWT token
        const token = jsonwebtoken_1.default.sign({
            id: user.id,
            email: user.email,
            role: user.role
        }, process.env.JWT_SECRET || 'balcon-secret-2024', { expiresIn: '24h' });
        res.json({
            success: true,
            data: {
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role
                }
            },
            message: 'Login successful'
        });
        logger_1.logger.info(`🔐 User logged in: ${email} (${user.role})`);
    }
    catch (error) {
        logger_1.logger.error('Login error:', error);
        res.status(500).json({
            success: false,
            error: 'Login failed',
            message: error instanceof Error ? error.message : 'Unknown error occurred'
        });
    }
});
// Get current user profile
router.get('/profile', (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'No token provided'
            });
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'balcon-secret-2024');
        res.json({
            success: true,
            data: {
                id: decoded.id,
                email: decoded.email,
                role: decoded.role
            }
        });
    }
    catch (error) {
        res.status(401).json({
            success: false,
            error: 'Invalid token'
        });
    }
});
// Logout endpoint (simple response)
router.post('/logout', (req, res) => {
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
});
exports.default = router;
