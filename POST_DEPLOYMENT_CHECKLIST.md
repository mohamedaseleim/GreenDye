# Post-Deployment Verification Checklist

After deploying these fixes to your Heliohost VPS, please verify the following:

## ✅ Issue #1: Certificate Management Display

### Test Steps:
1. Login to Admin Dashboard
2. Navigate to **Certificate Management**
3. Click "Add Certificate" or "Create Certificate"
4. Fill in the form with test data:
   - Select or enter a trainee name
   - Select or enter a course title
   - Add any additional optional fields
5. Click "Create" or "Submit"

### Expected Results:
- ✅ Success message appears: "Certificate created successfully"
- ✅ The certificate list refreshes automatically
- ✅ The newly created certificate appears in the list **immediately**
- ✅ The dialog closes after the list updates
- ✅ No need to manually refresh the page

### If It Fails:
- Check browser console for errors (F12 → Console tab)
- Verify the frontend build includes the updated AdminCertificates.js file
- Clear browser cache and try again

---

## ✅ Issue #2: QR Code URLs (Page Not Found)

### Test Steps:

#### A. Test Trainer Verification:
1. In Admin Dashboard, go to **Trainer Management**
2. Find any approved trainer
3. Copy the Trainer ID (e.g., TR-74664D06)
4. Open a new browser window/tab
5. Navigate directly to: `https://greendye.org/verify/trainer/TR-74664D06`
   (replace with your actual domain and trainer ID)

#### B. Test Certificate Verification:
1. In Admin Dashboard, go to **Certificate Management**
2. Find any valid certificate
3. Copy the Certificate ID (e.g., CERT-ABC12345)
4. Open a new browser window/tab
5. Navigate directly to: `https://greendye.org/verify/certificate/CERT-ABC12345`
   (replace with your actual domain and certificate ID)

#### C. Test QR Code Scanning:
1. Generate a QR code for a trainer or certificate verification URL
2. Scan the QR code with your phone
3. The verification page should load

#### D. Test Page Refresh:
1. Navigate to any page within the app (e.g., /admin/dashboard)
2. Press F5 to refresh the page
3. The page should reload successfully (not 404)

### Expected Results:
- ✅ Direct URLs load correctly (no 404 error)
- ✅ QR code scanning opens the verification page
- ✅ Trainer verification page displays trainer details
- ✅ Certificate verification page displays certificate details
- ✅ Page refresh works on any route
- ✅ Browser back/forward buttons work correctly

### If It Fails:
- Verify `.htaccess` file exists in the web root (same directory as index.html)
- Check Apache error logs for mod_rewrite errors
- Verify mod_rewrite is enabled: Contact Heliohost support if needed
- Ensure AllowOverride is set to allow .htaccess files
- Check file permissions: .htaccess should be readable by the web server

---

## ✅ Issue #3: Enrollment Management Course Selection

### Test Steps:
1. Login to Admin Dashboard
2. Navigate to **Enrollment Management**
3. Click on the "Manual Enroll" or "Manually Enroll User" tab
4. In the course dropdown/field, click to open the list
5. Select any course from the dropdown

### Expected Results:
- ✅ The course dropdown opens and displays course names
- ✅ Course names are readable (not showing "[object Object]")
- ✅ Selecting a course does NOT cause a white/blank page
- ✅ The selected course name appears in the field
- ✅ You can proceed to select a user and create the enrollment
- ✅ Course names display correctly in all languages (if using multilingual setup)

### Test Different Course Types:
- Try courses with English names
- Try courses with Arabic names (if applicable)
- Try courses with French names (if applicable)
- All should work without crashes

### If It Fails:
- Check browser console for JavaScript errors (F12 → Console tab)
- Verify the frontend build includes the updated AdminEnrollments.js file
- Clear browser cache and hard reload (Ctrl+F5)
- Check if courses are being fetched successfully (Network tab in browser DevTools)

---

## Additional Verification

### Check All Modified Files Are Deployed:
```bash
# In your web root directory, verify these files exist:
ls -la .htaccess                    # Should exist with proper permissions
ls -la static/js/main.*.js          # Frontend JavaScript bundle
```

### Verify .htaccess Content:
```bash
cat .htaccess
# Should contain:
# - RewriteEngine On
# - RewriteBase /
# - Rules to preserve /api/, /uploads/, /invoices/
# - Rule to redirect to /index.html
```

### Browser Console Check:
1. Open any page in the application
2. Press F12 to open Developer Tools
3. Go to Console tab
4. Should see no errors (red messages)

---

## Common Issues & Solutions

### Issue: .htaccess not working
**Solution**: 
- Check that the file is named exactly `.htaccess` (with the leading dot)
- Verify mod_rewrite is enabled on your Apache server
- Contact Heliohost support to enable mod_rewrite if needed

### Issue: Still getting 404 on QR codes
**Solution**:
- Verify the frontend is deployed to the root directory, not a subdirectory
- If in a subdirectory, update RewriteBase in .htaccess to match your path
- Clear Cloudflare cache if using a CDN

### Issue: Course dropdown still crashes
**Solution**:
- Clear browser cache completely
- Hard reload the page (Ctrl+F5 or Cmd+Shift+R)
- Verify the frontend build is the latest version
- Check the main JavaScript bundle contains the getCourseTitle function

### Issue: Certificates still don't appear
**Solution**:
- Check browser Network tab to see if the API call succeeds
- Verify the backend is running and accessible
- Check if there are any CORS errors in the console

---

## Performance Check

After verification, also check:
- ✅ Page load times are still fast
- ✅ No new errors in browser console
- ✅ No errors in server logs
- ✅ API calls complete successfully

---

## Rollback Plan (If Needed)

If you encounter critical issues:

1. **Rollback .htaccess**: Delete or rename the .htaccess file temporarily
2. **Rollback frontend**: Redeploy the previous frontend build
3. **Contact support**: Report the specific error messages you're seeing

---

## Success Criteria

All three issues should be resolved:
- ✅ Certificates appear immediately in the list after creation
- ✅ QR codes and direct URLs work without 404 errors
- ✅ Course selection in enrollment management doesn't crash

If all tests pass, you're good to go! 🎉

---

## Need Help?

If you encounter any issues during verification:

1. Check the browser console for error messages
2. Check Apache error logs: `tail -f /path/to/apache/error.log`
3. Review `DEPLOYMENT_FIX.md` for troubleshooting tips
4. Create a GitHub issue with:
   - The specific test that failed
   - Error messages from browser console
   - Error messages from server logs
   - Screenshots if applicable
