import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Box, Typography, IconButton, Paper } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import VisibilityIcon from '@mui/icons-material/Visibility';

const DocumentUpload = ({ field, documents = [], onDrop, onDelete, maxFiles = 1, required = false, error = false }) => {
  const handleDrop = useCallback((acceptedFiles) => {
    onDrop(acceptedFiles);
  }, [onDrop]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDrop,
    maxFiles: maxFiles,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg']
    }
  });

  const fieldLabels = {
    proofOfOwnership: 'Proof of Ownership',
    governmentId: 'Government-Issued ID',
    condoBoardRules: 'Condo Board Rules',
    utilityBills: 'Utility Bills or Average Utility Costs',
    proofOfIdentity: 'Proof of Identity',
    proofOfIncome: 'Proof of Income',
    creditHistory: 'Credit History',
    rentalHistory: 'Rental History',
    additionalDocuments: 'Additional Documents'
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle1" gutterBottom>
        {fieldLabels[field] || field.replace(/([A-Z])/g, ' $1').trim()}
        {required && <span style={{ color: 'red' }}> *</span>}
      </Typography>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Document upload area */}
        <Paper
          {...getRootProps()}
          sx={{
            p: 3,
            border: '2px dashed',
            borderColor: error ? 'error.main' : isDragActive ? 'primary.main' : 'grey.300',
            backgroundColor: isDragActive ? 'action.hover' : 'background.paper',
            cursor: 'pointer',
            '&:hover': {
              borderColor: 'primary.main',
              backgroundColor: 'action.hover'
            }
          }}
        >
          <input {...getInputProps()} />
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
            <CloudUploadIcon sx={{ fontSize: 40, color: 'primary.main' }} />
            <Typography variant="body1" color="textSecondary">
              {isDragActive
                ? 'Drop the files here...'
                : `Drag and drop files here, or click to select files (${maxFiles} ${maxFiles === 1 ? 'file' : 'files'} max)`}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              Accepted formats: PDF, PNG, JPG, JPEG
            </Typography>
          </Box>
        </Paper>

        {error && (!documents || documents.length === 0) && (
            <Typography variant="caption" color="error" sx={{ pl: 1 }}>
                This document is required.
            </Typography>
        )}

        {/* Uploaded documents list */}
        {documents && documents.length > 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {documents.map((doc, index) => (
              <Paper
                key={index}
                sx={{
                  p: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: 'background.paper'
                }}
              >
                <Typography variant="body2" noWrap sx={{ flex: 1 }}>
                  {doc.originalName || doc.filename || doc.name}
                </Typography>
                <Box>
                  <IconButton
                    size="small"
                    onClick={() => window.open(doc.url, '_blank', 'noopener,noreferrer')}
                    color="primary"
                  >
                    <VisibilityIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => onDelete(field, index)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </Paper>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default DocumentUpload; 