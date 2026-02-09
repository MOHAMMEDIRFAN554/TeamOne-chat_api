const mongoose = require('mongoose');

const fileSchema = mongoose.Schema({
    originalName: {
        type: String,
        required: true,
    },
    base64Data: {
        type: String,
        required: true, // Direct BSON storage
    },
    mimeType: {
        type: String,
        required: true,
    },
    size: {
        type: Number,
        required: true,
    },
    uploaderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    threadId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Thread',
        required: true,
    },
    metadata: {
        type: Object, // For any extra info
    },
}, {
    timestamps: true,
});

const File = mongoose.model('File', fileSchema);

module.exports = File;
