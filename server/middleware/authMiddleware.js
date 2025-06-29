import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';

export const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Set user info from JWT payload (includes role)
    req.user = {
      _id: decoded.id,
      role: decoded.role
    };

    // Optionally fetch full user data if needed
    if (req.needFullUser) {
      const fullUser = await User.findById(decoded.id).select('-password');
      if (!fullUser) {
        return res.status(401).json({ message: 'User not found' });
      }
      req.user = fullUser;
    }

    next();
  } catch (error) {
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: 'You do not have permission to perform this action'
      });
    }
    next();
  };
}; 