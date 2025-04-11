import TenantDocument from '../models/tenantDocumentModel.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, '../uploads/tenant-documents');
const thumbnailsDir = path.join(__dirname, '../uploads/tenant-documents/thumbnails');

// Ensure directories exist
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(thumbnailsDir)) {
  fs.mkdirSync(thumbnailsDir, { recursive: true });
}

const generateThumbnail = async (filepath, filename) => {
  try {
    const thumbnailPath = path.join(thumbnailsDir, filename);
    
    // Ensure the thumbnails directory exists
    if (!fs.existsSync(thumbnailsDir)) {
      fs.mkdirSync(thumbnailsDir, { recursive: true });
    }

    // Generate thumbnail with sharp
    await sharp(filepath)
      .resize(300, 300, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ 
        quality: 80,
        progressive: true
      })
      .toFile(thumbnailPath);

    console.log('Thumbnail generated successfully:', thumbnailPath);
    return `/uploads/tenant-documents/thumbnails/${filename}`;
  } catch (error) {
    console.error('Error generating thumbnail:', error);
    return null;
  }
};

export const updateTenantProfile = async (req, res) => {
  try {
    // Check if user is a tenant
    if (req.user.role !== 'tenant') {
      return res.status(403).json({ message: 'Only tenants can update their profile' });
    }

    console.log('Files received:', req.files);
    console.log('Body received:', req.body);

    const documentFields = [
      'proofOfIdentity',
      'proofOfIncome',
      'creditHistory',
      'rentalHistory',
      'additionalDocuments'
    ];

    // Find or create tenant document record
    let tenantDocument = await TenantDocument.findOne({ tenant: req.user._id });
    if (!tenantDocument) {
      tenantDocument = new TenantDocument({ tenant: req.user._id });
    }

    // Handle each document upload
    for (const field of documentFields) {
      if (req.files && req.files[field]) {
        const files = Array.isArray(req.files[field]) ? req.files[field] : [req.files[field]];
        
        for (const file of files) {
          console.log(`Processing ${field}:`, file);
          
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
          
          // Get the file extension with dot
          const fileExt = path.extname(file.name);
          // Get the filename without extension
          const baseName = path.basename(file.name, fileExt);
          // Create sanitized filename with proper extension
          const sanitizedName = baseName.replace(/[^a-zA-Z0-9]/g, '_');
          const filename = `${uniqueSuffix}-${sanitizedName}${fileExt}`;
          
          const filepath = path.join(uploadsDir, filename);

          console.log('Saving file to:', filepath);

          // Move file to uploads directory
          await file.mv(filepath);

          // Generate thumbnail for image files
          let thumbnailUrl = null;
          if (file.mimetype.startsWith('image/')) {
            thumbnailUrl = await generateThumbnail(filepath, filename);
            console.log('Generated thumbnail URL:', thumbnailUrl);
          }

          // Update document record
          if (!tenantDocument[field]) {
            tenantDocument[field] = [];
          }
          
          tenantDocument[field].push({
            path: filepath,
            filename: filename,
            uploadedAt: new Date(),
            thumbnailUrl: thumbnailUrl,
            mimeType: file.mimetype
          });
        }
      }
    }

    // Update additional fields
    if (req.body.hasBeenEvicted) {tenantDocument.hasBeenEvicted = req.body.hasBeenEvicted;}
    if (req.body.canPayMoreThanOneMonth) tenantDocument.canPayMoreThanOneMonth = req.body.canPayMoreThanOneMonth;
    if (req.body.monthsAheadCanPay) tenantDocument.monthsAheadCanPay = req.body.monthsAheadCanPay;

    const savedDocument = await tenantDocument.save();
    console.log('Saved document:', savedDocument);

    // Format the response data with URLs
    const responseData = savedDocument.toObject();
    
    // Add URLs for each document
    documentFields.forEach(field => {
      if (responseData[field] && Array.isArray(responseData[field])) {
        responseData[field] = responseData[field].map(doc => ({
          ...doc,
          url: `/uploads/tenant-documents/${doc.filename}`,
          thumbnailUrl: doc.thumbnailUrl || `/uploads/tenant-documents/${doc.filename}`
        }));
      }
    });

    // Remove unnecessary fields
    delete responseData._id;
    delete responseData.__v;
    delete responseData.tenant;
    delete responseData.createdAt;
    delete responseData.updatedAt;

    res.json(responseData);
  } catch (error) {
    console.error('Error in updateTenantProfile:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getTenantProfile = async (req, res) => {
  try {
    const tenantDocument = await TenantDocument.findOne({ tenant: req.user._id });
    if (!tenantDocument) {
      return res.status(404).json({ message: 'Tenant profile not found' });
    }

    // Check if user has permission to view this profile
    if (req.user.role === 'tenant' && tenantDocument.tenant.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this profile' });
    }

    // Create a copy of the document to modify
    const profileData = tenantDocument.toObject();
    console.log('Profile data before URL addition:', profileData);

    // Add URLs for each document
    const documentFields = ['proofOfIdentity', 'proofOfIncome', 'creditHistory', 'rentalHistory', 'additionalDocuments'];
    documentFields.forEach(field => {
      if (profileData[field] && Array.isArray(profileData[field])) {
        profileData[field] = profileData[field].map(doc => ({
          ...doc,
          url: `/uploads/tenant-documents/${doc.filename}`,
          thumbnailUrl: doc.thumbnailUrl || `/uploads/tenant-documents/${doc.filename}`
        }));
      }
    });

    // Remove unnecessary fields
    delete profileData._id;
    delete profileData.__v;
    delete profileData.tenant;
    delete profileData.createdAt;
    delete profileData.updatedAt;

    console.log('Profile data with URLs:', profileData);
    res.json(profileData);
  } catch (error) {
    console.error('Error in getTenantProfile:', error);
    res.status(500).json({ message: error.message });
  }
};

export const deleteDocument = async (req, res) => {
  try {
    const { field, index } = req.params;
    console.log('Deleting document:', { field, index });

    const tenantDocument = await TenantDocument.findOne({ tenant: req.user._id });
    if (!tenantDocument) {
      console.log('Tenant document not found');
      return res.status(404).json({ message: 'Tenant profile not found' });
    }

    // Check if user has permission to delete this document
    if (req.user.role === 'tenant' && tenantDocument.tenant.toString() !== req.user._id.toString()) {
      console.log('Unauthorized access attempt');
      return res.status(403).json({ message: 'Not authorized to delete this document' });
    }

    // Check if the document field exists and is an array
    if (!tenantDocument[field] || !Array.isArray(tenantDocument[field])) {
      console.log('Document field not found or not an array:', field);
      return res.status(404).json({ message: 'Document field not found' });
    }

    // Check if the document at the specified index exists
    if (!tenantDocument[field][index]) {
      console.log('Document at index not found:', index);
      return res.status(404).json({ message: 'Document not found' });
    }

    const document = tenantDocument[field][index];
    console.log('Document to delete:', document);

    // Delete the original file from the filesystem
    const filepath = path.join(uploadsDir, document.filename);
    console.log('Attempting to delete file:', filepath);
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
      console.log('Original file deleted successfully');
    } else {
      console.log('Original file not found:', filepath);
    }

    // Delete the thumbnail file if it exists
    if (document.thumbnailUrl) {
      const thumbnailFilename = path.basename(document.thumbnailUrl);
      const thumbnailPath = path.join(thumbnailsDir, thumbnailFilename);
      console.log('Attempting to delete thumbnail:', thumbnailPath);
      if (fs.existsSync(thumbnailPath)) {
        fs.unlinkSync(thumbnailPath);
        console.log('Thumbnail deleted successfully');
      } else {
        console.log('Thumbnail file not found:', thumbnailPath);
      }
    }

    // Remove the document from the array
    tenantDocument[field].splice(index, 1);
    await tenantDocument.save();
    console.log('Document removed from database');

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Detailed error in deleteDocument:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      path: error.path
    });
    res.status(500).json({ 
      message: 'Failed to delete document',
      error: error.message 
    });
  }
}; 