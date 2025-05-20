const { verifyToken } = require('../utils/jwt');

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: 'No token provided' });
  
    const token = authHeader.split(' ')[1];
    try {
      const payload = verifyToken(token);
      req.user = payload;
      next();
    } catch (err) {
      res.status(401).json({ message: 'Invalid token' });
    }
};

module.exports = authMiddleware;