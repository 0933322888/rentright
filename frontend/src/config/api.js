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
  PROPERTY: (id) => `${BASE_URL}/api/properties/${id}`,
  AVAILABLE_PROPERTIES: `${BASE_URL}/api/properties/available`,
  
  // Payment endpoints
  PAYMENTS: `${BASE_URL}/api/payments`,
  
  // Application endpoints
  APPLICATIONS: `${BASE_URL}/api/applications`,
  PROPERTY_APPLICATIONS: (propertyId) => `${BASE_URL}/api/applications/property/${propertyId}`,
  PROPERTY_DOCUMENTS: (propertyId) => `${BASE_URL}/api/properties/${propertyId}/documents`,
  
  // Admin endpoints
  ADMIN_PROPERTIES: `${BASE_URL}/api/admin/properties`,
  ADMIN_LANDLORDS: `${BASE_URL}/api/admin/landlords`,
  ADMIN_TENANTS: `${BASE_URL}/api/admin/tenants`,
  ADMIN_APPLICATIONS: `${BASE_URL}/api/admin/applications`,
  ADMIN_PROPERTY_VIEWING_DATES: (propertyId, dateId) => 
    `${BASE_URL}/api/admin/properties/${propertyId}/viewing-dates/${dateId}`,

  // Ticket endpoints
  TICKETS: `${BASE_URL}/api/tickets`,
  MY_TICKETS: `${BASE_URL}/api/tickets/my-tickets`,
  ADMIN_TICKETS: `${BASE_URL}/api/tickets`,
  PROPERTY_TICKETS: (propertyId) => `${BASE_URL}/api/tickets/property/${propertyId}`,

  // Escalation endpoints
  ESCALATIONS: `${BASE_URL}/api/escalations`,
}; 