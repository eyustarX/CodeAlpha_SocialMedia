const prisma = require('../config/prisma');

/**
 * Helper to format post with aggregated counts and isLikedByMe flag
 */
const formatPost = (post, currentUserId) => {
  const isLikedByMe = currentUserId
    ? post.likes && post.likes.some((like) => like.userId === currentUserId)
    : false;

  return {
    id: post.id,
    content: post.content,
    imageUrl: post.imageUrl,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    author: post.author,
    likesCount: post._count ? post._count.likes : (post.likes ? post.likes.length : 0),
    commentsCount: post._count ? post._count.comments : (post.comments ? post.comments.length : 0),
    isLikedByMe,
  };
};

/**
 * Create a new post
 */
const createPost = async (authorId, { content, imageUrl }) => {
  if (!content || !content.trim()) {
    const error = new Error('Post content cannot be empty.');
    error.statusCode = 400;
    throw error;
  }

  const post = await prisma.post.create({
    data: {
      authorId,
      content: content.trim(),
      imageUrl: imageUrl && imageUrl.trim() ? imageUrl.trim() : null,
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
      _count: {
        select: {
          likes: true,
          comments: true,
        },
      },
    },
  });

  return formatPost(post, authorId);
};

/**
 * Get global explore feed (all posts, chronologically)
 */
const getGlobalFeed = async (currentUserId, { page = 1, limit = 10 }) => {
  const pageNumber = Math.max(1, parseInt(page, 10));
  const pageSize = Math.max(1, parseInt(limit, 10));
  const skip = (pageNumber - 1) * pageSize;

  const [totalPosts, posts] = await Promise.all([
    prisma.post.count(),
    prisma.post.findMany({
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true,
          },
        },
        likes: currentUserId ? { where: { userId: currentUserId } } : false,
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    }),
  ]);

  const totalPages = Math.ceil(totalPosts / pageSize);

  return {
    posts: posts.map((p) => formatPost(p, currentUserId)),
    meta: {
      page: pageNumber,
      limit: pageSize,
      totalPosts,
      totalPages,
      hasNextPage: pageNumber < totalPages,
      hasPrevPage: pageNumber > 1,
    },
  };
};

/**
 * Get personalized following feed (only posts from users the current user follows)
 */
const getFollowingFeed = async (currentUserId, { page = 1, limit = 10 }) => {
  const pageNumber = Math.max(1, parseInt(page, 10));
  const pageSize = Math.max(1, parseInt(limit, 10));
  const skip = (pageNumber - 1) * pageSize;

  // 1. Get IDs of all followed users
  const follows = await prisma.follow.findMany({
    where: { followerId: currentUserId },
    select: { followingId: true },
  });

  const followingIds = follows.map((f) => f.followingId);

  // Also include the user's own posts in their feed
  const targetAuthorIds = [...followingIds, currentUserId];

  const where = {
    authorId: { in: targetAuthorIds },
  };

  const [totalPosts, posts] = await Promise.all([
    prisma.post.count({ where }),
    prisma.post.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true,
          },
        },
        likes: { where: { userId: currentUserId } },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    }),
  ]);

  const totalPages = Math.ceil(totalPosts / pageSize);

  return {
    posts: posts.map((p) => formatPost(p, currentUserId)),
    meta: {
      page: pageNumber,
      limit: pageSize,
      totalPosts,
      totalPages,
      hasNextPage: pageNumber < totalPages,
      hasPrevPage: pageNumber > 1,
    },
  };
};

/**
 * Get single post details with its full comments list
 */
const getPostById = async (postId, currentUserId) => {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          username: true,
          avatarUrl: true,
          bio: true,
        },
      },
      likes: currentUserId ? { where: { userId: currentUserId } } : false,
      comments: {
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
      },
      _count: {
        select: {
          likes: true,
          comments: true,
        },
      },
    },
  });

  if (!post) {
    const error = new Error('Post not found.');
    error.statusCode = 404;
    throw error;
  }

  const formatted = formatPost(post, currentUserId);
  return {
    ...formatted,
    comments: post.comments,
  };
};

/**
 * Delete a post (author only)
 */
const deletePost = async (postId, currentUserId) => {
  const post = await prisma.post.findUnique({
    where: { id: postId },
  });

  if (!post) {
    const error = new Error('Post not found.');
    error.statusCode = 404;
    throw error;
  }

  if (post.authorId !== currentUserId) {
    const error = new Error('Forbidden: You can only delete your own posts.');
    error.statusCode = 403;
    throw error;
  }

  await prisma.post.delete({
    where: { id: postId },
  });

  return { message: 'Post deleted successfully.' };
};

module.exports = {
  createPost,
  getGlobalFeed,
  getFollowingFeed,
  getPostById,
  deletePost,
};
