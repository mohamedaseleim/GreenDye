# Deployment Fix for Apache Servers (Heliohost)

## Problem
When deploying the GreenDye Academy frontend on Apache servers (such as Heliohost), direct URLs like `/verify/trainer/TR-74664D06` or `/verify/certificate/CERT-xxx` result in "404 Page Not Found" errors, even though these routes work correctly when navigating from within the application.

## Root Cause
GreenDye Academy is a Single Page Application (SPA) built with React. In an SPA, all routing is handled by JavaScript on the client side. When you navigate within the app (clicking links), React Router handles the routing without making new requests to the server. However, when you access a URL directly (refresh the page, scan a QR code, or type the URL), the browser makes a request to the server for that specific path.

On Apache servers without proper configuration, the server tries to find a file or directory matching that path (e.g., `/verify/trainer/TR-74664D06`) and returns a 404 error when it doesn't exist.

## Solution
The `.htaccess` file in `frontend/public/` configures Apache's mod_rewrite module to redirect all non-file, non-directory requests to `index.html`, allowing React Router to handle the routing on the client side.

### What the .htaccess does:
1. **Enables URL rewriting** with `RewriteEngine On`
2. **Preserves real files and directories** - If the requested path is an actual file or directory, serve it normally
3. **Preserves API requests** - Requests to `/api/*` are passed through to the backend
4. **Preserves static assets** - Requests to `/uploads/*` and `/invoices/*` are passed through
5. **Routes everything else to index.html** - All other requests are rewritten to serve `index.html`, where React Router takes over

## For Other Deployment Platforms

### Nginx
If deploying with Nginx (already configured in `deployment/nginx/nginx.conf`), no changes are needed as the configuration already handles client-side routing correctly.

### Netlify
Create a `_redirects` file in `frontend/public/`:
```
/*    /index.html   200
```

### Vercel
Create a `vercel.json` in the project root:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Static File Hosting
Ensure your hosting provider supports:
- URL rewriting or redirects
- Serving the same HTML file for all routes
- Preserving the URL in the browser address bar

## Testing the Fix
After deploying with the `.htaccess` file:

1. **Test Trainer Verification**: Navigate to `/verify/trainer/TR-XXXXXX` (use a real trainer ID)
2. **Test Certificate Verification**: Navigate to `/verify/certificate/CERT-XXXXXX` (use a real certificate ID)
3. **Test Deep Links**: Navigate to any app route directly (e.g., `/courses`, `/admin/dashboard`)
4. **Test Refresh**: On any page within the app, refresh the browser

All of these should work without showing 404 errors.

## Troubleshooting

### Still Getting 404 Errors
1. Verify that `.htaccess` file is uploaded to the server in the same directory as `index.html`
2. Check that `mod_rewrite` is enabled on your Apache server
3. Verify that `.htaccess` files are allowed (check `AllowOverride` setting)
4. Check file permissions (`.htaccess` should be readable by the web server)

### API Requests Fail
If API requests stop working after adding `.htaccess`:
1. Ensure your API is accessible at `/api/*` paths
2. Check that the backend is running and accessible
3. Verify CORS settings in the backend allow requests from your frontend domain

## Related Files
- `frontend/public/.htaccess` - Apache configuration for SPA routing
- `deployment/nginx/nginx.conf` - Nginx configuration (already handles SPA routing)
- `frontend/src/App.js` - React Router configuration
