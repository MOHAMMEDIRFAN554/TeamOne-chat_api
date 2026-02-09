const mongoose = require('mongoose');

const messageSchema = mongoose.Schema({
    threadId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Thread',
        required: true,
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    content: {
        type: String, // Optional: plain text summary or first block content for previews
    },
    blocks: [{
        type: {
            type: String,
            enum: ['text', 'code', 'file'],
            required: true,
        },
        content: {
            type: String, // For text and code
        },
        language: {
            type: String, // For code blocks
        },
        fileId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'File', // For file blocks
        },
        fileName: String, // Helpful for redundancy
        fileSize: Number,
        fileType: String,
    }],
    isEdited: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
