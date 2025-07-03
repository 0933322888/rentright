import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';

// Track property view
export const trackPropertyView = async (propertyId) => {
    try {
        await axios.post(`${API_ENDPOINTS.PROPERTIES}/${propertyId}/view`);
    } catch (error) {
        // Error tracking property view
        // Don't throw error to avoid breaking the user experience
    }
};

// Track property click
export const trackPropertyClick = async (propertyId) => {
    try {
        await axios.post(`${API_ENDPOINTS.PROPERTIES}/${propertyId}/click`);
    } catch (error) {
        // Error tracking property click
        // Don't throw error to avoid breaking the user experience
    }
};

// Track property view when property details page is loaded
export const trackPropertyViewOnLoad = (propertyId) => {
    // Use a flag to prevent multiple tracking on the same page
    const trackingKey = `viewed_${propertyId}`;
    const hasTracked = sessionStorage.getItem(trackingKey);

    if (!hasTracked) {
        trackPropertyView(propertyId);
        sessionStorage.setItem(trackingKey, 'true');
    }
}; 