"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const models_1 = require("../models");
const fileUpload_1 = require("../middleware/fileUpload");
const validation_1 = require("../middleware/validation");
const zod_1 = require("zod");
// path not used
const fs_1 = __importDefault(require("fs"));
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
// Validation schemas
// removed unused uploadFilesSchema definition
// POST /api/files/upload - Upload files for a project
router.post('/upload', fileUpload_1.upload.array('files', 10), fileUpload_1.checkTotalFileSize, async (req, res) => {
    try {
        const projectId = parseInt(req.body.projectId, 10);
        const description = req.body.description;
        const isPublic = req.body.isPublic === 'true';
        if (!projectId || isNaN(projectId)) {
            return res.status(400).json({
                error: 'Valid projectId is required',
            });
        }
        const files = req.files;
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
                const fileType = (0, fileUpload_1.getFileType)(file.mimetype);
                const projectFile = await models_1.ProjectFile.create({
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
                    url: (0, fileUpload_1.getFileUrl)(projectFile.fileName),
                    uploadedAt: projectFile.createdAt,
                });
                logger_1.logger.info(`File uploaded successfully: ${file.originalname} for project ${projectId}`);
            }
            catch (error) {
                logger_1.logger.error('Error saving file record:', error);
                // Clean up the file if database save failed
                try {
                    await (0, fileUpload_1.deleteFile)(file.path);
                }
                catch (deleteError) {
                    logger_1.logger.error('Error deleting file after database failure:', deleteError);
                }
                throw error;
            }
        }
        res.status(201).json({
            message: 'Files uploaded successfully',
            files: uploadedFiles,
        });
    }
    catch (error) {
        logger_1.logger.error('File upload error:', error);
        // Clean up uploaded files on error
        if (req.files && Array.isArray(req.files)) {
            for (const file of req.files) {
                try {
                    await (0, fileUpload_1.deleteFile)(file.path);
                }
                catch (deleteError) {
                    logger_1.logger.error('Error cleaning up file:', deleteError);
                }
            }
        }
        res.status(500).json({
            error: 'Failed to upload files',
            details: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
// GET /api/files/project/:projectId - Get all files for a project
router.get('/project/:projectId', (0, validation_1.validate)({ params: zod_1.z.object({ projectId: zod_1.z.string().transform(val => parseInt(val, 10)) }) }), async (req, res) => {
    try {
        const { projectId } = req.validatedParams;
        // TODO: Add authorization check - user must own project or be admin
        const files = await models_1.ProjectFile.findAll({
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
            url: (0, fileUpload_1.getFileUrl)(file.fileName),
            uploadedAt: file.createdAt,
        }));
        res.json({
            files: filesWithUrls,
            count: files.length,
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching project files:', error);
        res.status(500).json({
            error: 'Failed to fetch files',
            details: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
// GET /api/files/:fileName - Serve file
router.get('/:fileName', async (req, res) => {
    try {
        const { fileName } = req.params;
        const projectFile = await models_1.ProjectFile.findOne({
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
        if (!fs_1.default.existsSync(filePath)) {
            logger_1.logger.error(`File not found on disk: ${filePath}`);
            return res.status(404).json({
                error: 'File not found on server',
            });
        }
        // Set appropriate headers
        res.setHeader('Content-Type', projectFile.mimeType);
        res.setHeader('Content-Length', projectFile.fileSize);
        res.setHeader('Content-Disposition', `inline; filename="${projectFile.originalName}"`);
        // Stream the file
        const fileStream = fs_1.default.createReadStream(filePath);
        fileStream.pipe(res);
    }
    catch (error) {
        logger_1.logger.error('Error serving file:', error);
        res.status(500).json({
            error: 'Failed to serve file',
            details: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
// DELETE /api/files/:fileId - Delete a file
router.delete('/:fileId', (0, validation_1.validate)({ params: zod_1.z.object({ fileId: zod_1.z.string().transform(val => parseInt(val, 10)) }) }), async (req, res) => {
    try {
        const { fileId } = req.validatedParams;
        const projectFile = await models_1.ProjectFile.findByPk(fileId);
        if (!projectFile) {
            return res.status(404).json({
                error: 'File not found',
            });
        }
        // TODO: Add authorization check - user must own project or be admin
        // Delete file from disk
        try {
            await (0, fileUpload_1.deleteFile)(projectFile.filePath);
        }
        catch (deleteError) {
            logger_1.logger.warn('File not found on disk during deletion:', deleteError);
            // Continue with database deletion even if file doesn't exist on disk
        }
        // Delete from database
        await projectFile.destroy();
        logger_1.logger.info(`File deleted successfully: ${projectFile.originalName} (ID: ${fileId})`);
        res.json({
            message: 'File deleted successfully',
        });
    }
    catch (error) {
        logger_1.logger.error('Error deleting file:', error);
        res.status(500).json({
            error: 'Failed to delete file',
            details: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
// Error handling middleware for this router
router.use(fileUpload_1.handleUploadError);
exports.default = router;
