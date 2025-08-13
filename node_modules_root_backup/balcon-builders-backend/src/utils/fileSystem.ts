import fs from 'fs';
import path from 'path';
import { logger } from './logger';

/**
 * Ensure required directories exist for file uploads
 */
export const ensureDirectoriesExist = (): void => {
  const uploadDirs = [
    path.join(process.cwd(), 'uploads'),
    path.join(process.cwd(), 'uploads', 'projects'),
    path.join(process.cwd(), 'uploads', 'temp'),
  ];

  uploadDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      logger.info(`Created directory: ${dir}`);
    }
  });
};

/**
 * Get file stats (size, creation date, etc.)
 */
export const getFileStats = (filePath: string): Promise<fs.Stats | null> => {
  return new Promise((resolve) => {
    fs.stat(filePath, (err, stats) => {
      if (err) {
        logger.warn(`Could not get stats for file: ${filePath}`, err);
        resolve(null);
      } else {
        resolve(stats);
      }
    });
  });
};

/**
 * Clean up temporary files older than specified age
 */
export const cleanupTempFiles = async (maxAgeHours: number = 24): Promise<void> => {
  const tempDir = path.join(process.cwd(), 'uploads', 'temp');
  
  if (!fs.existsSync(tempDir)) {
    return;
  }

  const maxAge = maxAgeHours * 60 * 60 * 1000; // Convert to milliseconds
  const now = Date.now();

  try {
    const files = fs.readdirSync(tempDir);
    
    for (const file of files) {
      const filePath = path.join(tempDir, file);
      const stats = await getFileStats(filePath);
      
      if (stats && (now - stats.mtime.getTime()) > maxAge) {
        fs.unlinkSync(filePath);
        logger.info(`Cleaned up old temp file: ${file}`);
      }
    }
  } catch (error) {
    logger.error('Error cleaning up temp files:', error);
  }
};

/**
 * Format file size in human readable format
 */
export const formatFileSize = (bytes: number): string => {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Validate file extension against allowed types
 */
export const isValidFileExtension = (filename: string, allowedExtensions: string[]): boolean => {
  const ext = path.extname(filename).toLowerCase();
  return allowedExtensions.includes(ext);
};
