const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const { authenticate } = require('../middleware/authMiddleware');

// Delete comment (author only)
router.delete('/:id', authenticate, postController.deleteComment);

module.exports = router;
