/**
 * API Configuration Utility
 * 
 * This utility provides consistent API URL handling across environments:
 * - Development: Uses REACT_APP_API_URL or proxy
 * - Production: Uses relative URLs for nginx proxying
 */

/**
 * Get the base API URL for making requests
 * 
 * In production (when REACT_APP_API_URL is not set), returns empty string
 * to use relative URLs, allowing nginx to proxy to backend.
 * 
 * @returns {string} Base API URL (empty string for relative URLs in production)
 */
export const getApiBaseUrl = () => {
  // If REACT_APP_API_URL is explicitly set, use it
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // In production (no REACT_APP_API_URL), use relative URLs
  // This allows nginx reverse proxy to route API calls to the backend
  return '';
};

/**
 * Build a complete API URL
 * 
 * @param {string} path - API path (e.g., '/api/verify/trainer/123')
 * @returns {string} Complete API URL
 */
export const getApiUrl = (path) => {
  const baseUrl = getApiBaseUrl();
  
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  // In production (empty baseUrl), return just the path for relative URLs
  if (!baseUrl) {
    return normalizedPath;
  }
  
  // In development or when baseUrl is set, combine them
  return `${baseUrl}${normalizedPath}`;
};
