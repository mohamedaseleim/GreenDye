# Nginx Configuration Fix for React SPA Routing

## Problem

The original Nginx configuration on greendye.org had **nested location blocks** that caused 404 errors for dynamic routes accessed via QR codes, such as `/verify/trainer/TR-74664D06`.

### Root Cause

The issue occurred because the static asset caching rules were **nested inside** the root `location /` block:

```nginx
# ❌ INCORRECT - Nested location blocks
location / {
    try_files $uri $uri/ /index.html;
    
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Why This Causes Problems

1. **Nginx processes only ONE location block per request** - it doesn't cascade through nested blocks in the way you might expect
2. When a request comes in for `/verify/trainer/TR-74664D06`:
   - Nginx matches it to the `location /` block
   - The nested regex location block for static assets is **NOT evaluated** for non-static file requests
   - However, the nested structure interferes with the `try_files` directive's ability to properly fall back to `index.html`
3. The result: Nginx returns a 404 instead of serving `index.html` for React Router to handle the route

## Solution

**Separate the static asset location block from the root "/" location block:**

```nginx
# ✅ CORRECT - Separate location blocks
# Static assets - separate block with regex matching (higher precedence)
location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# React SPA - catch all for client-side routing
location / {
    try_files $uri $uri/ /index.html;
}
```

### Why This Works

1. **Nginx location matching precedence** (in order):
   - Exact match: `location = /path`
   - Prefix match with `^~`: `location ^~ /path`
   - **Regex match: `location ~* pattern`** ← Our static assets block
   - Longest prefix match: `location /path`
   - Default: `location /` ← Our catch-all block

2. When a request comes in:
   - **Static files** (`.js`, `.css`, etc.) match the regex location and get cached
   - **Dynamic routes** (like `/verify/trainer/...`) don't match the regex, so they fall through to `location /`
   - The `location /` block's `try_files` directive serves `index.html`, allowing React Router to handle the route

## Implementation

### For Production Servers (VPS, Dedicated Hosting)

Use the corrected configuration in:
- **`deployment/nginx/nginx-spa-correct.conf`** - Complete example configuration
- **`frontend/deployment/nginx/default.conf`** - Docker/container configuration

### Location Block Order

The correct order of location blocks for React SPA:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/html;
    index index.html;

    # 1. API routes (exact/prefix matches) - highest priority
    location /api {
        proxy_pass http://localhost:5000;
        # ... proxy settings
    }

    # 2. Uploaded files (specific prefix)
    location /uploads {
        alias /var/www/uploads;
        expires 1y;
    }

    # 3. Static assets (regex match) - higher precedence than "/"
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # 4. Catch-all for React Router (prefix match "/" - lowest precedence)
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## Testing the Fix

After applying the corrected configuration:

### 1. Test Static Assets
```bash
curl -I https://your-domain.com/static/js/main.abc123.js
# Should return: Cache-Control: public, immutable
```

### 2. Test Dynamic Routes
```bash
curl -I https://your-domain.com/verify/trainer/TR-74664D06
# Should return: 200 OK (serving index.html)
```

### 3. Test QR Code Scanning
1. Generate a QR code for a trainer verification URL
2. Scan with a mobile device
3. Should load the verification page without 404 error

### 4. Test Page Refresh
1. Navigate to any dynamic route in the browser
2. Press F5 to refresh
3. Page should reload correctly (not show 404)

## Common Pitfalls to Avoid

### ❌ Don't Nest Location Blocks
```nginx
location / {
    location ~* \.js$ {
        # This won't work as expected!
    }
}
```

### ❌ Don't Put try_files in Multiple Blocks
```nginx
location ~* \.(jpg|jpeg|png)$ {
    try_files $uri =404;  # Unnecessary
}

location / {
    try_files $uri $uri/ /index.html;
}
```

### ✅ Do Keep It Simple and Flat
```nginx
# Specific routes first
location /api { ... }
location /uploads { ... }

# Regex for static assets
location ~* \.(js|css|png|jpg)$ { ... }

# Catch-all last
location / { ... }
```

## Files Updated

1. **`deployment/nginx/nginx-spa-correct.conf`** - NEW: Reference configuration with explanatory comments
2. **`frontend/deployment/nginx/default.conf`** - Fixed nested location blocks
3. **`docs/VPS_INSTALLATION.md`** - Updated Nginx configuration section
4. **`docs/HELIOHOST_INSTALLATION.md`** - Updated both HTTP and HTTPS templates

## Related Resources

- [Nginx Location Directive Documentation](http://nginx.org/en/docs/http/ngx_http_core_module.html#location)
- [Understanding Nginx Location Blocks](https://www.digitalocean.com/community/tutorials/understanding-nginx-server-and-location-block-selection-algorithms)
- [React Router and Server Configuration](https://reactrouter.com/web/guides/primary-components)

## Verification Checklist

After deploying the fix:

- [ ] Direct URL access works: `/verify/trainer/TR-XXXXXX`
- [ ] QR code scanning loads verification pages
- [ ] Page refresh on any route doesn't cause 404
- [ ] Static assets (JS, CSS, images) still load correctly
- [ ] Static assets have proper cache headers (1 year)
- [ ] API requests to `/api/*` still work
- [ ] WebSocket connections (`/socket.io`) still function
- [ ] Uploaded files are accessible via `/uploads/*`

## Support

If you encounter issues after applying this fix:

1. Check Nginx error logs: `tail -f /var/log/nginx/error.log`
2. Test Nginx configuration: `nginx -t`
3. Verify location block order in your config
4. Ensure React build output is in the correct directory
5. Clear browser cache and test again

---

**Last Updated**: November 2024  
**Applies to**: GreenDye v1.2.0+, All Nginx versions
