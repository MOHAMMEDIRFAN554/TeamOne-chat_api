const asyncHandler = require('express-async-handler');
const Message = require('../models/Message');
const Thread = require('../models/Thread');
const Workspace = require('../models/Workspace');
const User = require('../models/User');

// @desc    Search messages across threads
// @route   GET /api/search
// @access  Private
const searchMessages = asyncHandler(async (req, res) => {
    const {
        query,
        workspaceId,
        threadId,
        userId,
        language,
        startDate,
        endDate,
        useRegex
    } = req.query;

    if (!query) {
        res.status(400);
        throw new Error('Search query is required');
    }

    // Build search filter
    let searchFilter = {};

    // Text search with optional regex
    let searchPattern;
    if (useRegex === 'true') {
        try {
            searchPattern = new RegExp(query, 'i');
        } catch (error) {
            res.status(400);
            throw new Error('Invalid regex pattern');
        }
    } else {
        // Escape special regex characters for literal search
        const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        searchPattern = new RegExp(escapedQuery, 'i');
    }

    // Search in content field OR in blocks
    searchFilter.$or = [
        { content: searchPattern },
        { 'blocks.content': searchPattern }
    ];

    // Filter by thread
    if (threadId) {
        searchFilter.threadId = threadId;
    }

    // Filter by sender
    if (userId) {
        searchFilter.senderId = userId;
    }

    // Filter by date range
    if (startDate || endDate) {
        searchFilter.createdAt = {};
        if (startDate) searchFilter.createdAt.$gte = new Date(startDate);
        if (endDate) searchFilter.createdAt.$lte = new Date(endDate);
    }

    // Filter by language (in code blocks)
    if (language) {
        searchFilter['blocks.language'] = language;
        searchFilter['blocks.type'] = 'code';
    }

    // Execute search
    let messages = await Message.find(searchFilter)
        .populate('senderId', 'name email')
        .populate('threadId', 'title workspace')
        .sort({ createdAt: -1 })
        .limit(100); // Limit results

    // Filter by workspace if specified (requires populated threadId)
    if (workspaceId) {
        messages = messages.filter(msg =>
            msg.threadId && msg.threadId.workspace &&
            msg.threadId.workspace.toString() === workspaceId
        );
    }

    // Check access permissions for each message
    // User must have access to the thread to see the message
    const accessibleMessages = [];

    for (const msg of messages) {
        if (!msg.threadId) continue; // Skip if thread was deleted

        const thread = await Thread.findById(msg.threadId._id);
        if (!thread) continue;

        const workspace = await Workspace.findById(thread.workspace);
        if (!workspace) continue;

        // Check workspace membership
        const isWorkspaceMember = workspace.members.some(m => m.equals(req.user._id));
        const isAdmin = req.user.role === 'admin';

        if (!isWorkspaceMember && !isAdmin) continue;

        // Check thread access (public or member)
        if (!thread.isPublic && !thread.members.some(m => m.equals(req.user._id)) && !isAdmin) {
            continue;
        }

        accessibleMessages.push(msg);
    }

    res.json({
        count: accessibleMessages.length,
        results: accessibleMessages
    });
});

module.exports = {
    searchMessages
};
