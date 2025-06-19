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
      backgroundColor: 'rgba(88, 105, 172, 0.04)',
    },
  },
  selected: {
    opacity: 1,
    backgroundColor: 'rgba(88, 105, 172, 0.12)',
    borderRadius: '8px',
    '& img': {
      boxShadow: '0 0 0 2px rgba(88, 105, 172, 0.2)',
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
    backgroundColor: '#f5f6fa',
    color: '#5869ac',
    border: '2px solid #5869ac',
    '& .MuiTypography-root': {
      color: '#5869ac',
      fontWeight: 600,
    },
    '& .MuiTypography-caption': {
      color: '#5869ac',
    },
    '& .MuiSvgIcon-root': {
      color: '#5869ac',
    },
    '&:hover': {
      backgroundColor: '#f5f6fa',
    },
  },
};

// Admin Button Styles - Unified styling for all admin pages

// Base button classes
const baseButtonClasses = "inline-flex items-center justify-center rounded-md border border-transparent text-xs font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2";

// Button size variants
export const buttonSizes = {
  xs: "px-2 py-1 text-xs",
  sm: "px-2.5 py-1.5 text-xs", 
  md: "px-3 py-2 text-sm",
  lg: "px-4 py-2 text-sm",
  xl: "px-6 py-3 text-base"
};

// Button color variants
export const buttonColors = {
  primary: {
    base: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
    disabled: "bg-blue-400 text-white cursor-not-allowed"
  },
  secondary: {
    base: "bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500",
    disabled: "bg-gray-400 text-white cursor-not-allowed"
  },
  success: {
    base: "bg-green-600 text-white hover:bg-green-700 focus:ring-green-500",
    disabled: "bg-green-400 text-white cursor-not-allowed"
  },
  warning: {
    base: "bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500",
    disabled: "bg-yellow-400 text-white cursor-not-allowed"
  },
  danger: {
    base: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
    disabled: "bg-red-400 text-white cursor-not-allowed"
  },
  outline: {
    base: "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 focus:ring-gray-500",
    disabled: "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
  }
};

// Generate button classes
export const getButtonClasses = (color = 'primary', size = 'sm', disabled = false) => {
  const colorClasses = disabled ? buttonColors[color].disabled : buttonColors[color].base;
  const sizeClasses = buttonSizes[size];
  
  return `${baseButtonClasses} ${sizeClasses} ${colorClasses}`;
};

// Predefined button variants for common use cases
export const adminButtonStyles = {
  // Primary actions (View, Edit, etc.)
  primary: getButtonClasses('primary', 'sm'),
  primaryMd: getButtonClasses('primary', 'md'),
  primaryLg: getButtonClasses('primary', 'lg'),
  
  // Success actions (Approve, etc.)
  success: getButtonClasses('success', 'sm'),
  successMd: getButtonClasses('success', 'md'),
  
  // Warning actions (Decline, Reject, etc.)
  warning: getButtonClasses('warning', 'sm'),
  warningMd: getButtonClasses('warning', 'md'),
  
  // Danger actions (Delete, etc.)
  danger: getButtonClasses('danger', 'sm'),
  dangerMd: getButtonClasses('danger', 'md'),
  
  // Secondary actions
  secondary: getButtonClasses('secondary', 'sm'),
  outline: getButtonClasses('outline', 'sm'),
  
  // Disabled states
  disabled: getButtonClasses('primary', 'sm', true),
  disabledSuccess: getButtonClasses('success', 'sm', true),
  disabledWarning: getButtonClasses('warning', 'sm', true),
  disabledDanger: getButtonClasses('danger', 'sm', true),
  
  // Text-only buttons (matching Tenants page style)
  textView: "text-blue-600 hover:text-blue-900 text-xs",
  textComments: "text-indigo-600 hover:text-indigo-900 text-xs",
  textDelete: "text-xs text-red-600 hover:text-red-900",
  textApprove: "text-green-600 hover:text-green-900 text-xs",
  textReject: "text-yellow-600 hover:text-yellow-900 text-xs",
  textEdit: "text-gray-600 hover:text-gray-900 text-xs"
};

// Status badge styles
export const statusBadgeStyles = {
  success: "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-800",
  warning: "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800",
  danger: "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-red-100 text-red-800",
  info: "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800",
  gray: "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-800"
};

// Get status badge class based on status
export const getStatusBadgeClass = (status) => {
  const statusMap = {
    'active': statusBadgeStyles.success,
    'approved': statusBadgeStyles.success,
    'pending': statusBadgeStyles.warning,
    'review': statusBadgeStyles.warning,
    'declined': statusBadgeStyles.danger,
    'rejected': statusBadgeStyles.danger,
    'inactive': statusBadgeStyles.gray,
    'complete': statusBadgeStyles.success,
    'incomplete': statusBadgeStyles.warning
  };
  
  return statusMap[status] || statusBadgeStyles.gray;
}; 