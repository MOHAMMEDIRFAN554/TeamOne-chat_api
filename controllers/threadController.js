const asyncHandler = require('express-async-handler');
const Thread = require('../models/Thread');
const Workspace = require('../models/Workspace');
const User = require('../models/User');

// @desc    Create a new thread (Workspace or Personal)
// @route   POST /api/threads
// @access  Private
const createThread = asyncHandler(async (req, res) => {
    const { workspaceId, title, description, isPublic, members, type, recipientId } = req.body;

    if (type === 'personal') {
        if (!recipientId) {
            res.status(400);
            throw new Error('Recipient ID required for personal chat');
        }

        // Check if personal thread already exists between these two users
        let thread = await Thread.findOne({
            type: 'personal',
            members: { $all: [req.user._id, recipientId] }
        }).populate('members', 'name email');

        if (thread) {
            return res.json(thread);
        }

        // Create new personal thread
        const recipient = await User.findById(recipientId);
        if (!recipient) {
            res.status(404);
            throw new Error('Recipient not found');
        }

        thread = await Thread.create({
            type: 'personal',
            title: `Chat with ${recipient.name}`, // Fallback title
            members: [req.user._id, recipientId],
            createdBy: req.user._id,
            isPublic: false
        });

        const populatedThread = await Thread.findById(thread._id).populate('members', 'name email');
        return res.status(201).json(populatedThread);
    }

    // Default: Workspace Thread
    // Verify workspace exists and user is a member
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
        res.status(404);
        throw new Error('Workspace not found');
    }

    if (!workspace.members.some(m => m.equals(req.user._id)) && req.user.role !== 'admin') {
        res.status(403);
        throw new Error('Not authorized to post in this workspace');
    }

    let threadMembers = [];
    if (!isPublic) {
        threadMembers = members ? [...members] : [];
        if (!threadMembers.includes(req.user._id.toString())) {
            threadMembers.push(req.user._id);
        }
    }

    const thread = await Thread.create({
        workspace: workspaceId,
        type: 'workspace',
        title,
        description,
        isPublic,
        members: threadMembers,
        createdBy: req.user._id,
    });

    res.status(201).json(thread);
});

// @desc    Get threads
// @route   GET /api/threads
// @access  Private
const getThreads = asyncHandler(async (req, res) => {
    const { workspaceId, type } = req.query;

    let query = {};

    if (type === 'personal') {
        query = {
            type: 'personal',
            members: req.user._id
        };
    } else if (workspaceId) {
        // Verify access to workspace
        const workspace = await Workspace.findById(workspaceId);
        if (!workspace) {
            res.status(404);
            throw new Error('Workspace not found');
        }

        if (!workspace.members.some(m => m.equals(req.user._id)) && req.user.role !== 'admin') {
            res.status(403);
            throw new Error('Not authorized to view this workspace');
        }

        query = {
            workspace: workspaceId,
            type: 'workspace',
            $or: [
                { isPublic: true },
                { members: req.user._id }
            ]
        };
    } else {
        res.status(400);
        throw new Error('Workspace ID or Personal type required');
    }

    const threads = await Thread.find(query)
        .populate('members', 'name email')
        .sort({ updatedAt: -1 });

    res.json(threads);
});

// @desc    Get thread by ID
// @route   GET /api/threads/:id
// @access  Private
const getThreadById = asyncHandler(async (req, res) => {
    const thread = await Thread.findById(req.params.id)
        .populate('members', 'name email')
        .populate('workspace', 'name');

    if (!thread) {
        res.status(404);
        throw new Error('Thread not found');
    }

    // Check access
    if (thread.type === 'personal') {
        if (!thread.members.some(m => m._id.equals(req.user._id)) && req.user.role !== 'admin') {
            res.status(403);
            throw new Error('Not authorized to view this personal thread');
        }
    } else {
        // Workspace thread
        const workspace = await Workspace.findById(thread.workspace);
        if (!workspace.members.some(m => m.equals(req.user._id)) && req.user.role !== 'admin') {
            res.status(403);
            throw new Error('Not authorized (Workspace access denied)');
        }

        if (!thread.isPublic && !thread.members.some(m => m._id.equals(req.user._id)) && req.user.role !== 'admin') {
            res.status(403);
            throw new Error('Not authorized to view private thread');
        }
    }

    res.json(thread);
});

// @desc    Update thread
// @route   PUT /api/threads/:id
// @access  Private
const updateThread = asyncHandler(async (req, res) => {
    const thread = await Thread.findById(req.params.id);

    if (!thread) {
        res.status(404);
        throw new Error('Thread not found');
    }

    if (req.user.role !== 'admin' && !thread.createdBy.equals(req.user._id)) {
        res.status(403);
        throw new Error('Not authorized to update this thread');
    }

    thread.title = req.body.title || thread.title;
    thread.description = req.body.description || thread.description;
    if (req.body.isArchived !== undefined) thread.isArchived = req.body.isArchived;
    if (req.body.pinned !== undefined) thread.pinned = req.body.pinned;

    if (req.body.members && !thread.isPublic) {
        thread.members = req.body.members;
    }

    const updatedThread = await thread.save();
    res.json(updatedThread);
});

module.exports = {
    createThread,
    getThreads,
    getThreadById,
    updateThread
};
