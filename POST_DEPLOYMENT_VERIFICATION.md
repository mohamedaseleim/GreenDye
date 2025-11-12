# Post-Deployment Verification Checklist

Use this checklist to verify the QR code 404 fix is working correctly after deployment.

## Pre-Deployment Verification

### Build Verification
- [ ] Run `cd frontend && npm run build`
- [ ] Verify `build/.htaccess` exists
- [ ] Verify `build/_redirects` exists
- [ ] Verify `build/web.config` exists
- [ ] Check `build/index.html` exists
- [ ] No build errors reported

### Configuration Review
- [ ] Review `.htaccess` for any custom URL patterns
- [ ] Update backend URL in `_redirects` if using Netlify/Render
- [ ] Update backend URL in `vercel.json` if using Vercel
- [ ] Verify environment variables are set (`FRONTEND_URL`)

## Post-Deployment Verification

### Critical Routes (QR Code URLs)

#### Trainer Verification
- [ ] Get a real trainer ID from database (e.g., TR-74664D06)
- [ ] Open `https://your-domain.com/verify/trainer/TR-74664D06`
- [ ] Page loads without 404 error
- [ ] Trainer details display correctly
- [ ] Verification status shows (Approved/Pending/etc.)

#### Certificate Verification
- [ ] Get a real certificate ID from database
- [ ] Open `https://your-domain.com/verify/certificate/CERT-XXXXX`
- [ ] Page loads without 404 error
- [ ] Certificate details display correctly
- [ ] Verification status shows correctly

### Standard Routes
- [ ] Direct URL: `/courses` - Course listing loads
- [ ] Direct URL: `/about` - About page loads
- [ ] Direct URL: `/contact` - Contact page loads
- [ ] Direct URL: `/login` - Login page loads

### Protected Routes (After Login)
- [ ] Direct URL: `/dashboard` - Redirects to login or loads dashboard
- [ ] Direct URL: `/my-courses` - Redirects to login or loads courses
- [ ] Direct URL: `/admin/dashboard` - Redirects to login or loads admin panel

### Page Refresh Test
- [ ] Navigate to home page
- [ ] Click to courses page
- [ ] Press F5 (refresh)
- [ ] Page reloads without 404
- [ ] Navigate to trainer verification
- [ ] Press F5 (refresh)
- [ ] Page reloads without 404

### QR Code Scanning Test
- [ ] Generate QR code for a trainer (from admin panel)
- [ ] Scan with mobile device
- [ ] Verification page opens correctly
- [ ] Generate QR code for a certificate
- [ ] Scan with mobile device
- [ ] Verification page opens correctly

### API Functionality
- [ ] Login works correctly
- [ ] API calls return data (check browser console)
- [ ] Image uploads work
- [ ] Course enrollment works
- [ ] No CORS errors in console

### Static Assets
- [ ] Images load correctly
- [ ] CSS styles applied
- [ ] JavaScript executes
- [ ] Fonts load properly
- [ ] No 404 errors in browser console for assets

### Mobile Testing
- [ ] Open site on mobile device
- [ ] Scan QR code
- [ ] Verify routes work
- [ ] Page refresh works
- [ ] No layout issues

### Performance Check
- [ ] Page loads in reasonable time (< 3s)
- [ ] No unnecessary redirects
- [ ] Check browser network tab for issues
- [ ] Verify gzip compression is working

## Platform-Specific Checks

### Apache Servers
- [ ] Verify `.htaccess` is uploaded to web root
- [ ] Check Apache error logs: `tail -f /var/log/apache2/error.log`
- [ ] Confirm mod_rewrite is enabled: `apache2ctl -M | grep rewrite`
- [ ] Test direct URL access works
- [ ] Test query parameters work: `/verify/trainer/TR-123?source=qr`

### Nginx Servers
- [ ] Verify nginx config is loaded: `nginx -t`
- [ ] Check nginx error logs: `tail -f /var/log/nginx/error.log`
- [ ] Confirm try_files directive is in config
- [ ] Test direct URL access works
- [ ] Reload nginx if config changed: `nginx -s reload`

### IIS Servers
- [ ] Verify `web.config` is in application root
- [ ] Check URL Rewrite module is installed (IIS Manager)
- [ ] Review IIS logs for errors
- [ ] Test direct URL access works
- [ ] Verify application pool is running

### Cloud Platforms (Netlify/Vercel)
- [ ] Check deployment logs for errors
- [ ] Verify `_redirects` or `vercel.json` is detected
- [ ] Test direct URL access works
- [ ] Check function logs if using serverless
- [ ] Verify environment variables are set

## Troubleshooting

### If Getting 404 Errors

#### Apache
```bash
# Enable mod_rewrite
sudo a2enmod rewrite
sudo systemctl restart apache2

# Check .htaccess permissions
chmod 644 /var/www/html/.htaccess

# Test configuration
apache2ctl configtest
```

#### Nginx
```bash
# Test configuration
nginx -t

# Reload configuration
nginx -s reload

# Check if try_files is working
grep -r "try_files" /etc/nginx/
```

#### IIS
1. Install URL Rewrite module from https://www.iis.net/downloads/microsoft/url-rewrite
2. Restart IIS
3. Verify web.config is readable by application pool

### If API Calls Fail
- [ ] Check browser console for CORS errors
- [ ] Verify backend is accessible: `curl https://api-domain.com/api/health`
- [ ] Check backend CORS settings allow frontend domain
- [ ] Verify proxy rules in web server config

### If Static Assets Don't Load
- [ ] Check browser console for specific 404 errors
- [ ] Verify build output includes static files
- [ ] Check web server static file serving
- [ ] Verify paths in rewrite rules exclude `/static/`

## Browser Console Checks

### Expected: No Errors
- [ ] No 404 errors for routes
- [ ] No CORS errors
- [ ] No JavaScript errors
- [ ] React app boots successfully

### Expected: Info/Debug Messages
- [ ] Analytics tracking messages (if enabled)
- [ ] Redux/Context state updates
- [ ] Socket connection messages (if applicable)

## Performance Validation

### Network Tab (Browser DevTools)
- [ ] `index.html` returns 200 OK
- [ ] Static assets cached properly
- [ ] API calls return data
- [ ] Compression enabled (check Response Headers)

### Response Headers to Verify
```
Content-Encoding: gzip (if compression enabled)
X-Content-Type-Options: nosniff
X-Frame-Options: DENY (or SAMEORIGIN)
Cache-Control: public, max-age=31536000 (for static assets)
```

## Final Sign-Off

### Critical Functionality
- [ ] ✅ Trainer QR codes work
- [ ] ✅ Certificate QR codes work
- [ ] ✅ Direct URLs work
- [ ] ✅ Page refresh works
- [ ] ✅ API calls work
- [ ] ✅ Static assets load
- [ ] ✅ No console errors

### Documentation
- [ ] ✅ Team informed of changes
- [ ] ✅ Deployment guide followed
- [ ] ✅ Troubleshooting steps understood
- [ ] ✅ Contact information for support ready

### Rollback Plan (If Issues Found)
- [ ] Previous deployment backed up
- [ ] Rollback procedure documented
- [ ] Team notified of issues
- [ ] Issue tracking ticket created

## Sign-Off

**Tested By:** _________________

**Date:** _________________

**Platform:** _________________

**Result:** ☐ PASS  ☐ FAIL  ☐ PARTIAL

**Notes:**
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

**Issues Found:**
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

**Action Items:**
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
