const { verifyToken } = require('../utils/authUtils');
const prisma = require('../config/prisma');

/**
 * Optional authentication: if token is present and valid, attaches user; otherwise proceeds as guest
 */
const optionalAuthenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = verifyToken(token);
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, name: true, username: true, email: true },
      });
      if (user) req.user = user;
    }
  } catch (err) {
    // Ignore invalid token on optional auth
  }
  next();
};

module.exports = {
  optionalAuthenticate,
};
