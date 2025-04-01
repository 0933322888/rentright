export const API_BASE_URL = 'http://localhost:5000/api';

export const API_ENDPOINTS = {
  // Auth endpoints
  LOGIN: `${API_BASE_URL}/auth/login`,
  REGISTER: `${API_BASE_URL}/auth/register`,
  
  // User endpoints
  USER_PROFILE: `${API_BASE_URL}/users/profile`,
  UPDATE_TENANT_PROFILE: `${API_BASE_URL}/users/tenant-profile`,
  
  // Property endpoints
  PROPERTIES: `${API_BASE_URL}/properties`,
  PROPERTY_BY_ID: (id) => `${API_BASE_URL}/properties/${id}`,
  APPLY_FOR_PROPERTY: (id) => `${API_BASE_URL}/properties/${id}/apply`,
  
  // Application endpoints
  APPLICATIONS: `${API_BASE_URL}/applications`,
  APPLICATION_BY_ID: (id) => `${API_BASE_URL}/applications/${id}`,
  
  // Contact endpoint
  CONTACT: `${API_BASE_URL}/contact`
}; 