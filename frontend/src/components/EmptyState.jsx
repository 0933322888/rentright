import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const EmptyState = ({ title, message, icon: Icon }) => {
  return (
    <Paper 
      elevation={0}
      sx={{ 
        p: 4, 
        textAlign: 'center',
        bgcolor: 'background.default',
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider'
      }}
    >
      <Box sx={{ mb: 2, color: 'text.secondary' }}>
        {Icon && <Icon sx={{ fontSize: 48 }} />}
      </Box>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      <Typography variant="body1" color="text.secondary">
        {message}
      </Typography>
    </Paper>
  );
};

export default EmptyState; 