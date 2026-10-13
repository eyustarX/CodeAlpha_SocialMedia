const prisma = require('../config/prisma');

/**
 * Get public profile by username
 */
const getUserProfile = async (username, currentUserId) => {
  const user = await prisma.user.findUnique({
    where: { username: username.toLowerCase().trim() },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      bio: true,
      avatarUrl: true,
      createdAt: true,
      _count: {
        select: {
          posts: true,
          followers: true,
          following: true,
        },
      },
    },
  });

  if (!user) {
    const error = new Error('User not found.');
    error.statusCode = 404;
    throw error;
  }

  let isFollowedByMe = false;
  if (currentUserId && currentUserId !== user.id) {
    const followRecord = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: user.id,
        },
      },
    });
    isFollowedByMe = !!followRecord;
  }

  return {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
    postsCount: user._count.posts,
    followersCount: user._count.followers,
    followingCount: user._count.following,
    isFollowedByMe,
    isMe: currentUserId === user.id,
  };
};

/**
 * Get all posts created by a specific user
 */
const getUserPosts = async (username, currentUserId) => {
  const user = await prisma.user.findUnique({
    where: { username: username.toLowerCase().trim() },
    select: { id: true },
  });

  if (!user) {
    const error = new Error('User not found.');
    error.statusCode = 404;
    throw error;
  }

  const posts = await prisma.post.findMany({
    where: { authorId: user.id },
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
  });

  return posts.map((post) => ({
    id: post.id,
    content: post.content,
    imageUrl: post.imageUrl,
    createdAt: post.createdAt,
    author: post.author,
    likesCount: post._count.likes,
    commentsCount: post._count.comments,
    isLikedByMe: currentUserId ? post.likes && post.likes.length > 0 : false,
  }));
};

/**
 * Toggle follow/unfollow on a target user
 */
const toggleFollowUser = async (currentUserId, targetUserId) => {
  if (currentUserId === targetUserId) {
    const error = new Error('You cannot follow yourself.');
    error.statusCode = 400;
    throw error;
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
  });

  if (!targetUser) {
    const error = new Error('User not found.');
    error.statusCode = 404;
    throw error;
  }

  const existingFollow = await prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId: currentUserId,
        followingId: targetUserId,
      },
    },
  });

  let isFollowing = false;

  if (existingFollow) {
    // Unfollow
    await prisma.follow.delete({
      where: { id: existingFollow.id },
    });
    isFollowing = false;
  } else {
    // Follow
    await prisma.follow.create({
      data: {
        followerId: currentUserId,
        followingId: targetUserId,
      },
    });
    isFollowing = true;
  }

  // Count updated followers
  const followersCount = await prisma.follow.count({
    where: { followingId: targetUserId },
  });

  return {
    isFollowing,
    followersCount,
    message: isFollowing ? `You are now following @${targetUser.username}` : `Unfollowed @${targetUser.username}`,
  };
};

/**
 * Get user followers list
 */
const getUserFollowers = async (userId) => {
  const follows = await prisma.follow.findMany({
    where: { followingId: userId },
    include: {
      follower: {
        select: {
          id: true,
          name: true,
          username: true,
          avatarUrl: true,
          bio: true,
        },
      },
    },
  });

  return follows.map((f) => f.follower);
};

/**
 * Get user following list
 */
const getUserFollowing = async (userId) => {
  const follows = await prisma.follow.findMany({
    where: { followerId: userId },
    include: {
      following: {
        select: {
          id: true,
          name: true,
          username: true,
          avatarUrl: true,
          bio: true,
        },
      },
    },
  });

  return follows.map((f) => f.following);
};

module.exports = {
  getUserProfile,
  getUserPosts,
  toggleFollowUser,
  getUserFollowers,
  getUserFollowing,
};
