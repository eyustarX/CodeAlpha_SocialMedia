const userService = require('../services/userService');

const getProfile = async (req, res, next) => {
  try {
    const { username } = req.params;
    const currentUserId = req.user ? req.user.id : null;
    const profile = await userService.getUserProfile(username, currentUserId);

    res.status(200).json({
      success: true,
      message: 'Profile retrieved successfully.',
      data: profile,
    });
  } catch (error) {
    next(error);
  }
};

const getUserPosts = async (req, res, next) => {
  try {
    const { username } = req.params;
    const currentUserId = req.user ? req.user.id : null;
    const posts = await userService.getUserPosts(username, currentUserId);

    res.status(200).json({
      success: true,
      message: 'User posts retrieved successfully.',
      data: posts,
    });
  } catch (error) {
    next(error);
  }
};

const toggleFollow = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await userService.toggleFollowUser(req.user.id, id);

    res.status(200).json({
      success: true,
      message: result.message,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getFollowers = async (req, res, next) => {
  try {
    const { id } = req.params;
    const followers = await userService.getUserFollowers(id);

    res.status(200).json({
      success: true,
      message: 'Followers retrieved successfully.',
      data: followers,
    });
  } catch (error) {
    next(error);
  }
};

const getFollowing = async (req, res, next) => {
  try {
    const { id } = req.params;
    const following = await userService.getUserFollowing(id);

    res.status(200).json({
      success: true,
      message: 'Following list retrieved successfully.',
      data: following,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  getUserPosts,
  toggleFollow,
  getFollowers,
  getFollowing,
};
