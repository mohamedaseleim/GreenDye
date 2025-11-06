# Dynamic Page Rendering Feature

## Overview
The Dynamic Page Rendering feature allows administrators to create custom pages through the Admin Dashboard that are automatically accessible to users via clean, SEO-friendly URLs.

## Features
- ✅ Public page rendering with custom URLs
- ✅ 7 predefined page templates
- ✅ Multilingual content support (English, Arabic, French)
- ✅ SEO meta tags (title, description, keywords)
- ✅ Template-based styling
- ✅ Draft/Published workflow
- ✅ Secure API with input sanitization

## How to Create a Page

### Step 1: Access Admin Dashboard
1. Log in as an administrator
2. Navigate to `/admin/pages`

### Step 2: Create a New Page
1. Click the "Add Page" button
2. Fill in the page details:
   - **Slug**: URL-friendly identifier (e.g., "about-us", "privacy-policy")
   - **Title**: Page title in multiple languages
   - **Content**: Page content in HTML format (supports multiple languages)
   - **Meta Description**: SEO description (optional)
   - **Template**: Choose from 7 available templates
   - **Status**: Set to "published" to make the page publicly accessible

### Step 3: Publish
1. Set the status to "Published"
2. Save the page
3. The page will be immediately accessible at `/<slug>`

## Available Templates

### 1. Default Template
Basic page layout with title and content.
```
Use for: General content pages
```

### 2. Hero Template
Large banner with title and subtitle, followed by content.
```
Use for: Landing pages, featured content
```

### 3. About Template
Clean layout optimized for "About Us" pages.
```
Use for: Company information, team pages
```

### 4. Contact Template
Elevated paper design for contact information.
```
Use for: Contact pages, inquiry forms
```

### 5. FAQ Template
Structured layout for frequently asked questions.
```
Use for: FAQ pages, help documentation
```

### 6. Terms Template
Professional document layout with formatted sections.
```
Use for: Terms & Conditions, legal documents
```

### 7. Privacy Template
Similar to Terms template, optimized for privacy policies.
```
Use for: Privacy Policy, data protection information
```

## Example URLs

Once pages are created and published, they will be accessible at:

| Slug | URL | Example Use |
|------|-----|-------------|
| about-us | `/about-us` | About Us page |
| privacy-policy | `/privacy-policy` | Privacy Policy |
| terms-conditions | `/terms-conditions` | Terms & Conditions |
| faq | `/faq` | Frequently Asked Questions |
| contact | `/contact` | Contact Information |

## Multilingual Support

Pages support content in three languages:
- **English (en)** - Default language
- **Arabic (ar)** - Right-to-left (RTL) support
- **French (fr)** - Additional language

Content will be displayed in the user's selected language, with automatic fallback to English if content is not available in the selected language.

## SEO Features

Each page supports:
- **Title**: Appears in browser tab and search results
- **Meta Description**: Search engine description
- **Meta Keywords**: Search engine keywords
- **Canonical URL**: Preferred page URL (optional)
- **Open Graph Tags**: Social media sharing (optional)

The page title will automatically be set as:
```
<title>{Page Title} - GreenDye Academy</title>
```

## API Endpoints

### Get Published Page
```
GET /api/pages/:slug
```

**Response:**
```json
{
  "success": true,
  "data": {
    "slug": "about-us",
    "title": {
      "en": "About Us",
      "ar": "من نحن",
      "fr": "À propos de nous"
    },
    "content": {
      "en": "<p>Content in English</p>",
      "ar": "<p>المحتوى بالعربية</p>",
      "fr": "<p>Contenu en français</p>"
    },
    "template": "about",
    "status": "published"
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "message": "Page not found"
}
```

## Security

- ✅ Only **published** and **active** pages are accessible
- ✅ Draft pages return 404 to public users
- ✅ Input sanitization prevents NoSQL injection
- ✅ Sensitive fields (author, version) are filtered from API response
- ✅ XSS protection through React's built-in sanitization

## Technical Details

### Backend
- **Route**: `backend/routes/pageRoutes.js`
- **Controller**: `backend/controllers/pageController.js`
- **Model**: `backend/models/Page.js`
- **Tests**: `backend/__tests__/integration/pages.test.js`

### Frontend
- **Component**: `frontend/src/pages/DynamicPage.js`
- **Route**: `/:slug` (catch-all route before 404)
- **Tests**: `frontend/src/__tests__/DynamicPage.test.js`

### Database Schema
```javascript
{
  slug: String (unique, lowercase, indexed),
  title: Map<String, String>, // Multilingual
  content: Map<String, String>, // Multilingual
  metaDescription: Map<String, String>,
  metaKeywords: [String],
  status: 'draft' | 'published' | 'archived',
  template: 'default' | 'hero' | 'about' | 'contact' | 'faq' | 'terms' | 'privacy',
  isActive: Boolean,
  publishedAt: Date,
  author: ObjectId,
  // ... other fields
}
```

## Testing

### Backend Tests
```bash
cd backend
npm test -- __tests__/integration/pages.test.js
```

### Frontend Tests
```bash
cd frontend
npm test -- DynamicPage.test.js
```

## Common Issues

### Page Not Found (404)
**Possible causes:**
1. Page status is "draft" instead of "published"
2. Page `isActive` is set to `false`
3. Slug doesn't match the URL
4. Page doesn't exist in database

**Solution:** Verify page exists and is published in Admin Dashboard.

### Content Not Displaying in Selected Language
**Cause:** Content not available in the selected language.

**Solution:** Content will automatically fallback to English. Add content for all supported languages in the Admin Dashboard.

### Route Conflict
**Issue:** Dynamic page route conflicts with existing routes.

**Solution:** The `/:slug` route is intentionally placed as the last route before 404. Existing routes (like `/courses`, `/login`) have higher priority and will not be affected.

## Future Enhancements

Potential improvements for future versions:
- [ ] Page preview before publishing
- [ ] Version history and rollback
- [ ] Custom CSS per page
- [ ] Rich text editor for content
- [ ] Image upload integration
- [ ] Page analytics (views, engagement)
- [ ] Custom template builder
- [ ] Scheduled publishing

## Support

For issues or questions:
1. Check the Admin Dashboard for page status
2. Verify the slug matches the URL
3. Check browser console for errors
4. Review backend logs for API errors

## Related Documentation
- [Admin Dashboard Features](./ADMIN_DASHBOARD_FEATURES.md)
- [Security Architecture](./SECURITY_ARCHITECTURE.md)
- [API Documentation](./docs/API.md)
