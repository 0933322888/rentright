const BASE_URL = import.meta.env.VITE_API_URL;

export const API_ENDPOINTS = {
  BASE_URL,
  // Auth endpoints
  LOGIN: `${BASE_URL}/api/auth/login`,
  REGISTER: `${BASE_URL}/api/auth/register`,
  
  // User endpoints
  USER_PROFILE: `${BASE_URL}/api/users/profile`,
  UPDATE_PROFILE: `${BASE_URL}/api/users/profile`,
  UPDATE_TENANT_PROFILE: `${BASE_URL}/api/users/tenant-profile`,
  GET_TENANT_PROFILE: `${BASE_URL}/api/users/tenant-profile`,
  
  // Property endpoints
  PROPERTIES: `${BASE_URL}/api/properties`,
  AVAILABLE_PROPERTIES: `${BASE_URL}/api/properties/available`,
  
  // Application endpoints
  APPLICATIONS: `${BASE_URL}/api/applications`,
  
  // Admin endpoints
  ADMIN_PROPERTIES: `${BASE_URL}/api/admin/properties`,
  ADMIN_LANDLORDS: `${BASE_URL}/api/admin/landlords`,
  ADMIN_TENANTS: `${BASE_URL}/api/admin/tenants`,
  ADMIN_APPLICATIONS: `${BASE_URL}/api/admin/applications`,

  // Ticket endpoints
  TICKETS: `${BASE_URL}/api/tickets`,
  MY_TICKETS: `${BASE_URL}/api/tickets/my-tickets`,
}; 