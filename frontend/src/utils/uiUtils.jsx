/**
 * Utility functions and constants for UI components
 */

import React from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';

/**
 * Common loading component
 */
export const LoadingSpinner = ({ message = 'Loading...' }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <CircularProgress size={64} className="text-primary-600" />
      <p className="mt-4 text-lg text-gray-600">{message}</p>
    </div>
  </div>
);

/**
 * Common error component
 */
export const ErrorDisplay = ({ error, onRetry }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center max-w-md mx-auto p-6">
      <div className="bg-red-50 rounded-full p-3 w-16 h-16 mx-auto mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">Error</h3>
      <p className="text-gray-600 mb-4">{error}</p>
      {onRetry && (
        <button 
          onClick={onRetry}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          Try Again
        </button>
      )}
    </div>
  </div>
);

/**
 * Common empty state component
 */
export const EmptyState = ({ 
  title, 
  message, 
  actionLabel, 
  onAction,
  icon: Icon 
}) => (
  <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div className="max-w-3xl mx-auto text-center">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="bg-primary-50 rounded-full p-3 w-16 h-16 mx-auto mb-4">
          {Icon && <Icon className="h-10 w-10 text-primary-600" />}
        </div>
        <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
          {title}
        </h2>
        <p className="mt-4 text-lg text-gray-600">
          {message}
        </p>
        {actionLabel && onAction && (
          <div className="mt-8">
            <button
              onClick={onAction}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              {actionLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  </div>
);

/**
 * Common tab styles
 */
export const tabStyles = {
  root: {
    minHeight: 120,
    opacity: 0.7,
    transition: 'all 0.3s',
    '&:hover': {
      opacity: 1,
      backgroundColor: 'rgba(25, 118, 210, 0.04)',
    },
  },
  selected: {
    opacity: 1,
    backgroundColor: 'rgba(25, 118, 210, 0.12)',
    borderRadius: '8px',
    '& img': {
      boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.2)',
    },
  },
};

/**
 * Common vertical tab styles
 */
export const verticalTabStyles = {
  root: {
    minHeight: 64,
    alignItems: 'flex-start',
    textAlign: 'left',
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: 1,
    transition: 'all 0.2s',
    backgroundColor: '#f5f5f5',
    color: '#666',
    border: '1px solid #e0e0e0',
    '&:hover': {
      backgroundColor: '#eeeeee',
    },
  },
  selected: {
    backgroundColor: '#e3f2fd',
    color: '#1976d2',
    border: '2px solid #1976d2',
    '& .MuiTypography-root': {
      color: '#1976d2',
      fontWeight: 600,
    },
    '& .MuiTypography-caption': {
      color: '#1976d2',
    },
    '& .MuiSvgIcon-root': {
      color: '#1976d2',
    },
    '&:hover': {
      backgroundColor: '#e3f2fd',
    },
  },
}; 