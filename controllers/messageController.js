const asyncHandler = require('express-async-handler');
const Message = require('../models/Message');
const Thread = require('../models/Thread');
const Workspace = require('../models/Workspace');

// @desc    Send a message
// @route   POST /api/messages
// @access  Private
const sendMessage = asyncHandler(async (req, res) => {
    const { threadId, content, blocks } = req.body;

    if (!threadId || (!content && (!blocks || blocks.length === 0))) {
        res.status(400);
        throw new Error('Thread ID and content/blocks are required');
    }

    const thread = await Thread.findById(threadId);
    if (!thread) {
        res.status(404);
        throw new Error('Thread not found');
    }

    // Check permissions: User must be member of workspace and (if private) thread logic
    // Similar logic to getThreadById
    const workspace = await Workspace.findById(thread.workspace);
    // Optimization: use workspaceId from thread without fetching if we trust thread.workspace?
    // But we need to check workspace members.

    if (!workspace.members.some(m => m.equals(req.user._id)) && req.user.role !== 'admin') {
        res.status(403);
        throw new Error('Not authorized to post in this workspace');
    }

    if (!thread.isPublic && !thread.members.some(m => m.equals(req.user._id)) && req.user.role !== 'admin') {
        res.status(403);
        throw new Error('Not authorized to post in this private thread');
    }

    const message = await Message.create({
        threadId,
        senderId: req.user._id,
        content, // Summary or first block text
        blocks,
    });

    // Update thread lastMessageAt
    thread.lastMessageAt = Date.now();
    await thread.save();

    // Populate sender info
    const populatedMessage = await message.populate('senderId', 'name email');

    res.status(201).json(populatedMessage);
});

// @desc    Get messages for a thread
// @route   GET /api/messages
// @access  Private
const getMessages = asyncHandler(async (req, res) => {
    const { threadId } = req.query;

    if (!threadId) {
        res.status(400);
        throw new Error('Thread ID required');
    }

    const thread = await Thread.findById(threadId);
    if (!thread) {
        res.status(404);
        throw new Error('Thread not found');
    }

    // Access check logic (same as above)
    const workspace = await Workspace.findById(thread.workspace);

    if (!workspace.members.some(m => m.equals(req.user._id)) && req.user.role !== 'admin') {
        res.status(403);
        throw new Error('Not authorized to view messages');
    }

    if (!thread.isPublic && !thread.members.some(m => m.equals(req.user._id)) && req.user.role !== 'admin') {
        res.status(403);
        throw new Error('Not authorized to view private thread messages');
    }

    const messages = await Message.find({ threadId })
        .populate('senderId', 'name email')
        .sort({ createdAt: 1 }); // Oldest first? 
    // For chat apps, usually we load newest first (pagination) but display oldest at top.
    // For simpler MVP, just return all sorted by time.

    res.json(messages);
});

// @desc    Update a message
// @route   PUT /api/messages/:id
// @access  Private
const updateMessage = asyncHandler(async (req, res) => {
    const message = await Message.findById(req.params.id);

    if (!message) {
        res.status(404);
        throw new Error('Message not found');
    }

    // Check ownership
    // "Free edit & delete (no audit enforcement)" - but only by sender?
    // Usually only sender or admin can edit.
    if (!message.senderId.equals(req.user._id) && req.user.role !== 'admin') {
        res.status(403);
        throw new Error('Not authorized to edit this message');
    }

    message.content = req.body.content || message.content;
    message.blocks = req.body.blocks || message.blocks;
    message.isEdited = true;

    const updatedMessage = await message.save();
    res.json(updatedMessage);
});

// @desc    Delete a message
// @route   DELETE /api/messages/:id
// @access  Private
const deleteMessage = asyncHandler(async (req, res) => {
    const message = await Message.findById(req.params.id);

    if (!message) {
        res.status(404);
        throw new Error('Message not found');
    }

    if (!message.senderId.equals(req.user._id) && req.user.role !== 'admin') {
        res.status(403);
        throw new Error('Not authorized to delete this message');
    }

    await message.deleteOne();
    res.json({ message: 'Message removed' });
});

module.exports = {
    sendMessage,
    getMessages,
    updateMessage,
    deleteMessage
};
