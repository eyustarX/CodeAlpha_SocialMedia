const postService = require('../services/postService');
const interactionService = require('../services/interactionService');

const createPost = async (req, res, next) => {
  try {
    const { content, imageUrl } = req.body;
    const post = await postService.createPost(req.user.id, { content, imageUrl });

    res.status(201).json({
      success: true,
      message: 'Post created successfully.',
      data: post,
    });
  } catch (error) {
    next(error);
  }
};

const getGlobalFeed = async (req, res, next) => {
  try {
    const currentUserId = req.user ? req.user.id : null;
    const { page, limit } = req.query;

    const result = await postService.getGlobalFeed(currentUserId, { page, limit });

    res.status(200).json({
      success: true,
      message: 'Explore feed retrieved successfully.',
      data: result.posts,
      meta: result.meta,
    });
  } catch (error) {
    next(error);
  }
};

const getFollowingFeed = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await postService.getFollowingFeed(req.user.id, { page, limit });

    res.status(200).json({
      success: true,
      message: 'Following feed retrieved successfully.',
      data: result.posts,
      meta: result.meta,
    });
  } catch (error) {
    next(error);
  }
};

const getPost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user ? req.user.id : null;
    const post = await postService.getPostById(id, currentUserId);

    res.status(200).json({
      success: true,
      message: 'Post retrieved successfully.',
      data: post,
    });
  } catch (error) {
    next(error);
  }
};

const deletePost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await postService.deletePost(id, req.user.id);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

// --- Interactions (Likes & Comments) ---

const toggleLike = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await interactionService.toggleLike(req.user.id, id);

    res.status(200).json({
      success: true,
      message: result.message,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const addComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const comment = await interactionService.addComment(req.user.id, id, content);

    res.status(201).json({
      success: true,
      message: 'Comment added successfully.',
      data: comment,
    });
  } catch (error) {
    next(error);
  }
};

const getComments = async (req, res, next) => {
  try {
    const { id } = req.params;
    const comments = await interactionService.getPostComments(id);

    res.status(200).json({
      success: true,
      message: 'Comments retrieved successfully.',
      data: comments,
    });
  } catch (error) {
    next(error);
  }
};

const deleteComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await interactionService.deleteComment(id, req.user.id);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPost,
  getGlobalFeed,
  getFollowingFeed,
  getPost,
  deletePost,
  toggleLike,
  addComment,
  getComments,
  deleteComment,
};
