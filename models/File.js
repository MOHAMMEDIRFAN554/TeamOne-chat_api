const mongoose = require('mongoose');

const fileSchema = mongoose.Schema({
    originalName: {
        type: String,
        required: true,
    },
    s3Key: {
        type: String,
        required: true, // Path or S3 key
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
