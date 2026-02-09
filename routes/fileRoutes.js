const express = require('express');
const router = express.Router();
const {
    uploadFile,
    downloadFile
} = require('../controllers/fileController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.route('/')
    // 'file' is the key in form-data
    .post(protect, upload.single('file'), uploadFile);

router.route('/:id')
    .get(protect, downloadFile);

module.exports = router;
