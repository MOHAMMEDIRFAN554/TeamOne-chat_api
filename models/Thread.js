const mongoose = require('mongoose');

const threadSchema = mongoose.Schema({
    workspace: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Workspace',
        required: false,
    },
    type: {
        type: String,
        enum: ['workspace', 'personal'],
        default: 'workspace',
    },
    title: {
        type: String,
        required: true,
    },
    description: String,
    isPublic: {
        type: Boolean,
        default: true,
    },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    isArchived: {
        type: Boolean,
        default: false,
    },
    lastMessageAt: {
        type: Date,
        default: Date.now,
    },
    pinned: {
        type: Boolean,
        default: false,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    }
}, {
    timestamps: true,
});

const Thread = mongoose.model('Thread', threadSchema);

module.exports = Thread;
