const prisma = require('../config/prisma');
const { hashPassword, comparePassword, generateToken } = require('../utils/authUtils');

/**
 * Register a new user
 */
const register = async ({ name, username, email, password, bio, avatarUrl }) => {
  const normalizedEmail = email.toLowerCase().trim();
  const normalizedUsername = username.toLowerCase().trim();

  // 1. Check if email already in use
  const existingEmail = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });
  if (existingEmail) {
    const error = new Error('An account with this email already exists.');
    error.statusCode = 409;
    throw error;
  }

  // 2. Check if username already in use
  const existingUsername = await prisma.user.findUnique({
    where: { username: normalizedUsername },
  });
  if (existingUsername) {
    const error = new Error('Username is already taken. Please choose another.');
    error.statusCode = 409;
    throw error;
  }

  // 3. Hash password
  const passwordHash = await hashPassword(password);

  // 4. Create user
  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      username: normalizedUsername,
      email: normalizedEmail,
      passwordHash,
      bio: bio ? bio.trim() : '',
      avatarUrl: avatarUrl ? avatarUrl.trim() : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
    },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      bio: true,
      avatarUrl: true,
      createdAt: true,
    },
  });

  // 5. Generate token
  const token = generateToken(user);

  return { user, token };
};

/**
 * Login user via email or username
 */
const login = async ({ identifier, password }) => {
  const cleanIdentifier = identifier.toLowerCase().trim();

  // Search by either email OR username
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: cleanIdentifier },
        { username: cleanIdentifier },
      ],
    },
  });

  if (!user) {
    const error = new Error('Invalid credentials.');
    error.statusCode = 401;
    throw error;
  }

  const isPasswordValid = await comparePassword(password, user.passwordHash);
  if (!isPasswordValid) {
    const error = new Error('Invalid credentials.');
    error.statusCode = 401;
    throw error;
  }

  const userSafe = {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
  };

  const token = generateToken(userSafe);

  return { user: userSafe, token };
};

/**
 * Get current user profile with social stats
 */
const getCurrentUserProfile = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
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

  return {
    ...user,
    postsCount: user._count.posts,
    followersCount: user._count.followers,
    followingCount: user._count.following,
  };
};

module.exports = {
  register,
  login,
  getCurrentUserProfile,
};
