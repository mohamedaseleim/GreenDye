# Testing the Register Endpoint Fix

## Problem
The register endpoint was returning an HTML 404 page instead of a JSON API response.

## Solution
Updated nginx configurations to properly route API requests to the backend server.

## How to Test

### Using Docker Compose (Recommended)

1. **Start the services:**
   ```bash
   docker-compose up --build
   ```

2. **Test the register endpoint:**
   ```bash
   curl -X POST http://localhost/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Test User",
       "email": "test@example.com",
       "password": "password123"
     }'
   ```

3. **Expected Response (Success):**
   ```json
   {
     "success": true,
     "data": {
       "token": "eyJhbGc...",
       "user": {
         "id": "...",
         "name": "Test User",
         "email": "test@example.com",
         "role": "student",
         "language": "en"
       }
     }
   }
   ```

4. **Test with duplicate email (should fail with 400):**
   ```bash
   # Run the same command again
   curl -X POST http://localhost/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Test User",
       "email": "test@example.com",
       "password": "password123"
     }'
   ```

   Expected: `{"success": false, "message": "User already exists with this email"}`

### Testing Directly with Frontend Container

If you want to test that the frontend nginx also properly proxies API requests:

1. **Access frontend container directly:**
   ```bash
   curl -X POST http://localhost:3000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Test User 2",
       "email": "test2@example.com",
       "password": "password123"
     }'
   ```

2. **Expected:** Should also return JSON response (not HTML 404)

### Verifying the Fix

The fix should ensure:
- ✅ API requests return JSON responses (not HTML)
- ✅ The register endpoint works correctly
- ✅ Other API endpoints continue to work
- ✅ Frontend static files are still served correctly
- ✅ Uploads and invoices are accessible

## Files Modified

1. **deployment/nginx/nginx.conf** - Main reverse proxy configuration
   - Reordered location blocks (API routes before catch-all)
   - Added WebSocket support headers
   - Added `/invoices` location block

2. **frontend/deployment/nginx/default.conf** - Frontend nginx configuration
   - Added API proxy configuration
   - Added upload and invoice proxy configuration
   - Ensures API requests are forwarded to backend even if they hit the frontend container

## Rollback Instructions

If the fix causes issues, you can revert the changes:

```bash
git revert HEAD
docker-compose down
docker-compose up --build
```
