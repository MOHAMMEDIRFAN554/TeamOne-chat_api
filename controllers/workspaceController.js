const asyncHandler = require('express-async-handler');
const Workspace = require('../models/Workspace');
const User = require('../models/User');

// @desc    Create a new workspace
// @route   POST /api/workspaces
// @access  Private/Admin
const createWorkspace = asyncHandler(async (req, res) => {
    const { name, description } = req.body;

    const workspaceExists = await Workspace.findOne({ name });

    if (workspaceExists) {
        res.status(400);
        throw new Error('Workspace already exists');
    }

    const workspace = await Workspace.create({
        name,
        description,
        createdBy: req.user._id,
        members: [req.user._id], // Creator is automatically a member
    });

    if (workspace) {
        res.status(201).json(workspace);
    } else {
        res.status(400);
        throw new Error('Invalid workspace data');
    }
});

// @desc    Get all workspaces for the current user
// @route   GET /api/workspaces
// @access  Private
const getWorkspaces = asyncHandler(async (req, res) => {
    // If admin, maybe return all?
    // Requirement says "Admin: Manage workspaces".
    // But for the "sidebar list", usually you want to see what you are part of.
    // Unless there is a separate "Admin Panel".
    // For now, let's return workspaces where user is a member.
    // IF admin wants to see all, they can use a different endpoint or we add a query param.
    // Or, if user is admin, return all.

    let workspaces;
    if (req.user.role === 'admin') {
        workspaces = await Workspace.find({});
    } else {
        workspaces = await Workspace.find({ members: req.user._id });
    }

    res.json(workspaces);
});

// @desc    Get workspace by ID
// @route   GET /api/workspaces/:id
// @access  Private
const getWorkspaceById = asyncHandler(async (req, res) => {
    const workspace = await Workspace.findById(req.params.id).populate('members', 'name email');

    if (workspace) {
        // Check if user is member or admin
        if (req.user.role !== 'admin' && !workspace.members.some(member => member._id.equals(req.user._id))) {
            res.status(403);
            throw new Error('Not authorized to access this workspace');
        }
        res.json(workspace);
    } else {
        res.status(404);
        throw new Error('Workspace not found');
    }
});

// @desc    Add member to workspace
// @route   POST /api/workspaces/:id/members
// @access  Private/Admin
const addMember = asyncHandler(async (req, res) => {
    const { userId } = req.body;
    const workspace = await Workspace.findById(req.params.id);

    if (workspace) {
        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
            res.status(404);
            throw new Error('User not found');
        }

        if (workspace.members.includes(userId)) {
            res.status(400);
            throw new Error('User already in workspace');
        }

        workspace.members.push(userId);
        await workspace.save();
        res.json(workspace);
    } else {
        res.status(404);
        throw new Error('Workspace not found');
    }
});

// @desc    Update workspace (e.g. retention policy)
// @route   PUT /api/workspaces/:id
// @access  Private/Admin
const updateWorkspace = asyncHandler(async (req, res) => {
    const workspace = await Workspace.findById(req.params.id);

    if (workspace) {
        workspace.name = req.body.name || workspace.name;
        workspace.description = req.body.description || workspace.description;

        if (req.body.retentionPolicy) {
            workspace.retentionPolicy = req.body.retentionPolicy;
        }

        const updatedWorkspace = await workspace.save();
        res.json(updatedWorkspace);
    } else {
        res.status(404);
        throw new Error('Workspace not found');
    }
});

module.exports = {
    createWorkspace,
    getWorkspaces,
    getWorkspaceById,
    addMember,
    updateWorkspace
};
