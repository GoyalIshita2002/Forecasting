const { verifyToken } = require('../utils/jwt');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.sendStatus(401);
  }
  try {
    const user = verifyToken(token);
    req.user = user; 
    next();
  } catch (error) {
    return res.sendStatus(403); 
  }
};

module.exports = authenticateToken;