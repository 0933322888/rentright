import TenantDocument from '../models/tenantDocumentModel.js';
import { uploadFileToS3, deleteFileFromS3, generateS3Key } from '../utils/s3.js';
import fs from 'fs';
import { parseDocumentWithOpenAI } from '../utils/aiImageRecognition.js';
import { calculateTenantScore } from '../utils/tenantScoringUtils.js';

const documentFields = [
  'proofOfIdentity', 'proofOfIncome', 'creditHistory',
  'rentalHistory', 'additionalDocuments'
];

export const uploadTenantDocument = async (req, res) => {
  try {
    if (req.user.role !== 'tenant') {
      return res.status(403).json({ message: 'Only tenants can upload documents' });
    }

    const { file } = req;
    const { field } = req.body;

    if (!file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }

    if (!field) {
      return res.status(400).json({ message: 'Document field is required.' });
    }

    const fileBuffer = fs.readFileSync(file.path);
    const key = `tenant-documents/${req.user._id}/${file.originalname}`;
    const url = await uploadFileToS3(fileBuffer, key, file.mimetype);
    fs.unlinkSync(file.path);

    // AI parsing with OpenAI
    let aiParsedData = null;
    try {
      aiParsedData = await parseDocumentWithOpenAI(url, field);
    } catch (e) {
      aiParsedData = { error: e.message };
    }

    // Save document metadata and AI result in MongoDB
    let tenantDocument = await TenantDocument.findOne({ tenant: req.user._id });
    if (!tenantDocument) {
      tenantDocument = new TenantDocument({ tenant: req.user._id });
    }
    const docMeta = {
      url,
      s3Key: key,
      filename: file.originalname,
      originalName: file.originalname,
      mimeType: file.mimetype,
      uploadedAt: new Date(),
      aiParsedData
    };
    if (!tenantDocument[field]) tenantDocument[field] = [];
    tenantDocument[field].push(docMeta);
    await tenantDocument.save();

    console.log('[tenantScore] Before calculation (upload):', tenantDocument.tenantScore);
    tenantDocument.tenantScore = calculateTenantScore(tenantDocument);
    console.log('[tenantScore] After calculation (upload):', tenantDocument.tenantScore);
    await tenantDocument.save();
    console.log('[tenantScore] Saved to DB (upload)');

    res.status(201).json({
      url,
      s3Key: key,
      filename: file.originalname,
      originalName: file.originalname,
      mimeType: file.mimetype,
      uploadedAt: new Date(),
      aiParsedData,
      tenantScore: tenantDocument.tenantScore
    });
  } catch (error) {
    console.error('Error in uploadTenantDocument:', error);
    res.status(500).json({ message: error.message });
  }
};

export const updateTenantProfile = async (req, res) => {
  try {
    // Check if user is a tenant
    if (req.user.role !== 'tenant') {
      return res.status(403).json({ message: 'Only tenants can update their profile' });
    }

    let tenantDocument = await TenantDocument.findOne({ tenant: req.user._id });
    if (!tenantDocument) {
      tenantDocument = new TenantDocument({ tenant: req.user._id });
    }

    // Directly assign document fields from req.body
    documentFields.forEach(field => {
      if (req.body[field]) {
        tenantDocument[field] = req.body[field];
      }
    });

    const fieldsToUpdate = {
      isCurrentlyEmployed: req.body.isCurrentlyEmployed,
      employmentType: req.body.employmentType,
      monthlyNetIncome: req.body.monthlyNetIncome,
      hasAdditionalIncome: req.body.hasAdditionalIncome,
      additionalIncomeDescription: req.body.additionalIncomeDescription,
      additionalIncomeAmount: req.body.additionalIncomeAmount,
      monthlyDebtRepayment: req.body.monthlyDebtRepayment,
      paysChildSupport: req.body.paysChildSupport,
      childSupportAmount: req.body.childSupportAmount,
      hasBeenEvicted: req.body.hasBeenEvicted,
      currentlyPaysRent: req.body.currentlyPaysRent,
      currentRentAmount: req.body.currentRentAmount,
      hasTwoMonthsRentSavings: req.body.hasTwoMonthsRentSavings,
      canPayMoreThanOneMonth: req.body.canPayMoreThanOneMonth,
      monthsAheadCanPay: req.body.monthsAheadCanPay,
      hasPets: req.body.hasPets,
      petCount: req.body.petCount,
      petTypes: req.body.petTypes,
      smokes: req.body.smokes,
      adultOccupants: req.body.adultOccupants,
      childOccupants: req.body.childOccupants,
      creditScore: req.body.creditScore
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
      'canPayMoreThanOneMonth',
      'hasPets',
      'smokes',
      'adultOccupants',
      'childOccupants'
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
        if (['monthlyNetIncome', 'monthlyDebtRepayment', 'childSupportAmount', 'currentRentAmount', 'monthsAheadCanPay', 'petCount', 'adultOccupants', 'childOccupants', 'creditScore', 'additionalIncomeAmount'].includes(field)) {
          tenantDocument[field] = Number(value);
        } else {
          tenantDocument[field] = value;
        }
      }
    });

    const savedDocument = await tenantDocument.save();

    console.log('[tenantScore] Before calculation (update):', tenantDocument.tenantScore);
    tenantDocument.tenantScore = calculateTenantScore(tenantDocument);
    console.log('[tenantScore] After calculation (update):', tenantDocument.tenantScore);
    await tenantDocument.save();
    console.log('[tenantScore] Saved to DB (update)');

    const responseData = savedDocument.toObject();

    documentFields.forEach(field => {
      if (responseData[field] && Array.isArray(responseData[field])) {
        responseData[field] = responseData[field].map(doc => {
          if (!doc.url && doc.s3Key) {
            doc.url = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${doc.s3Key}`;
          }
          return doc;
        });
      }
    });

    // Remove unnecessary fields
    delete responseData._id;
    delete responseData.__v;
    delete responseData.tenant;
    delete responseData.createdAt;
    delete responseData.updatedAt;

    res.json({
      ...responseData,
      tenantScore: tenantDocument.tenantScore
    });
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

    // Ensure documents have a valid URL
    documentFields.forEach(field => {
      if (profileData[field] && Array.isArray(profileData[field])) {
        profileData[field] = profileData[field].map(doc => {
          if (!doc.url && doc.s3Key) {
            doc.url = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${doc.s3Key}`;
          }
          return doc;
        });
      }
    });

    // Remove unnecessary fields
    delete profileData._id;
    delete profileData.__v;
    delete profileData.tenant;
    delete profileData.createdAt;
    delete profileData.updatedAt;

    res.json({
      ...profileData,
      tenantScore: tenantDocument.tenantScore
    });
  } catch (error) {
    console.error('Error in getTenantProfile:', error);
    res.status(500).json({ message: error.message });
  }
};

export const deleteDocument = async (req, res) => {
  try {
    const { docId } = req.params;
    const userId = req.user._id;

    const tenantDocument = await TenantDocument.findOne({ tenant: userId });

    if (!tenantDocument) {
      return res.status(404).json({ message: 'Tenant profile not found.' });
    }

    let documentToDelete = null;
    let fieldName = null;

    // Find the document and its field
    for (const field of documentFields) {
      if (tenantDocument[field] && tenantDocument[field].length) {
        const doc = tenantDocument[field].id(docId);
        if (doc) {
          documentToDelete = doc;
          fieldName = field;
          break;
        }
      }
    }

    if (!documentToDelete) {
      return res.status(404).json({ message: 'Document not found.' });
    }

    // Delete from S3
    if (documentToDelete.s3Key) {
      await deleteFileFromS3(documentToDelete.s3Key);
    }

    // Remove from the array
    tenantDocument[fieldName].pull({ _id: docId });

    await tenantDocument.save();

    res.status(200).json({ message: 'Document deleted successfully.' });

  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ message: 'Failed to delete document.' });
  }
}; 