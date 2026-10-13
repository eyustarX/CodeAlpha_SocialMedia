const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const { authenticate } = require('../middleware/authMiddleware');
const { optionalAuthenticate } = require('../middleware/optionalAuth');

// Feed routes
router.get('/', optionalAuthenticate, postController.getGlobalFeed);
router.get('/feed', authenticate, postController.getFollowingFeed);
router.get('/:id', optionalAuthenticate, postController.getPost);

// Post creation & deletion
router.post('/', authenticate, postController.createPost);
router.delete('/:id', authenticate, postController.deletePost);

// Like toggle
router.post('/:id/like', authenticate, postController.toggleLike);

// Comment routes
router.post('/:id/comments', authenticate, postController.addComment);
router.get('/:id/comments', postController.getComments);

module.exports = router;
