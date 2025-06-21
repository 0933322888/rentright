import PropertyDocument from '../models/propertyDocumentModel.js';
import Property from '../models/propertyModel.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { uploadFileToS3, deleteFileFromS3, generateS3Key } from '../utils/s3.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const uploadPropertyDocuments = async (req, res) => {
  try {
    const { propertyId } = req.params;
    console.log("");

    // Check if property exists and belongs to the landlord
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    if (property.landlord.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to upload documents for this property' });
    }

    // Find or create property document record
    let propertyDocument = await PropertyDocument.findOne({ property: propertyId });
    if (!propertyDocument) {
      propertyDocument = new PropertyDocument({ property: propertyId });
    }

    const documentFields = [
      'proofOfOwnership',
      'governmentId',
      'condoBoardRules',
      'utilityBills'
    ];

    // Handle each document upload
    for (const field of documentFields) {
      if (req.files && req.files[field]) {
        const files = Array.isArray(req.files[field]) ? req.files[field] : [req.files[field]];

        for (const file of files) {
          // Read file data from disk since we're using disk storage
          const fileBuffer = fs.readFileSync(file.path);

          // Generate S3 key
          const key = generateS3Key('property-documents', file.originalname);
          // Upload to S3
          const url = await uploadFileToS3(fileBuffer, key, file.mimetype);
          console.log("S3 Upload Complete");

          // Clean up the temporary file
          fs.unlinkSync(file.path);

          // Update document record
          if (!propertyDocument[field]) {
            propertyDocument[field] = [];
          }

          propertyDocument[field].push({
            s3Key: key,
            filename: file.originalname,
            uploadedAt: new Date(),
            mimeType: file.mimetype,
            url: url
          });
        }
      }
    }

    const savedDocument = await propertyDocument.save();

    // Format the response data with URLs
    const responseData = savedDocument.toObject();

    // Add URLs for each document
    documentFields.forEach(field => {
      if (responseData[field] && Array.isArray(responseData[field])) {
        responseData[field] = responseData[field].map(doc => ({
          ...doc,
          url: doc.url
        }));
      }
    });

    res.json(responseData);
  } catch (error) {
    console.error('Error in uploadPropertyDocuments:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getPropertyDocuments = async (req, res) => {
  try {
    const { propertyId } = req.params;

    // Check if property exists
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    // Check if user is authorized (landlord or admin)
    if (req.user.role !== 'admin' && property.landlord.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view these documents' });
    }

    const propertyDocument = await PropertyDocument.findOne({ property: propertyId });
    if (!propertyDocument) {
      return res.status(404).json({ message: 'Property documents not found' });
    }

    // Format the response data with URLs
    const responseData = propertyDocument.toObject();

    // Add URLs for each document
    const documentFields = ['proofOfOwnership', 'governmentId', 'condoBoardRules', 'utilityBills'];
    documentFields.forEach(field => {
      if (responseData[field] && Array.isArray(responseData[field])) {
        responseData[field] = responseData[field].map(doc => ({
          ...doc,
          url: doc.url
        }));
      }
    });

    res.json(responseData);
  } catch (error) {
    console.error('Error in getPropertyDocuments:', error);
    res.status(500).json({ message: error.message });
  }
};

export const deletePropertyDocument = async (req, res) => {
  try {
    const { propertyId, documentId, field } = req.params;

    // Check if property exists and belongs to the landlord
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    if (property.landlord.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete documents for this property' });
    }

    const propertyDocument = await PropertyDocument.findOne({ property: propertyId });
    if (!propertyDocument) {
      return res.status(404).json({ message: 'Property documents not found' });
    }

    // Find and remove the document
    const doc = propertyDocument[field].find(doc => doc._id.toString() === documentId);
    if (!doc) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Delete the file from S3
    if (doc && doc.s3Key) {
      try { await deleteFileFromS3(doc.s3Key); } catch (e) { /* ignore */ }
    }

    // Remove the document from the array
    propertyDocument[field] = propertyDocument[field].filter(
      doc => doc._id.toString() !== documentId
    );

    await propertyDocument.save();
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error in deletePropertyDocument:', error);
    res.status(500).json({ message: error.message });
  }
}; 