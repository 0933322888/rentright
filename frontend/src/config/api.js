const BASE_URL = import.meta.env.VITE_API_URL;

export const API_ENDPOINTS = {
  BASE_URL,
  // Auth endpoints
  LOGIN: `${BASE_URL}/api/auth/login`,
  REGISTER: `${BASE_URL}/api/auth/register`,

  // User endpoints
  USERS: `${BASE_URL}/api/users`,
  USER_PROFILE: `${BASE_URL}/api/users/profile`,
  UPDATE_PROFILE: `${BASE_URL}/api/users/profile`,
  UPDATE_TENANT_PROFILE: `${BASE_URL}/api/users/tenant-profile`,
  GET_TENANT_PROFILE: `${BASE_URL}/api/users/tenant-profile`,
  UPLOAD_TENANT_DOCUMENT: `${BASE_URL}/api/users/tenant-documents`,
  DELETE_TENANT_DOCUMENT: `${BASE_URL}/api/users/tenant-profile`,

  // Property endpoints
  PROPERTIES: `${BASE_URL}/api/properties`,
  PROPERTY: (id) => `${BASE_URL}/api/properties/${id}`,
  AVAILABLE_PROPERTIES: `${BASE_URL}/api/properties/available`,
  MY_PROPERTIES: `${BASE_URL}/api/user-properties/my-properties`,
  GENERATE_PROPERTY_PRICE: `${BASE_URL}/api/properties/generate-price`,
  IMAGES: `${BASE_URL}/api/properties/images`,
  GET_PROPERTIES: `${BASE_URL}/api/properties`,
  GET_PROPERTY_DETAILS: (id) => `${BASE_URL}/api/properties/${id}`,

  // Payment endpoints
  PAYMENTS: `${BASE_URL}/api/payments`,
  CONFIRM_PAYMENT: `${BASE_URL}/api/payments/confirm`,
  PAYMENT_INTENT_STATUS: (paymentIntentId) => `${BASE_URL}/api/payments/intent/${paymentIntentId}/status`,

  // Payment Setup endpoints
  PAYMENT_SETUP: `${BASE_URL}/api/payment-setup`,
  INITIALIZE_PAYMENT_SETUP: (tenantId) => `${BASE_URL}/api/payment-setup/initialize/${tenantId}`,
  COMPLETE_PAYMENT_SETUP: (tenantId) => `${BASE_URL}/api/payment-setup/complete/${tenantId}`,
  PAYMENT_SETUP_STATUS: (tenantId) => `${BASE_URL}/api/payment-setup/status/${tenantId}`,
  UPDATE_PAYMENT_METHOD: (tenantId) => `${BASE_URL}/api/payment-setup/update/${tenantId}`,
  DELETE_PAYMENT_SETUP: (tenantId) => `${BASE_URL}/api/payment-setup/${tenantId}`,

  // Application endpoints
  APPLICATIONS: `${BASE_URL}/api/applications`,
  PROPERTY_APPLICATIONS: (propertyId) => `${BASE_URL}/api/applications/property/${propertyId}`,
  PROPERTY_DOCUMENTS: (propertyId) => `${BASE_URL}/api/properties/${propertyId}/documents`,

  // Insurance endpoints
  INSURANCE: `${BASE_URL}/api/insurance`,
  INSURANCE_DOCUMENTS: (applicationId) => `${BASE_URL}/api/insurance/${applicationId}`,
  UPLOAD_INSURANCE_DOCUMENT: (applicationId) => `${BASE_URL}/api/insurance/${applicationId}/upload`,
  DELETE_INSURANCE_DOCUMENT: (applicationId, documentId) => `${BASE_URL}/api/insurance/${applicationId}/${documentId}`,
  GENERATE_INSURANCE_SUMMARY: (applicationId) => `${BASE_URL}/api/insurance/${applicationId}/generate-summary`,
  DOWNLOAD_INSURANCE_DOCUMENT: (applicationId, documentId) => `${BASE_URL}/api/insurance/${applicationId}/${documentId}/download`,

  // Admin endpoints
  ADMIN: `${BASE_URL}/api/admin`,
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

  // Landlord-specific endpoints
  LANDLORD_STATISTICS: `${BASE_URL}/api/landlord/statistics`,
  LANDLORD_APPLICATIONS: `${BASE_URL}/api/landlord/applications`,
  LANDLORD_PAYMENTS: `${BASE_URL}/api/landlord/payments`,
  LANDLORD_TICKETS: `${BASE_URL}/api/landlord/tickets`,
}; 