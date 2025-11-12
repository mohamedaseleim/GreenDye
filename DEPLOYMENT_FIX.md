# SPA Routing Configuration for Multiple Hosting Platforms

## Problem
When deploying the GreenDye Academy frontend, direct URLs like `/verify/trainer/TR-74664D06` or `/verify/certificate/CERT-xxx` result in "404 Page Not Found" errors, even though these routes work correctly when navigating from within the application. This affects:
- QR code scans for trainer/certificate verification
- Page refreshes on any route
- Direct URL access via bookmarks or shared links
- Deep linking from external sources

## Root Cause
GreenDye Academy is a Single Page Application (SPA) built with React. In an SPA, all routing is handled by JavaScript on the client side. When you navigate within the app (clicking links), React Router handles the routing without making new requests to the server. However, when you access a URL directly (refresh the page, scan a QR code, or type the URL), the browser makes a request to the server for that specific path.

Without proper web server configuration, the server tries to find a file or directory matching that path (e.g., `/verify/trainer/TR-74664D06`) and returns a 404 error when it doesn't exist, because these are client-side routes that don't correspond to actual files on the server.

## Solutions by Platform

### Apache Servers (Heliohost, cPanel, Hestia, etc.)
The enhanced `.htaccess` file in `frontend/public/` provides comprehensive Apache configuration:

**Features:**
1. **URL Rewriting** - Uses mod_rewrite to redirect routes to index.html
2. **Fallback Error Handling** - ErrorDocument 404 serves index.html even without mod_rewrite
3. **Preserves Real Files** - Physical files and directories are served normally
4. **API Proxy Rules** - Requests to `/api/*`, `/uploads/*`, and `/invoices/*` are preserved
5. **Query String Handling** - QSA flag ensures URL parameters are maintained
6. **Security Headers** - Disables directory browsing and sets proper options
7. **Compression** - Enables gzip compression for better performance
8. **MIME Types** - Sets proper content types for modern file formats


**Deployment:** The `.htaccess` file is automatically included in the build output and will be deployed with your application.

**Requirements:**
- Apache server with `mod_rewrite` enabled
- `.htaccess` files allowed (`AllowOverride All` or `AllowOverride FileInfo`)
- Proper file permissions (readable by web server)

**File Location:** `frontend/public/.htaccess`

---

### Nginx Servers (Docker, VPS, Cloud Hosting)
The Nginx configuration in `frontend/deployment/nginx/default.conf` provides proper SPA routing:

**Features:**
1. **try_files Directive** - Serves index.html for non-existent paths
2. **API Proxying** - Forwards API requests to backend server
3. **Static Asset Serving** - Efficient serving of uploads and invoices
4. **Gzip Compression** - Reduces bandwidth usage
5. **WebSocket Support** - For real-time features

**File Location:** `frontend/deployment/nginx/default.conf`

**Deployment:** Used automatically in Docker builds (see `frontend/Dockerfile`)

---

### IIS / Windows Server
The `web.config` file in `frontend/public/` configures IIS URL Rewrite module:

**Features:**
1. **URL Rewrite Rules** - Routes all SPA requests to index.html
2. **API Proxying** - Forwards API/uploads/invoices to backend
3. **MIME Type Definitions** - Proper content types for modern formats
4. **Security Headers** - X-Content-Type-Options, X-Frame-Options, etc.
5. **Compression** - Gzip compression for text and JSON responses

**Requirements:**
- IIS with URL Rewrite module installed
- Proper IIS configuration

**File Location:** `frontend/public/web.config`

---

### Netlify, Render, and Similar Platforms
The `_redirects` file in `frontend/public/` provides Netlify-compatible redirects:

**Features:**
1. **API Proxy Rules** - Forwards API requests to backend domain
2. **Static Asset Proxying** - Handles uploads and invoices
3. **SPA Fallback** - Serves index.html for all other routes
4. **200 Status Code** - Proper HTTP status for SPA routes

**File Location:** `frontend/public/_redirects`

**Note:** Update the backend URLs in the file to match your production backend domain.

---

### Vercel
The `vercel.json` file in the project root configures Vercel deployments:

**Features:**
1. **Rewrite Rules** - Routes API and static requests to backend
2. **SPA Fallback** - Serves index.html for app routes
3. **Security Headers** - X-Content-Type-Options, X-Frame-Options, X-XSS-Protection
4. **Cache Control** - Immutable caching for static assets

**File Location:** `vercel.json` (project root)

**Note:** Update the backend URLs to match your production backend domain.

---

## For Other Deployment Platforms

### AWS S3 + CloudFront
Configure CloudFront error pages:
- Set custom error response for 404 to serve `/index.html` with 200 status
- Or use Lambda@Edge for URL rewriting

### Firebase Hosting
Configure `firebase.json` in project root:
```json
{
  "hosting": {
    "public": "build",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

### GitHub Pages
Use the `404.html` technique:
- Copy `index.html` to `404.html` in the build folder
- GitHub Pages will serve 404.html for missing routes

### Generic Static Hosting
Ensure your hosting provider supports:
- URL rewriting or redirects
- Serving the same HTML file for all routes
- Preserving the URL in the browser address bar

## Testing the Fix

After deploying with the appropriate configuration file for your platform:

### 1. Test QR Code Verification Routes
These are the routes most affected by the 404 issue:

**Trainer Verification:**
- Direct URL: `https://your-domain.com/verify/trainer/TR-XXXXXX`
- Should display trainer verification page with trainer details
- Test with a real trainer ID from your database

**Certificate Verification:**
- Direct URL: `https://your-domain.com/verify/certificate/CERT-XXXXXX`
- Should display certificate verification page with certificate details
- Test with a real certificate ID from your database

### 2. Test Other Deep Links
Navigate directly to these URLs:
- `/courses` - Course listing page
- `/admin/dashboard` - Admin dashboard (requires login)
- `/trainer/dashboard` - Trainer dashboard (requires login)
- `/my-courses` - User's enrolled courses (requires login)

### 3. Test Page Refresh
1. Navigate to any page in the app by clicking links
2. Press F5 or click the browser refresh button
3. The same page should reload without 404 errors

### 4. Test QR Code Scanning
1. Generate a QR code for a trainer or certificate
2. Scan it with a mobile device
3. The verification page should load correctly

All of these should work without showing 404 errors.

## Verification Checklist

- [ ] Direct access to `/verify/trainer/TR-XXXXXX` works
- [ ] Direct access to `/verify/certificate/CERT-XXXXXX` works
- [ ] Page refresh on any route works
- [ ] QR code scanning leads to correct pages
- [ ] API requests still work correctly
- [ ] Static assets (images, CSS, JS) load properly
- [ ] Deep links from external sources work

## Troubleshooting

### Still Getting 404 Errors on Apache
1. ✅ Verify `.htaccess` file is in the same directory as `index.html`
2. ✅ Check `mod_rewrite` is enabled: `apache2ctl -M | grep rewrite`
3. ✅ Verify `.htaccess` files are allowed (AllowOverride setting)
4. ✅ Check file permissions: `chmod 644 .htaccess`
5. ✅ Review Apache error logs for specific issues
6. ✅ Test the fallback by temporarily breaking mod_rewrite

### Still Getting 404 Errors on Nginx
1. ✅ Verify `try_files $uri $uri/ /index.html;` is in location block
2. ✅ Check nginx error logs: `tail -f /var/log/nginx/error.log`
3. ✅ Ensure nginx config is loaded: `nginx -t && nginx -s reload`
4. ✅ Verify index.html is in the correct root directory

### Still Getting 404 Errors on IIS
1. ✅ Verify URL Rewrite module is installed
2. ✅ Check `web.config` is in the application root
3. ✅ Review IIS logs for specific errors
4. ✅ Ensure application pool has proper permissions

### API Requests Fail After Configuration
1. ✅ Verify backend is accessible at the configured URL
2. ✅ Check CORS settings allow requests from frontend domain
3. ✅ Ensure API proxy rules are correct in your config file
4. ✅ Test API endpoints directly to confirm backend is working
5. ✅ Check browser console for specific error messages

### Static Assets Not Loading
1. ✅ Verify static file paths are not caught by rewrite rules
2. ✅ Check browser console for 404 errors on specific files
3. ✅ Ensure static file exceptions are in your config
4. ✅ Verify build process completed successfully

## Configuration Files Summary

| Platform | File Location | Auto-Deployed | Notes |
|----------|---------------|---------------|-------|
| Apache | `frontend/public/.htaccess` | ✅ Yes | Requires mod_rewrite |
| Nginx | `frontend/deployment/nginx/default.conf` | ✅ Yes (Docker) | Part of Docker build |
| IIS | `frontend/public/web.config` | ✅ Yes | Requires URL Rewrite |
| Netlify | `frontend/public/_redirects` | ✅ Yes | Update backend URLs |
| Vercel | `vercel.json` (root) | ✅ Yes | Update backend URLs |
| Firebase | Create `firebase.json` | ❌ Manual | See docs above |
| AWS S3 | CloudFront config | ❌ Manual | Configure error pages |
| GitHub Pages | Copy to `404.html` | ❌ Manual | Build script needed |

## Related Files

### Configuration Files
- `frontend/public/.htaccess` - Apache server configuration with SPA routing
- `frontend/public/_redirects` - Netlify/Render redirect rules
- `frontend/public/web.config` - IIS server configuration
- `vercel.json` - Vercel deployment configuration
- `frontend/deployment/nginx/default.conf` - Nginx configuration (Docker)
- `deployment/nginx/nginx.conf` - Main reverse proxy configuration

### Application Files
- `frontend/src/App.js` - React Router route definitions
- `frontend/src/pages/VerifyTrainer.js` - Trainer verification page component
- `frontend/src/pages/VerifyCertificate.js` - Certificate verification page component
- `backend/routes/verifyRoutes.js` - Backend verification API routes
- `backend/controllers/verifyController.js` - Verification endpoint handlers
- `backend/controllers/adminTrainerController.js` - QR code generation logic

## Additional Resources

- [React Router Documentation](https://reactrouter.com/en/main/start/concepts#server-side-routing)
- [Apache mod_rewrite Documentation](https://httpd.apache.org/docs/current/mod/mod_rewrite.html)
- [Nginx try_files Documentation](https://nginx.org/en/docs/http/ngx_http_core_module.html#try_files)
- [IIS URL Rewrite Documentation](https://learn.microsoft.com/en-us/iis/extensions/url-rewrite-module/using-the-url-rewrite-module)
- [Netlify Redirects Documentation](https://docs.netlify.com/routing/redirects/)
- [Vercel Configuration Documentation](https://vercel.com/docs/projects/project-configuration)

## Support

If you continue to experience issues after following this guide:
1. Check the platform-specific troubleshooting section
2. Review your web server's error logs
3. Verify the configuration file is being read by your server
4. Test with a simple route first (e.g., `/courses`)
5. Ensure your build process completed without errors
6. Contact your hosting provider's support if configuration options are limited
