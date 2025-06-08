import PropertyDocument from '../models/propertyDocumentModel.js';
import Property from '../models/propertyModel.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads/property-documents');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

export const uploadPropertyDocuments = async (req, res) => {
  try {
    const { propertyId } = req.params;
    
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
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
          const fileExt = path.extname(file.name);
          const baseName = path.basename(file.name, fileExt);
          const sanitizedName = baseName.replace(/[^a-zA-Z0-9]/g, '_');
          const filename = `${uniqueSuffix}-${sanitizedName}${fileExt}`;
          
          const filepath = path.join(uploadsDir, filename);

          // Move file to uploads directory
          await file.mv(filepath);

          // Update document record
          if (!propertyDocument[field]) {
            propertyDocument[field] = [];
          }
          
          propertyDocument[field].push({
            path: filepath,
            filename: filename,
            uploadedAt: new Date(),
            mimeType: file.mimetype
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
          url: `/uploads/property-documents/${doc.filename}`
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
          url: `/uploads/property-documents/${doc.filename}`
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
    const document = propertyDocument[field].find(doc => doc._id.toString() === documentId);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Delete the file from the filesystem
    const filepath = path.join(uploadsDir, document.filename);
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
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