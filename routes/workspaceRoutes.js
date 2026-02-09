const express = require('express');
const router = express.Router();
const {
    createWorkspace,
    getWorkspaces,
    getWorkspaceById,
    addMember,
    updateWorkspace,
} = require('../controllers/workspaceController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
    .post(protect, admin, createWorkspace)
    .get(protect, getWorkspaces);

router.route('/:id')
    .get(protect, getWorkspaceById)
    .put(protect, admin, updateWorkspace);

router.route('/:id/members')
    .post(protect, admin, addMember);

module.exports = router;
