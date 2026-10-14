const authService = require('../services/authService');

const register = async (req, res, next) => {
  try {
    const { name, username, email, password, bio, avatarUrl } = req.body;

    if (!name || !username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, username, email, and password are required.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    const result = await authService.register({
      name,
      username,
      email,
      password,
      bio,
      avatarUrl,
    });

    res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { identifier, email, username, emailOrUsername, password } = req.body;
    const userIdentifier = identifier || email || username || emailOrUsername;

    if (!userIdentifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email/Username and password are required.',
      });
    }

    const result = await authService.login({
      identifier: userIdentifier,
      password,
    });

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const profile = await authService.getCurrentUserProfile(req.user.id);
    res.status(200).json({
      success: true,
      message: 'User profile retrieved.',
      data: profile,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
};
