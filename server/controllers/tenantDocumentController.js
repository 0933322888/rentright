import TenantDocument from '../models/tenantDocumentModel.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, '../uploads/tenant-documents');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

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
        const file = req.files[field];
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

        // Delete old file if it exists
        if (tenantDocument[field]?.filename) {
          const oldFilePath = path.join(uploadsDir, tenantDocument[field].filename);
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
          }
        }

        // Move file to uploads directory
        await file.mv(filepath);

        // Update document record
        tenantDocument[field] = {
          path: filepath,
          filename: filename,
          uploadedAt: new Date()
        };
      }
    }

    // Update additional fields
    if (req.body.hasBeenEvicted) tenantDocument.hasBeenEvicted = req.body.hasBeenEvicted;
    if (req.body.canPayMoreThanOneMonth) tenantDocument.canPayMoreThanOneMonth = req.body.canPayMoreThanOneMonth;
    if (req.body.monthsAheadCanPay) tenantDocument.monthsAheadCanPay = req.body.monthsAheadCanPay;

    const savedDocument = await tenantDocument.save();
    console.log('Saved document:', savedDocument);

    res.json(savedDocument);
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
      if (profileData[field]?.filename) {
        profileData[field] = {
          ...profileData[field],
          url: `/uploads/tenant-documents/${profileData[field].filename}`
        };
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
    const { field } = req.params;
    const tenantDocument = await TenantDocument.findOne({ tenant: req.user._id });

    if (!tenantDocument) {
      return res.status(404).json({ message: 'Tenant profile not found' });
    }

    // Check if user has permission to delete this document
    if (req.user.role === 'tenant' && tenantDocument.tenant.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this document' });
    }

    // Check if the document exists
    if (!tenantDocument[field]) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Delete the file from the filesystem
    const filepath = path.join(uploadsDir, tenantDocument[field].filename);
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }

    // Remove the document reference from the database
    tenantDocument[field] = undefined;
    await tenantDocument.save();

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error in deleteDocument:', error);
    res.status(500).json({ message: error.message });
  }
}; 