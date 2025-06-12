/**
 * Utility functions for handling status-related operations
 */

/**
 * Get the appropriate color classes for a status chip
 * @param {string} status - The status to get colors for
 * @returns {string} Tailwind CSS classes for the status chip
 */
export const getStatusColor = (status) => {
  switch (status) {
    case 'new':
      return 'bg-blue-100 text-blue-800';
    case 'review':
      return 'bg-yellow-100 text-yellow-800';
    case 'submitted':
      return 'bg-green-100 text-green-800';
    case 'rented':
      return 'bg-purple-100 text-purple-800';
    case 'approved':
      return 'bg-green-100 text-green-800';
    case 'declined':
      return 'bg-red-100 text-red-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

/**
 * Get the appropriate icon for a status
 * @param {string} status - The status to get an icon for
 * @returns {Object} Material-UI icon component
 */
export const getStatusIcon = (status) => {
  switch (status) {
    case 'approved':
      return 'CheckCircleIcon';
    case 'declined':
      return 'CancelIcon';
    case 'pending':
      return 'AccessTimeIcon';
    case 'new':
      return 'NewReleasesIcon';
    default:
      return 'InfoIcon';
  }
};

/**
 * Format a status for display
 * @param {string} status - The status to format
 * @returns {string} Formatted status string
 */
export const formatStatus = (status) => {
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}; 