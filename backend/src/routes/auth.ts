import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';

const router = express.Router();

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
router.post('/login', async (req: Request, res: Response) => {
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
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET || 'balcon-secret-2024',
      { expiresIn: '24h' }
    );

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

    logger.info(`🔐 User logged in: ${email} (${user.role})`);
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

// Get current user profile
router.get('/profile', (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'balcon-secret-2024') as any;
    
    res.json({
      success: true,
      data: {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role
      }
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }
});

// Logout endpoint (simple response)
router.post('/logout', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

export default router;
