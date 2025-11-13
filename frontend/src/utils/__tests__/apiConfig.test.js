import { getApiBaseUrl, getApiUrl } from '../apiConfig';

describe('apiConfig', () => {
  const originalEnv = process.env.REACT_APP_API_URL;

  afterEach(() => {
    // Restore original env value
    if (originalEnv !== undefined) {
      process.env.REACT_APP_API_URL = originalEnv;
    } else {
      delete process.env.REACT_APP_API_URL;
    }
  });

  describe('getApiBaseUrl', () => {
    it('should return REACT_APP_API_URL when set', () => {
      process.env.REACT_APP_API_URL = 'http://example.com';
      expect(getApiBaseUrl()).toBe('http://example.com');
    });

    it('should return empty string when REACT_APP_API_URL is not set', () => {
      delete process.env.REACT_APP_API_URL;
      expect(getApiBaseUrl()).toBe('');
    });
  });

  describe('getApiUrl', () => {
    it('should return full URL when REACT_APP_API_URL is set', () => {
      process.env.REACT_APP_API_URL = 'http://example.com';
      expect(getApiUrl('/api/test')).toBe('http://example.com/api/test');
    });

    it('should return relative URL when REACT_APP_API_URL is not set', () => {
      delete process.env.REACT_APP_API_URL;
      expect(getApiUrl('/api/test')).toBe('/api/test');
    });

    it('should add leading slash if path does not have one', () => {
      delete process.env.REACT_APP_API_URL;
      expect(getApiUrl('api/test')).toBe('/api/test');
    });

    it('should handle paths with leading slash when baseUrl is set', () => {
      process.env.REACT_APP_API_URL = 'http://example.com';
      expect(getApiUrl('/api/test')).toBe('http://example.com/api/test');
    });

    it('should handle paths without leading slash when baseUrl is set', () => {
      process.env.REACT_APP_API_URL = 'http://example.com';
      expect(getApiUrl('api/test')).toBe('http://example.com/api/test');
    });
  });
});
