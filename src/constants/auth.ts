// Authentication key for API calls (already base64 encoded)
const AUTH_KEY = 'YWRtaW46c2VjdXJlX3Bhc3N3b3JkXzEyMw==';

// Export the Authorization header value
export const AUTH_HEADER = `Basic ${AUTH_KEY}`;

// Helper function to get auth headers
export const getAuthHeaders = () => ({
  'Authorization': AUTH_HEADER
});

