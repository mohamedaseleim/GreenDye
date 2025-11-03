# Fix Explanation: Register Endpoint 404 Error

## Problem
When attempting to register a new user via `/api/auth/register`, the server was returning an HTML 404 page instead of a JSON API response.

## Architecture Overview

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│   Main Nginx        │ (Port 80)
│   Reverse Proxy     │
└──────┬──────────────┘
       │
       ├─────────────────────────┐
       ▼                         ▼
┌──────────────┐        ┌──────────────┐
│  Frontend    │        │   Backend    │
│  Container   │        │   Container  │
│  (nginx:80)  │        │  (Express)   │
│              │        │  :5000       │
└──────────────┘        └──────────────┘
```

## The Problem

### Before Fix

**Scenario 1: Request goes through main nginx**
```
Client → Main Nginx (/) → Frontend Nginx
                    ↓
              Frontend serves React app
                    ↓
              /api/auth/register doesn't match any React route
                    ↓
              React Router shows 404 page (HTML)
```

**Issue**: The main nginx's `/` location caught ALL requests (including `/api/*`) and forwarded them to the frontend.

**Scenario 2: Direct access to frontend**
```
Client → Frontend Nginx (port 3000)
              ↓
        /api/auth/register doesn't match static files
              ↓
        try_files returns index.html
              ↓
        React shows 404 page (HTML)
```

**Issue**: Frontend nginx had no configuration to proxy API requests to backend.

## The Solution

### After Fix

**Main Nginx Configuration:**
```nginx
# 1. API routes FIRST (more specific)
location /api {
    proxy_pass http://backend;
    # WebSocket headers for real-time features
    # Standard proxy headers
}

# 2. Static files
location /uploads { proxy_pass http://backend; }
location /invoices { proxy_pass http://backend; }

# 3. Frontend LAST (catch-all)
location / {
    proxy_pass http://frontend;
}
```

**Frontend Nginx Configuration:**
```nginx
# 1. API routes (proxy to backend)
location /api {
    proxy_pass http://backend:5000;
    # WebSocket + proxy headers
}

# 2. Static files (proxy to backend)
location /uploads { proxy_pass http://backend:5000; }
location /invoices { proxy_pass http://backend:5000; }

# 3. React app (catch-all for SPA routing)
location / {
    try_files $uri $uri/ /index.html;
}
```

### Request Flow After Fix

**Scenario 1: Through main nginx (primary path)**
```
Client → Main Nginx (/api/auth/register)
              ↓
        Matches "location /api"
              ↓
        Proxy to Backend:5000
              ↓
        Express handles /api/auth/register
              ↓
        Returns JSON: {"success": true, "data": {...}}
```

**Scenario 2: Direct to frontend (backup path)**
```
Client → Frontend Nginx (/api/auth/register)
              ↓
        Matches "location /api"
              ↓
        Proxy to Backend:5000
              ↓
        Express handles /api/auth/register
              ↓
        Returns JSON: {"success": true, "data": {...}}
```

## Key Improvements

1. **Correct Route Ordering**
   - More specific routes (`/api`, `/uploads`, `/invoices`) before catch-all (`/`)
   - Ensures API requests are properly routed

2. **Frontend Nginx Proxy**
   - Added proxy configuration for API requests
   - Frontend can now forward API calls to backend
   - Prevents React 404 page for API endpoints

3. **Consistent Headers**
   - All proxy blocks have proper headers:
     - `Host`: Original request host
     - `X-Real-IP`: Client's real IP address
     - `X-Forwarded-For`: Full proxy chain
     - `X-Forwarded-Proto`: Original protocol (http/https)

4. **WebSocket Support**
   - API endpoints have WebSocket headers for Socket.io
   - Enables real-time features (chat, notifications, live updates)

## Testing the Fix

```bash
# Should return JSON (not HTML)
curl -X POST http://localhost/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","password":"password123"}'

# Expected Response:
{
  "success": true,
  "data": {
    "token": "eyJhbGc...",
    "user": {
      "id": "...",
      "name": "Test",
      "email": "test@example.com",
      "role": "student"
    }
  }
}
```

## Why This Works

1. **Main nginx** now correctly routes `/api/*` requests to backend before falling back to frontend
2. **Frontend nginx** can now handle API requests that reach it directly (e.g., in development or if main nginx is bypassed)
3. **Consistent configuration** across both nginx instances prevents routing confusion
4. **Proper headers** ensure backend receives correct client information for logging and security

## Files Changed

- `deployment/nginx/nginx.conf` - Main reverse proxy configuration
- `frontend/deployment/nginx/default.conf` - Frontend container nginx configuration
- `TESTING_FIX.md` - Testing instructions
