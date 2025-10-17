import { Router, Response, Request } from 'express';
import { requirePolicy } from '../middleware/authEnhanced';
import { ProjectFile } from '../models';
import { upload, checkTotalFileSize, handleUploadError, getFileType, getFileUrl, deleteFile } from '../middleware/fileUpload';
import { validate, ValidatedRequest } from '../middleware/validation';
import { z } from 'zod';
// path not used
import fs from 'fs';
import { logger } from '../utils/logger';

const router = Router();

// Validation schemas
// removed unused uploadFilesSchema definition

// POST /api/files/upload - Upload files for a project
router.post(
  '/upload',
  requirePolicy('file.upload'),
  upload.array('files', 10),
  checkTotalFileSize,
  async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.body.projectId, 10);
      const description = req.body.description;
      const isPublic = req.body.isPublic === 'true';

      if (!projectId || isNaN(projectId)) {
        return res.status(400).json({
          error: 'Valid projectId is required',
        });
      }

      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        return res.status(400).json({
          error: 'No files uploaded',
        });
      }

      // TODO: Add authorization check - user must own project or be admin
      // const userId = req.user?.id;

      const uploadedFiles = [];

      for (const file of files) {
        try {
          const fileType = getFileType(file.mimetype);
          
          const projectFile = await ProjectFile.create({
            projectId,
            originalName: file.originalname,
            fileName: file.filename,
            filePath: file.path,
            mimeType: file.mimetype,
            fileSize: file.size,
            uploadedBy: 1, // TODO: Use actual user ID from authentication
            fileType,
            isPublic,
            description,
          });

          uploadedFiles.push({
            id: projectFile.id,
            originalName: projectFile.originalName,
            fileName: projectFile.fileName,
            fileType: projectFile.fileType,
            fileSize: projectFile.fileSize,
            url: getFileUrl(projectFile.fileName),
            uploadedAt: projectFile.createdAt,
          });

          logger.info(`File uploaded successfully: ${file.originalname} for project ${projectId}`);
        } catch (error) {
          logger.error('Error saving file record:', error);
          // Clean up the file if database save failed
          try {
            await deleteFile(file.path);
          } catch (deleteError) {
            logger.error('Error deleting file after database failure:', deleteError);
          }
          throw error;
        }
      }

      res.status(201).json({
        message: 'Files uploaded successfully',
        files: uploadedFiles,
      });

    } catch (error) {
      logger.error('File upload error:', error);
      
      // Clean up uploaded files on error
      if (req.files && Array.isArray(req.files)) {
        for (const file of req.files as Express.Multer.File[]) {
          try {
            await deleteFile(file.path);
          } catch (deleteError) {
            logger.error('Error cleaning up file:', deleteError);
          }
        }
      }

      res.status(500).json({
        error: 'Failed to upload files',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

// GET /api/files/project/:projectId - Get all files for a project
router.get(
  '/project/:projectId',
  requirePolicy('file.list'),
  validate({ params: z.object({ projectId: z.string().transform(val => parseInt(val, 10)) }) }),
  async (req: ValidatedRequest<any, any, { projectId: number }>, res: Response) => {
    try {
      const { projectId } = req.validatedParams!;

      // TODO: Add authorization check - user must own project or be admin

      const files = await ProjectFile.findAll({
        where: { projectId },
        order: [['createdAt', 'DESC']],
        attributes: [
          'id',
          'originalName',
          'fileName',
          'fileType',
          'fileSize',
          'isPublic',
          'description',
          'createdAt',
        ],
      });

      const filesWithUrls = files.map(file => ({
        id: file.id,
        originalName: file.originalName,
        fileName: file.fileName,
        fileType: file.fileType,
        fileSize: file.fileSize,
        isPublic: file.isPublic,
        description: file.description,
        url: getFileUrl(file.fileName),
        uploadedAt: file.createdAt,
      }));

      res.json({
        files: filesWithUrls,
        count: files.length,
      });

    } catch (error) {
      logger.error('Error fetching project files:', error);
      res.status(500).json({
        error: 'Failed to fetch files',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

// GET /api/files/:fileName - Serve file
router.get('/:fileName', requirePolicy('file.read'), async (req: Request, res: Response) => {
  try {
    const { fileName } = req.params;

    const projectFile = await ProjectFile.findOne({
      where: { fileName },
    });

    if (!projectFile) {
      return res.status(404).json({
        error: 'File not found',
      });
    }

    // TODO: Add authorization check for private files
    // if (!projectFile.isPublic) {
    //   // Check if user has access to this project
    // }

    const filePath = projectFile.filePath;

    if (!fs.existsSync(filePath)) {
      logger.error(`File not found on disk: ${filePath}`);
      return res.status(404).json({
        error: 'File not found on server',
      });
    }

    // Set appropriate headers
    res.setHeader('Content-Type', projectFile.mimeType);
    res.setHeader('Content-Length', projectFile.fileSize);
    res.setHeader('Content-Disposition', `inline; filename="${projectFile.originalName}"`);

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

  } catch (error) {
    logger.error('Error serving file:', error);
    res.status(500).json({
      error: 'Failed to serve file',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// DELETE /api/files/:fileId - Delete a file
router.delete(
  '/:fileId',
  requirePolicy('file.delete'),
  validate({ params: z.object({ fileId: z.string().transform(val => parseInt(val, 10)) }) }),
  async (req: ValidatedRequest<any, any, { fileId: number }>, res: Response) => {
    try {
      const { fileId } = req.validatedParams!;

      const projectFile = await ProjectFile.findByPk(fileId);

      if (!projectFile) {
        return res.status(404).json({
          error: 'File not found',
        });
      }

      // TODO: Add authorization check - user must own project or be admin

      // Delete file from disk
      try {
        await deleteFile(projectFile.filePath);
      } catch (deleteError) {
        logger.warn('File not found on disk during deletion:', deleteError);
        // Continue with database deletion even if file doesn't exist on disk
      }

      // Delete from database
      await projectFile.destroy();

      logger.info(`File deleted successfully: ${projectFile.originalName} (ID: ${fileId})`);

      res.json({
        message: 'File deleted successfully',
      });

    } catch (error) {
      logger.error('Error deleting file:', error);
      res.status(500).json({
        error: 'Failed to delete file',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

// Error handling middleware for this router
router.use(handleUploadError);

export default router;
