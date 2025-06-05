import User from '../models/userModel.js';
import jwt from 'jsonwebtoken';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        profilePicture: user.profilePicture
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      if (user.role === 'admin') {
        return res.status(403).json({ message: 'Admin cannot update profile picture' });
      }

      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      user.phone = req.body.phone || user.phone;

      if (req.files && req.files.profilePicture) {
        const file = req.files.profilePicture;
        
        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (!allowedTypes.includes(file.mimetype)) {
          return res.status(400).json({ message: 'Invalid file type. Only JPEG, PNG and GIF are allowed.' });
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
          return res.status(400).json({ message: 'File size too large. Maximum size is 5MB.' });
        }

        const filename = `${user._id}-${Date.now()}${path.extname(file.name)}`;
        const uploadPath = path.join(__dirname, '../uploads/profile-pictures', filename);
        
        // Ensure directory exists
        await fs.mkdir(path.dirname(uploadPath), { recursive: true });
        
        // Move the file
        await file.mv(uploadPath);

        // Delete old profile picture if it exists
        if (user.profilePicture) {
          const oldPath = path.join(__dirname, '..', user.profilePicture);
          try {
            await fs.unlink(oldPath);
          } catch (error) {
            console.error('Error deleting old profile picture:', error);
          }
        }

        user.profilePicture = `/uploads/profile-pictures/${filename}`;
      }

      if (req.body.password) {
        user.password = req.body.password;
      }

      const updatedUser = await user.save();
      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        phone: updatedUser.phone,
        profilePicture: updatedUser.profilePicture,
        token: generateToken(updatedUser._id),
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}; 