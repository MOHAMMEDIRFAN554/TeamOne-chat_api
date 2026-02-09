const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Use memory storage to avoid ephemeral disk issues
const storage = multer.memoryStorage();

function checkFileType(file, cb) {
    // Allowed ext
    const filetypes = /jpg|jpeg|png|pdf|zip|log|txt|csv/;
    // Requirement 7: Images, PDFs, ZIPs, Logs (.log, .txt), CSV
    // Check ext
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    // Check mime
    // Mimetype checking can be tricky for some types, relying on extension for some is okay for MVP internal tool.
    // Actually, let's just check extension for now to be safe with "log" files which might be text/plain or octet-stream.

    if (extname) {
        return cb(null, true);
    } else {
        cb(new Error('File type not supported!'));
    }
}

const upload = multer({
    storage,
    limits: { fileSize: 100 * 1024 * 1024 }, // 100MB as per requirement
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    },
});

module.exports = upload;
