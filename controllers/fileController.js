const asyncHandler = require('express-async-handler');
const File = require('../models/File');
const Thread = require('../models/Thread');
const Workspace = require('../models/Workspace');
const path = require('path');
const fs = require('fs');

const uploadFile = asyncHandler(async (req, res) => {
    const { threadId } = req.body;
    if (!req.file) {
        res.status(400);
        throw new Error('No file uploaded');
    }

    if (!threadId) {
        // Clean up file if threadId missing
        fs.unlinkSync(req.file.path);
        res.status(400);
        throw new Error('Thread ID required');
    }

    const thread = await Thread.findById(threadId);
    if (!thread) {
        fs.unlinkSync(req.file.path);
        res.status(404);
        throw new Error('Thread not found');
    }

    // Check permissions (Workspace/Thread membership)
    const workspace = await Workspace.findById(thread.workspace);
    if (!workspace.members.some(m => m.equals(req.user._id)) && req.user.role !== 'admin') {
        fs.unlinkSync(req.file.path);
        res.status(403);
        throw new Error('Not authorized to access this workspace');
    }

    if (!thread.isPublic && !thread.members.some(m => m.equals(req.user._id)) && req.user.role !== 'admin') {
        fs.unlinkSync(req.file.path);
        res.status(403);
        throw new Error('Not authorized to access private thread');
    }

    const fileDoc = await File.create({
        originalName: req.file.originalname,
        s3Key: req.file.path, // Local path for now
        mimeType: req.file.mimetype,
        size: req.file.size,
        uploaderId: req.user._id,
        threadId: threadId,
        metadata: {},
    });

    res.status(201).json(fileDoc);
});

// @desc    Download/View a file
// @route   GET /api/files/:id
// @access  Private
const downloadFile = asyncHandler(async (req, res) => {
    const fileDoc = await File.findById(req.params.id);

    if (!fileDoc) {
        res.status(404);
        throw new Error('File not found');
    }

    // Check permissions via thread
    const thread = await Thread.findById(fileDoc.threadId);
    if (!thread) {
        // Thread might be deleted but file still exists? 
        // Or orphan file.
        // For now, allow download if user is uploader? 
        // Or strict thread check?
        // Strict thread check is safer for "Files tied to threads".
        // If thread is gone, maybe file is inaccessible?
        // Let's assume thread exists. If not, 404.
        res.status(404);
        throw new Error('Parent thread not found');
    }

    const workspace = await Workspace.findById(thread.workspace);
    if (!workspace.members.some(m => m.equals(req.user._id)) && req.user.role !== 'admin') {
        res.status(403);
        throw new Error('Not authorized');
    }

    if (!thread.isPublic && !thread.members.some(m => m.equals(req.user._id)) && req.user.role !== 'admin') {
        res.status(403);
        throw new Error('Not authorized');
    }

    const filePath = path.resolve(fileDoc.s3Key);

    if (fs.existsSync(filePath)) {
        res.download(filePath, fileDoc.originalName);
    } else {
        res.status(404);
        throw new Error('File not found on server');
    }
});

module.exports = {
    uploadFile,
    downloadFile
};
