const mongoose = require('mongoose');

const workspaceSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
    },
    description: String,
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    retentionPolicy: {
        months: {
            type: Number,
            default: 0, // 0 = forever
        },
        updatedAt: Date
    }
}, {
    timestamps: true,
});

const Workspace = mongoose.model('Workspace', workspaceSchema);

module.exports = Workspace;
