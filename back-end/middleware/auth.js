import jwt from 'jsonwebtoken';

let tokenBlacklist = []; // Blacklist for logout functionality

export const authenticateToken = (req, res, next) => {
  const token = req.header('Authorization');
  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  if (tokenBlacklist.includes(token)) {
    return res.status(401).json({ message: 'Token is blacklisted. Please log in again.' });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET); // Verify token
    req.user = verified; // Attach user info to the request
    next();
  } catch (error) {
    res.status(400).json({ message: 'Invalid token.' });
  }
};
