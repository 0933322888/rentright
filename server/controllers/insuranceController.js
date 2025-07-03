import Application from '../models/applicationModel.js';
import { uploadFileToS3, deleteFileFromS3 } from '../utils/s3.js';
import { parseInsuranceDocument } from '../utils/aiInsuranceParser.js';
import fs from 'fs';
import mongoose from 'mongoose';

// Get insurance documents for an application
export const getInsuranceDocuments = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;

    let application = await Application.findById(applicationId)
      .populate('tenant', 'firstName lastName email')
      .populate({
        path: 'property',
        populate: {
          path: 'landlord',
          select: 'firstName lastName email'
        }
      });

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }



    // If property.landlord is not populated, try to fetch it separately
    if (userRole === 'landlord' && (!application.property?.landlord || typeof application.property.landlord === 'string')) {
      const Property = mongoose.model('Property');
      const property = await Property.findById(application.property._id || application.property)
        .populate('landlord', 'firstName lastName email');
      
      if (property) {
        application.property = property;
      }
    }

    // Verify user has access to this application
    if (userRole === 'tenant') {
      // Check if tenant is populated or if it's just an ObjectId
      const tenantId = application.tenant._id || application.tenant;
      if (tenantId.toString() !== userId.toString()) {
        return res.status(403).json({ message: 'Not authorized to view this application' });
      }
    }
    
    if (userRole === 'landlord') {
      // Check if landlord is populated or if it's just an ObjectId
      const landlordId = application.property?.landlord?._id || application.property?.landlord;
      
      if (!landlordId || landlordId.toString() !== userId.toString()) {
        return res.status(403).json({ message: 'Not authorized to view this application' });
      }
    }

    // Convert aiSummaries Map to plain object for frontend
    let aiSummariesObj = {};
    if (application.insurance && application.insurance.aiSummaries) {
      if (typeof application.insurance.aiSummaries.entries === 'function') {
        for (const [year, summary] of application.insurance.aiSummaries.entries()) {
          aiSummariesObj[year] = summary;
        }
      } else {
        aiSummariesObj = application.insurance.aiSummaries;
      }
    }

    res.json({
      documents: application.insurance?.documents || [],
      aiSummaries: aiSummariesObj
    });
  } catch (error) {
    console.error('Error getting insurance documents:', error);
    res.status(500).json({ message: 'Error retrieving insurance documents' });
  }
};

// Upload insurance document
export const uploadInsuranceDocument = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { file } = req;
    const { year } = req.body;
    const userId = req.user._id;
    const userRole = req.user.role;

    if (userRole !== 'tenant') {
      return res.status(403).json({ message: 'Only tenants can upload insurance documents' });
    }

    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    if (!year) {
      return res.status(400).json({ message: 'Year is required' });
    }

    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Verify tenant has access to this application
    const tenantId = application.tenant._id || application.tenant;
    if (tenantId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Not authorized to upload documents for this application' });
    }

    // Check if a document already exists for this year and delete it
    if (!application.insurance) {
      application.insurance = { documents: [], aiSummary: null };
    }
    
    // Remove existing document for this year
    application.insurance.documents = application.insurance.documents.filter(doc => doc.year !== year);

    // Upload file to S3
    const fileBuffer = fs.readFileSync(file.path);
    const s3Key = `insurance-documents/${applicationId}/${year}/${file.originalname}`;
    const url = await uploadFileToS3(fileBuffer, s3Key, file.mimetype);
    fs.unlinkSync(file.path);

    // Create document object
    const document = {
      path: s3Key,
      filename: file.originalname,
      originalName: file.originalname,
      mimeType: file.mimetype,
      uploadedAt: new Date(),
      url: url,
      s3Key: s3Key,
      year: year
    };

    // Add document to application
    application.insurance.documents.push(document);
    await application.save();

    res.status(201).json(document);
  } catch (error) {
    console.error('Error uploading insurance document:', error);
    res.status(500).json({ message: 'Error uploading insurance document' });
  }
};

// Delete insurance document
export const deleteInsuranceDocument = async (req, res) => {
  try {
    const { applicationId, documentId } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;

    if (userRole !== 'tenant') {
      return res.status(403).json({ message: 'Only tenants can delete insurance documents' });
    }

    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Verify tenant has access to this application
    const tenantId = application.tenant._id || application.tenant;
    if (tenantId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete documents for this application' });
    }

    // Find the document
    const document = application.insurance?.documents?.find(doc => doc._id.toString() === documentId);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Delete from S3
    if (document.s3Key) {
      try {
        await deleteFileFromS3(document.s3Key);
      } catch (s3Error) {
        console.error('Error deleting file from S3:', s3Error);
        // Continue with deletion even if S3 deletion fails
      }
    }

    // Remove document from application - ensure we only keep valid documents with required fields
    application.insurance.documents = application.insurance.documents.filter(
      doc => doc._id.toString() !== documentId && doc.year && doc.filename // Only keep documents that are not the one to delete AND have required fields
    );

    // Remove AI summary for this year if it exists
    if (application.insurance.aiSummaries && application.insurance.aiSummaries.has(document.year)) {
      application.insurance.aiSummaries.delete(document.year);
    }

    // Validate the application before saving
    const validationError = application.validateSync();
    if (validationError) {
      console.error('Validation error before saving:', validationError);
      return res.status(400).json({ 
        message: 'Validation error', 
        details: validationError.message 
      });
    }

    await application.save();

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting insurance document:', error);
    
    // Handle validation errors specifically
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error', 
        details: error.message 
      });
    }
    
    res.status(500).json({ message: 'Error deleting insurance document' });
  }
};

// Generate AI summary of insurance documents
export const generateInsuranceSummary = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { year } = req.body;
    const userId = req.user._id;
    const userRole = req.user.role;

    if (userRole !== 'landlord') {
      return res.status(403).json({ message: 'Only landlords can generate insurance summaries' });
    }

    if (!year) {
      return res.status(400).json({ message: 'Year is required' });
    }

    let application = await Application.findById(applicationId)
      .populate({
        path: 'property',
        populate: { path: 'landlord', select: 'firstName lastName email' }
      });

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Ensure property and landlord are populated
    if (!application.property || !application.property.landlord) {
      const Property = require('../models/propertyModel.js');
      const property = await Property.findById(application.property?._id || application.property)
        .populate('landlord', 'firstName lastName email');
      if (property) {
        application.property = property;
      }
    }

    const landlordId = application.property?.landlord?._id || application.property?.landlord;
    
    if (!landlordId || landlordId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Not authorized to generate summaries for this application' });
    }

    // Check for cached summary
    if (application.insurance && application.insurance.aiSummaries && application.insurance.aiSummaries.get(year)) {
      return res.json({ summary: application.insurance.aiSummaries.get(year).content });
    }

    // Check if there are insurance documents for the specified year
    const yearDocuments = application.insurance?.documents?.filter(doc => doc.year === year) || [];
    if (yearDocuments.length === 0) {
      return res.status(400).json({ message: `No insurance documents available for ${year}` });
    }

    // Generate AI summary
    const summary = await parseInsuranceDocument(yearDocuments);

    // Update application with AI summary for this year
    if (!application.insurance.aiSummaries) {
      application.insurance.aiSummaries = new Map();
    }
    application.insurance.aiSummaries.set(year, {
      content: summary,
      generatedAt: new Date(),
      generatedBy: userId,
      year: year
    });
    await application.save();

    res.json({ summary });
  } catch (error) {
    console.error('Error generating insurance summary:', error);
    res.status(500).json({ message: 'Error generating insurance summary' });
  }
};

// Download insurance document
export const downloadInsuranceDocument = async (req, res) => {
  try {
    const { applicationId, documentId } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;

    const application = await Application.findById(applicationId)
      .populate('property.landlord', 'firstName lastName email');

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Verify user has access to this application
    if (userRole === 'tenant') {
      const tenantId = application.tenant._id || application.tenant;
      if (tenantId.toString() !== userId.toString()) {
        return res.status(403).json({ message: 'Not authorized to download documents for this application' });
      }
    }
    if (userRole === 'landlord') {
      const landlordId = application.property?.landlord?._id || application.property?.landlord;
      if (!landlordId || landlordId.toString() !== userId.toString()) {
        return res.status(403).json({ message: 'Not authorized to download documents for this application' });
      }
    }

    // Find the document
    const document = application.insurance?.documents?.find(doc => doc._id.toString() === documentId);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Return document URL for download
    res.json({ url: document.url, filename: document.originalName || document.filename });
  } catch (error) {
    console.error('Error downloading insurance document:', error);
    res.status(500).json({ message: 'Error downloading insurance document' });
  }
}; 