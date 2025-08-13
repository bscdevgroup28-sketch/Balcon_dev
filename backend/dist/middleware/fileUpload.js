"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFile = exports.getFileUrl = exports.handleUploadError = exports.checkTotalFileSize = exports.upload = exports.getFileType = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
const fs_1 = __importDefault(require("fs"));
const environment_1 = require("../config/environment");
const logger_1 = require("../utils/logger");
// Ensure upload directory exists
const ensureUploadDir = (dirPath) => {
    if (!fs_1.default.existsSync(dirPath)) {
        fs_1.default.mkdirSync(dirPath, { recursive: true });
        logger_1.logger.info(`Created upload directory: ${dirPath}`);
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
const getFileType = (mimeType) => {
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
exports.getFileType = getFileType;
// Generate unique filename
const generateFileName = (originalName) => {
    const ext = path_1.default.extname(originalName);
    const timestamp = Date.now();
    const randomString = crypto_1.default.randomBytes(8).toString('hex');
    return `${timestamp}-${randomString}${ext}`;
};
// Storage configuration
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path_1.default.join(process.cwd(), 'uploads', 'projects');
        ensureUploadDir(uploadPath); // Ensure directory exists
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const fileName = generateFileName(file.originalname);
        cb(null, fileName);
    },
});
// File filter
const fileFilter = (req, file, cb) => {
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        const error = new Error(`Unsupported file type: ${file.mimetype}. Allowed types: ${allowedMimeTypes.join(', ')}`);
        cb(error);
    }
};
// Create multer instance
exports.upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        fileSize: maxFileSize,
        files: 10, // Max 10 files per request
    },
});
// Middleware to check total file size
const checkTotalFileSize = (req, res, next) => {
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
exports.checkTotalFileSize = checkTotalFileSize;
// Error handler for multer errors
const handleUploadError = (error, req, res, next) => {
    if (error instanceof multer_1.default.MulterError) {
        logger_1.logger.error('File upload error:', error);
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
exports.handleUploadError = handleUploadError;
// Utility function to get file URL
const getFileUrl = (fileName) => {
    return `${environment_1.config.server.baseUrl}/api/files/${fileName}`;
};
exports.getFileUrl = getFileUrl;
// Utility function to delete file
const deleteFile = (filePath) => {
    return new Promise((resolve, reject) => {
        const fs = require('fs');
        fs.unlink(filePath, (err) => {
            if (err && err.code !== 'ENOENT') {
                reject(err);
            }
            else {
                resolve();
            }
        });
    });
};
exports.deleteFile = deleteFile;
