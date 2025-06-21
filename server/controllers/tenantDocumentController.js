import TenantDocument from '../models/tenantDocumentModel.js';
import { uploadFileToS3, deleteFileFromS3, generateS3Key } from '../utils/s3.js';
import fs from 'fs';

export const updateTenantProfile = async (req, res) => {
  try {
    // Check if user is a tenant
    if (req.user.role !== 'tenant') {
      return res.status(403).json({ message: 'Only tenants can update their profile' });
    }


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
          // Read file data from disk since we're using disk storage
          const fileBuffer = fs.readFileSync(file.path);

          // Generate S3 key
          const key = generateS3Key('tenant-documents', file.originalname);
          // Upload to S3
          const url = await uploadFileToS3(fileBuffer, key, file.mimetype);

          // Clean up the temporary file
          fs.unlinkSync(file.path);

          // Update document record
          if (!tenantDocument[field]) {
            tenantDocument[field] = [];
          }
          tenantDocument[field].push({
            s3Key: key,
            filename: file.originalname,
            uploadedAt: new Date(),
            mimeType: file.mimetype,
            url: url,
            originalName: file.originalname
          });
        }
      }
    }

    // Update all profile fields
    const fieldsToUpdate = {
      // Employment & Income
      isCurrentlyEmployed: req.body.isCurrentlyEmployed,
      employmentType: req.body.employmentType,
      monthlyNetIncome: req.body.monthlyNetIncome,
      hasAdditionalIncome: req.body.hasAdditionalIncome,
      additionalIncomeDescription: req.body.additionalIncomeDescription,

      // Expenses & Debts
      monthlyDebtRepayment: req.body.monthlyDebtRepayment,
      paysChildSupport: req.body.paysChildSupport,
      childSupportAmount: req.body.childSupportAmount,

      // Rental History
      hasBeenEvicted: req.body.hasBeenEvicted,
      currentlyPaysRent: req.body.currentlyPaysRent,
      currentRentAmount: req.body.currentRentAmount,

      // Financial Preparedness
      hasTwoMonthsRentSavings: req.body.hasTwoMonthsRentSavings,
      canShareFinancialDocuments: req.body.canShareFinancialDocuments,

      // Existing fields
      canPayMoreThanOneMonth: req.body.canPayMoreThanOneMonth,
      monthsAheadCanPay: req.body.monthsAheadCanPay
    };

    // Validate required fields before updating
    const requiredFields = [
      'isCurrentlyEmployed',
      'employmentType', 
      'monthlyNetIncome',
      'hasAdditionalIncome',
      'monthlyDebtRepayment',
      'paysChildSupport',
      'hasBeenEvicted',
      'currentlyPaysRent',
      'hasTwoMonthsRentSavings',
      'canShareFinancialDocuments',
      'canPayMoreThanOneMonth'
    ];

    const missingFields = [];
    requiredFields.forEach(field => {
      if (!fieldsToUpdate[field] || fieldsToUpdate[field] === '') {
        missingFields.push(field);
      }
    });

    if (missingFields.length > 0) {
      return res.status(400).json({ 
        message: `Missing required fields: ${missingFields.join(', ')}`,
        missingFields 
      });
    }

    // Update only the fields that are provided in the request
    Object.entries(fieldsToUpdate).forEach(([field, value]) => {
      if (value !== undefined && value !== '') {
        // Convert numeric fields
        if (['monthlyNetIncome', 'monthlyDebtRepayment', 'childSupportAmount', 'currentRentAmount', 'monthsAheadCanPay'].includes(field)) {
          tenantDocument[field] = Number(value);
        } else {
          tenantDocument[field] = value;
        }
      }
    });

    const savedDocument = await tenantDocument.save();

    // Format the response data with URLs
    const responseData = savedDocument.toObject();

    // Add URLs for each document
    documentFields.forEach(field => {
      if (responseData[field] && Array.isArray(responseData[field])) {
        responseData[field] = responseData[field].map(doc => ({
          ...doc,
          url: doc.url,
          thumbnailUrl: doc.url // No thumbnail for now
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

    // Add URLs for each document
    const documentFields = ['proofOfIdentity', 'proofOfIncome', 'creditHistory', 'rentalHistory', 'additionalDocuments'];
    documentFields.forEach(field => {
      if (profileData[field] && Array.isArray(profileData[field])) {
        profileData[field] = profileData[field].map(doc => ({
          ...doc,
          url: doc.url || doc.s3Key, // Use S3 URL if available, fallback to s3Key
          thumbnailUrl: doc.thumbnailUrl || doc.url || doc.s3Key
        }));
      }
    });

    // Remove unnecessary fields
    delete profileData._id;
    delete profileData.__v;
    delete profileData.tenant;
    delete profileData.createdAt;
    delete profileData.updatedAt;

    res.json(profileData);
  } catch (error) {
    console.error('Error in getTenantProfile:', error);
    res.status(500).json({ message: error.message });
  }
};

export const deleteDocument = async (req, res) => {
  try {
    const { field, index } = req.params;

    const tenantDocument = await TenantDocument.findOne({ tenant: req.user._id });
    if (!tenantDocument) {
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

    // Delete the original file from S3
    if (document && document.s3Key) {
      try { await deleteFileFromS3(document.s3Key); } catch (e) { /* ignore */ }
    }

    // Remove the document from the array
    tenantDocument[field].splice(index, 1);
    await tenantDocument.save();

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