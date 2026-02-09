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
        res.status(400);
        throw new Error('Thread ID required');
    }

    const thread = await Thread.findById(threadId);
    if (!thread) {
        res.status(404);
        throw new Error('Thread not found');
    }

    // Check permissions (Workspace/Thread membership)
    if (thread.workspace) {
        const workspace = await Workspace.findById(thread.workspace);
        if (!workspace.members.some(m => m.equals(req.user._id)) && req.user.role !== 'admin') {
            res.status(403);
            throw new Error('Not authorized to access this workspace');
        }
    }

    if (thread.type === 'personal') {
        if (!thread.members.some(m => m.equals(req.user._id)) && req.user.role !== 'admin') {
            res.status(403);
            throw new Error('Not authorized to access private thread');
        }
    } else if (!thread.isPublic && !thread.members.some(m => m.equals(req.user._id)) && req.user.role !== 'admin') {
        res.status(403);
        throw new Error('Not authorized to access private thread');
    }

    // Convert to Base64
    const base64Content = req.file.buffer.toString('base64');

    const fileDoc = await File.create({
        originalName: req.file.originalname,
        base64Data: base64Content,
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
        res.status(404);
        throw new Error('Parent thread not found');
    }

    // Simple auth check
    if (!thread.members.some(m => m.equals(req.user._id)) && req.user.role !== 'admin') {
        res.status(403);
        throw new Error('Not authorized to access this link');
    }

    // Return the file buffer from base64
    const fileBuffer = Buffer.from(fileDoc.base64Data, 'base64');

    res.setHeader('Content-Type', fileDoc.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileDoc.originalName}"`);
    res.send(fileBuffer);
});

module.exports = {
    uploadFile,
    downloadFile
};
