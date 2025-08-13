"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidFileExtension = exports.formatFileSize = exports.cleanupTempFiles = exports.getFileStats = exports.ensureDirectoriesExist = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const logger_1 = require("./logger");
/**
 * Ensure required directories exist for file uploads
 */
const ensureDirectoriesExist = () => {
    const uploadDirs = [
        path_1.default.join(process.cwd(), 'uploads'),
        path_1.default.join(process.cwd(), 'uploads', 'projects'),
        path_1.default.join(process.cwd(), 'uploads', 'temp'),
    ];
    uploadDirs.forEach(dir => {
        if (!fs_1.default.existsSync(dir)) {
            fs_1.default.mkdirSync(dir, { recursive: true });
            logger_1.logger.info(`Created directory: ${dir}`);
        }
    });
};
exports.ensureDirectoriesExist = ensureDirectoriesExist;
/**
 * Get file stats (size, creation date, etc.)
 */
const getFileStats = (filePath) => {
    return new Promise((resolve) => {
        fs_1.default.stat(filePath, (err, stats) => {
            if (err) {
                logger_1.logger.warn(`Could not get stats for file: ${filePath}`, err);
                resolve(null);
            }
            else {
                resolve(stats);
            }
        });
    });
};
exports.getFileStats = getFileStats;
/**
 * Clean up temporary files older than specified age
 */
const cleanupTempFiles = async (maxAgeHours = 24) => {
    const tempDir = path_1.default.join(process.cwd(), 'uploads', 'temp');
    if (!fs_1.default.existsSync(tempDir)) {
        return;
    }
    const maxAge = maxAgeHours * 60 * 60 * 1000; // Convert to milliseconds
    const now = Date.now();
    try {
        const files = fs_1.default.readdirSync(tempDir);
        for (const file of files) {
            const filePath = path_1.default.join(tempDir, file);
            const stats = await (0, exports.getFileStats)(filePath);
            if (stats && (now - stats.mtime.getTime()) > maxAge) {
                fs_1.default.unlinkSync(filePath);
                logger_1.logger.info(`Cleaned up old temp file: ${file}`);
            }
        }
    }
    catch (error) {
        logger_1.logger.error('Error cleaning up temp files:', error);
    }
};
exports.cleanupTempFiles = cleanupTempFiles;
/**
 * Format file size in human readable format
 */
const formatFileSize = (bytes) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0)
        return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};
exports.formatFileSize = formatFileSize;
/**
 * Validate file extension against allowed types
 */
const isValidFileExtension = (filename, allowedExtensions) => {
    const ext = path_1.default.extname(filename).toLowerCase();
    return allowedExtensions.includes(ext);
};
exports.isValidFileExtension = isValidFileExtension;
