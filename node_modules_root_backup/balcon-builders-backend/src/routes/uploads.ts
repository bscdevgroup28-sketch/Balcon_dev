import { Router, Request, Response } from 'express';
import { upload, getFileType } from '../middleware/fileUpload';
import { ProjectFile } from '../models';
import { logger } from '../utils/logger';

const router = Router();

// Upload configuration limits
const uploadLimits = {
  maxFileSize: 10 * 1024 * 1024, // 10MB per file
  maxFiles: 10,
  allowedTypes: [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf', 'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/x-autocad', 'application/dwg', 'application/dxf',
    'text/plain', 'text/csv'
  ]
};

/**
 * Upload files for a project
 * POST /api/uploads/project/:projectId
 */
router.post('/project/:projectId', upload.array('files', uploadLimits.maxFiles), async (req: Request, res: Response) => {
  try {
    const projectId = parseInt(req.params.projectId, 10);
    const uploadedFiles = req.files as Express.Multer.File[];
    
    if (!uploadedFiles || uploadedFiles.length === 0) {
      return res.status(400).json({ 
        error: 'No files uploaded',
        message: 'Please select at least one file to upload' 
      });
    }

    if (isNaN(projectId)) {
      return res.status(400).json({ 
        error: 'Invalid project ID',
        message: 'Project ID must be a valid number'
      });
    }

    // Get user ID (in real app, this would come from auth middleware)
    const userId = 1; // TODO: Replace with actual user ID from authentication

    // Create database records for uploaded files
    const fileRecords = await Promise.all(
      uploadedFiles.map(async (file) => {
        const projectFile = await ProjectFile.create({
          projectId,
          uploadedBy: userId,
          originalName: file.originalname,
          fileName: file.filename,
          filePath: file.path,
          fileSize: file.size,
          mimeType: file.mimetype,
          fileType: getFileType(file.mimetype),
          isPublic: false, // Default to false, can be updated later
        });

        return {
          id: projectFile.id,
          fileName: projectFile.originalName,
          fileSize: projectFile.fileSize,
          fileType: projectFile.fileType,
          uploadedAt: projectFile.createdAt,
        };
      })
    );

    logger.info(`${uploadedFiles.length} files uploaded for project ${projectId}`, {
      projectId,
      userId,
      fileCount: uploadedFiles.length,
      files: fileRecords.map(f => ({ name: f.fileName, size: f.fileSize }))
    });

    res.status(201).json({
      message: `Successfully uploaded ${uploadedFiles.length} file(s)`,
      data: {
        projectId,
        files: fileRecords,
        uploadedCount: uploadedFiles.length,
      }
    });

  } catch (error) {
    logger.error('Error uploading files:', error);
    res.status(500).json({ 
      error: 'Upload failed',
      message: 'An error occurred while uploading files. Please try again.'
    });
  }
});

/**
 * Get files for a project
 * GET /api/uploads/project/:projectId
 */
router.get('/project/:projectId', async (req: Request, res: Response) => {
  try {
    const projectId = parseInt(req.params.projectId, 10);
    
    if (isNaN(projectId)) {
      return res.status(400).json({ 
        error: 'Invalid project ID',
        message: 'Project ID must be a valid number'
      });
    }

    const files = await ProjectFile.findAll({
      where: { projectId },
      attributes: [
        'id',
        'originalName', 
        'fileSize',
        'mimeType',
        'fileType',
        'isPublic',
        'createdAt'
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      data: {
        projectId,
        files,
        totalFiles: files.length,
        totalSize: files.reduce((sum, file) => sum + file.fileSize, 0)
      }
    });

  } catch (error) {
    logger.error('Error fetching project files:', error);
    res.status(500).json({ 
      error: 'Failed to fetch files',
      message: 'An error occurred while retrieving project files.'
    });
  }
});

/**
 * Delete a project file
 * DELETE /api/uploads/:fileId
 */
router.delete('/:fileId', async (req: Request, res: Response) => {
  try {
    const fileId = parseInt(req.params.fileId, 10);
    
    if (isNaN(fileId)) {
      return res.status(400).json({ 
        error: 'Invalid file ID',
        message: 'File ID must be a valid number'
      });
    }

    const projectFile = await ProjectFile.findByPk(fileId);
    
    if (!projectFile) {
      return res.status(404).json({ 
        error: 'File not found',
        message: 'The requested file could not be found.'
      });
    }

    // Delete physical file
    const fs = require('fs').promises;
    try {
      await fs.unlink(projectFile.filePath);
    } catch (fsError) {
      logger.warn('Could not delete physical file:', fsError);
      // Continue with database deletion even if file doesn't exist
    }

    // Delete database record
    await projectFile.destroy();

    logger.info(`File deleted: ${projectFile.originalName}`, {
      fileId,
      projectId: projectFile.projectId,
      fileName: projectFile.originalName
    });

    res.json({
      message: 'File deleted successfully',
      data: {
        fileId,
        fileName: projectFile.originalName
      }
    });

  } catch (error) {
    logger.error('Error deleting file:', error);
    res.status(500).json({ 
      error: 'Failed to delete file',
      message: 'An error occurred while deleting the file.'
    });
  }
});

/**
 * Get upload configuration and limits
 * GET /api/uploads/config
 */
router.get('/config', (req: Request, res: Response) => {
  res.json({
    data: {
      maxFileSize: uploadLimits.maxFileSize,
      maxFiles: uploadLimits.maxFiles,
      allowedTypes: uploadLimits.allowedTypes,
      maxFileSizeFormatted: `${Math.round(uploadLimits.maxFileSize / (1024 * 1024))}MB`,
    }
  });
});

export default router;
