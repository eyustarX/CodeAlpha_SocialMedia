const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/authMiddleware');
const { optionalAuthenticate } = require('../middleware/optionalAuth');

// Profile & Posts by username
router.get('/:username', optionalAuthenticate, userController.getProfile);
router.get('/:username/posts', optionalAuthenticate, userController.getUserPosts);

// Follow / Unfollow toggle
router.post('/:id/follow', authenticate, userController.toggleFollow);

// Follow lists by User ID
router.get('/:id/followers', userController.getFollowers);
router.get('/:id/following', userController.getFollowing);

module.exports = router;
