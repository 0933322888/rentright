import User from '../models/userModel.js';
import Application from '../models/applicationModel.js';
import Property from '../models/propertyModel.js';
import jwt from 'jsonwebtoken';
import path from 'path';
import fs from 'fs/promises';
import fsSync from 'fs';
import { fileURLToPath } from 'url';
import { uploadFileToS3, deleteFileFromS3, generateS3Key } from '../utils/s3.js';

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
        profilePicture: user.profilePicture,
        socialMedia: user.socialMedia || {}
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

      // Update social media fields
      if (req.body.socialMedia) {
        try {
          const socialMediaData = JSON.parse(req.body.socialMedia);
          user.socialMedia = {
            ...user.socialMedia,
            ...socialMediaData
          };
        } catch (error) {
          console.error('Error parsing social media data:', error);
          // If parsing fails, ignore the social media update
        }
      }

      // Update social media fields
      if (req.body.socialMedia) {
        try {
          const socialMediaData = JSON.parse(req.body.socialMedia);
          user.socialMedia = {
            ...user.socialMedia,
            ...socialMediaData
          };
        } catch (error) {
          console.error('Error parsing social media data:', error);
          // If parsing fails, ignore the social media update
        }
      }

      // Handle profile picture upload - support both req.files and req.file
      const profilePictureFile = req.file || (req.files && req.files.profilePicture);

      if (profilePictureFile) {
        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (!allowedTypes.includes(profilePictureFile.mimetype)) {
          return res.status(400).json({ message: 'Invalid file type. Only JPEG, PNG and GIF are allowed.' });
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (profilePictureFile.size > maxSize) {
          return res.status(400).json({ message: 'File size too large. Maximum size is 5MB.' });
        }

        const key = `profile-pictures/${user._id}/${profilePictureFile.originalname}`;
        // Read file data from disk since we're using disk storage
        const fileBuffer = fsSync.readFileSync(profilePictureFile.path);
        // Upload to S3
        const url = await uploadFileToS3(fileBuffer, key, profilePictureFile.mimetype);

        // Clean up the temporary file
        fsSync.unlinkSync(profilePictureFile.path);

        // Delete old profile picture from S3 if it exists
        if (user.profilePicture && user.profilePicture.startsWith('https://rentright-data.s3.ca-central-1.amazonaws.com/')) {
          const oldKey = user.profilePicture.replace('https://rentright-data.s3.ca-central-1.amazonaws.com/', '');
          try { await deleteFileFromS3(oldKey); } catch (e) { /* ignore */ }
        }

        user.profilePicture = url;
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
        socialMedia: updatedUser.socialMedia || {},
        token: generateToken(updatedUser._id),
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const addComment = async (req, res) => {
  try {
    const { userId } = req.params;
    const { text } = req.body;
    const adminId = req.user._id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.comments.push({
      text,
      createdBy: adminId,
      createdAt: new Date()
    });

    await user.save();

    // Populate the createdBy field of the newly added comment
    const populatedUser = await User.findById(userId)
      .populate({
        path: 'comments.createdBy',
        select: 'name email'
      });

    const newComment = populatedUser.comments[populatedUser.comments.length - 1];

    res.status(201).json(newComment);
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ message: 'Error adding comment' });
  }
};

export const getComments = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .populate({
        path: 'comments.createdBy',
        select: 'name email'
      });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(user.comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ message: 'Error fetching comments' });
  }
};

export const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Only allow admins to update users
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.phone = req.body.phone || user.phone;
    user.role = req.body.role || user.role;
    user.tenantScoring = req.body.tenantScoring !== undefined ? req.body.tenantScoring : user.tenantScoring;

    // Update social media fields
    if (req.body.socialMedia) {
      try {
        const socialMediaData = typeof req.body.socialMedia === 'string' 
          ? JSON.parse(req.body.socialMedia) 
          : req.body.socialMedia;
        user.socialMedia = {
          ...user.socialMedia,
          ...socialMediaData
        };
      } catch (error) {
        console.error('Error parsing social media data:', error);
      }
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
      socialMedia: updatedUser.socialMedia || {},
      tenantScoring: updatedUser.tenantScoring
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Only allow admins to delete users
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const { role } = req.query;
    let query = {};

    if (role) {
      query.role = role;
    }

    const users = await User.find(query)
      .select('-password')
      .populate('comments.createdBy', 'name email')
      .sort({ createdAt: -1 });

    // Calculate additional details based on user role
    const usersWithDetails = await Promise.all(
      users.map(async (user) => {
        if (user.role === 'tenant') {
          const applicationCount = await Application.countDocuments({ tenant: user._id });
          return {
            ...user.toObject(),
            applicationCount
          };
        } else if (user.role === 'landlord') {
          const propertyCount = await Property.countDocuments({ landlord: user._id });
          return {
            ...user.toObject(),
            properties: [], // We'll populate this if needed
            propertyCount
          };
        }
        return user.toObject();
      })
    );

    res.json(usersWithDetails);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 