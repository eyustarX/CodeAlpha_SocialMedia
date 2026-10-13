const prisma = require('../config/prisma');

/**
 * Toggle like on a post (atomic add/remove)
 */
const toggleLike = async (userId, postId) => {
  // 1. Verify post exists
  const post = await prisma.post.findUnique({
    where: { id: postId },
  });

  if (!post) {
    const error = new Error('Post not found.');
    error.statusCode = 404;
    throw error;
  }

  // 2. Check if user already liked this post
  const existingLike = await prisma.like.findUnique({
    where: {
      userId_postId: {
        userId,
        postId,
      },
    },
  });

  let isLiked = false;

  if (existingLike) {
    // Unlike
    await prisma.like.delete({
      where: { id: existingLike.id },
    });
    isLiked = false;
  } else {
    // Like
    await prisma.like.create({
      data: {
        userId,
        postId,
      },
    });
    isLiked = true;
  }

  // 3. Return updated like count
  const likesCount = await prisma.like.count({
    where: { postId },
  });

  return {
    isLiked,
    likesCount,
    message: isLiked ? 'Post liked.' : 'Post unliked.',
  };
};

/**
 * Add a comment to a post
 */
const addComment = async (authorId, postId, content) => {
  if (!content || !content.trim()) {
    const error = new Error('Comment content cannot be empty.');
    error.statusCode = 400;
    throw error;
  }

  // Verify post exists
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) {
    const error = new Error('Post not found.');
    error.statusCode = 404;
    throw error;
  }

  const comment = await prisma.comment.create({
    data: {
      authorId,
      postId,
      content: content.trim(),
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          username: true,
          avatarUrl: true,
        },
      },
    },
  });

  return comment;
};

/**
 * Get all comments for a post
 */
const getPostComments = async (postId) => {
  return await prisma.comment.findMany({
    where: { postId },
    orderBy: { createdAt: 'asc' },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          username: true,
          avatarUrl: true,
        },
      },
    },
  });
};

/**
 * Delete a comment (author only)
 */
const deleteComment = async (commentId, currentUserId) => {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
  });

  if (!comment) {
    const error = new Error('Comment not found.');
    error.statusCode = 404;
    throw error;
  }

  if (comment.authorId !== currentUserId) {
    const error = new Error('Forbidden: You can only delete your own comments.');
    error.statusCode = 403;
    throw error;
  }

  await prisma.comment.delete({
    where: { id: commentId },
  });

  return { message: 'Comment deleted successfully.' };
};

module.exports = {
  toggleLike,
  addComment,
  getPostComments,
  deleteComment,
};
