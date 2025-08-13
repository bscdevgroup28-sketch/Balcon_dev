import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import { Request } from 'express';
import { config } from '../config/environment';
import { logger } from '../utils/logger';

// Ensure upload directory exists
const ensureUploadDir = (dirPath: string): void => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    logger.info(`Created upload directory: ${dirPath}`);
  }
};

// File type validation
const allowedMimeTypes = [
  // Images
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/gif',
  'image/webp',
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  // CAD Files
  'application/x-autocad',
  'application/dwg',
  'application/dxf',
  // Text files
  'text/plain',
  'text/csv',
];

const maxFileSize = 10 * 1024 * 1024; // 10MB per file
const maxTotalSize = 50 * 1024 * 1024; // 50MB total per request

// Determine file type based on mime type
export const getFileType = (mimeType: string): 'document' | 'image' | 'drawing' | 'other' => {
  if (mimeType.startsWith('image/')) {
    return 'image';
  }
  if (mimeType.includes('autocad') || mimeType.includes('dwg') || mimeType.includes('dxf')) {
    return 'drawing';
  }
  if (mimeType.includes('pdf') || mimeType.includes('word') || mimeType.includes('excel') || mimeType.includes('text')) {
    return 'document';
  }
  return 'other';
};

// Generate unique filename
const generateFileName = (originalName: string): string => {
  const ext = path.extname(originalName);
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(8).toString('hex');
  return `${timestamp}-${randomString}${ext}`;
};

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), 'uploads', 'projects');
    ensureUploadDir(uploadPath); // Ensure directory exists
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const fileName = generateFileName(file.originalname);
    cb(null, fileName);
  },
});

// File filter
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new Error(`Unsupported file type: ${file.mimetype}. Allowed types: ${allowedMimeTypes.join(', ')}`);
    cb(error);
  }
};

// Create multer instance
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: maxFileSize,
    files: 10, // Max 10 files per request
  },
});

// Middleware to check total file size
export const checkTotalFileSize = (req: Request, res: any, next: any) => {
  if (!req.files || !Array.isArray(req.files)) {
    return next();
  }

  const totalSize = req.files.reduce((total, file) => total + file.size, 0);
  
  if (totalSize > maxTotalSize) {
    // Clean up uploaded files
    req.files.forEach((file) => {
      const fs = require('fs');
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    });
    
    return res.status(400).json({
      error: 'Total file size exceeds limit',
      maxSize: maxTotalSize,
      actualSize: totalSize,
    });
  }

  next();
};

// Error handler for multer errors
export const handleUploadError = (error: any, req: Request, res: any, next: any) => {
  if (error instanceof multer.MulterError) {
    logger.error('File upload error:', error);
    
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          error: 'File too large',
          maxSize: maxFileSize,
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          error: 'Too many files',
          maxFiles: 10,
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          error: 'Unexpected file field',
        });
      default:
        return res.status(400).json({
          error: 'File upload error',
          details: error.message,
        });
    }
  }

  if (error.message.includes('Unsupported file type')) {
    return res.status(400).json({
      error: 'Unsupported file type',
      details: error.message,
    });
  }

  next(error);
};

// Utility function to get file URL
export const getFileUrl = (fileName: string): string => {
  return `${config.server.baseUrl}/api/files/${fileName}`;
};

// Utility function to delete file
export const deleteFile = (filePath: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const fs = require('fs');
    fs.unlink(filePath, (err: any) => {
      if (err && err.code !== 'ENOENT') {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};
