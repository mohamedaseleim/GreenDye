# Dynamic Page Navigation Feature

## Overview
This feature enables dynamic page navigation in the Header and Footer components, allowing published CMS pages to automatically appear in the site's navigation menus.

## How It Works

### Backend
1. **Page Model** (`backend/models/Page.js`):
   - Added `showInHeader` (Boolean) - Controls if page appears in header navigation
   - Added `showInFooter` (Boolean) - Controls if page appears in footer navigation
   - Added `menuOrder` (Number) - Controls the display order (lower numbers appear first)

2. **Public API Endpoint** (`/api/pages`):
   - **Method**: GET
   - **Access**: Public (no authentication required)
   - **Query Parameters**:
     - `location` (optional): Filter by `header` or `footer`
   - **Response**: Returns published, active pages with navigation settings
   - **Example**:
     ```javascript
     GET /api/pages?location=header
     // Returns pages where showInHeader === true
     ```

### Frontend
1. **Header Component** (`frontend/src/components/Header.js`):
   - Fetches pages on mount with `location=header` parameter
   - Renders dynamic page links after static navigation links
   - Supports multi-language titles based on current language
   - Works in both desktop and mobile navigation menus

2. **Footer Component** (`frontend/src/components/Footer.js`):
   - Fetches pages on mount with `location=footer` parameter
   - Renders dynamic page links in the "Quick Links" section
   - Supports multi-language titles based on current language

3. **Admin Pages Form** (`frontend/src/pages/AdminPages.js`):
   - Added "Navigation Settings" section with:
     - "Show in Header Navigation" checkbox
     - "Show in Footer Navigation" checkbox
     - "Menu Order" number input (for controlling display order)

## Usage Instructions

### For Administrators

1. **Create a New Page**:
   - Go to Admin Dashboard → Page Management
   - Click "Add Page" button
   - Fill in the page details (slug, title, content in all languages)

2. **Configure Navigation Settings**:
   - Check "Show in Header Navigation" if you want the page to appear in the top navigation bar
   - Check "Show in Footer Navigation" if you want the page to appear in the footer links
   - Set "Menu Order" to control where the page appears (0 = first, 1 = second, etc.)
   - Lower numbers appear before higher numbers

3. **Publish the Page**:
   - Set Status to "Published"
   - Click "Create" or "Update"
   - The page will automatically appear in the selected navigation locations

### For Developers

#### API Endpoint Usage

Fetch all published pages for header:
```javascript
const response = await axios.get('/api/pages', {
  params: { location: 'header' }
});
const pages = response.data.data;
```

Fetch all published pages for footer:
```javascript
const response = await axios.get('/api/pages', {
  params: { location: 'footer' }
});
const pages = response.data.data;
```

Fetch all published pages (no filter):
```javascript
const response = await axios.get('/api/pages');
const pages = response.data.data;
```

#### Response Format
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "...",
      "slug": "privacy-policy",
      "title": {
        "en": "Privacy Policy",
        "ar": "سياسة الخصوصية",
        "fr": "Politique de confidentialité"
      },
      "showInHeader": false,
      "showInFooter": true,
      "menuOrder": 1
    }
  ]
}
```

## Multi-Language Support
Pages automatically display in the user's selected language:
- If the page has a title in the current language, it will be displayed
- Falls back to English if the current language is not available
- Falls back to the slug if no title is available

## Examples

### Example 1: Privacy Policy (Footer Only)
- **Slug**: `privacy-policy`
- **Show in Header**: ❌ No
- **Show in Footer**: ✅ Yes
- **Menu Order**: 1
- **Result**: Appears in footer links only

### Example 2: Terms of Service (Both Locations)
- **Slug**: `terms-of-service`
- **Show in Header**: ✅ Yes
- **Show in Footer**: ✅ Yes
- **Menu Order**: 0
- **Result**: Appears in both header and footer, displayed first due to menuOrder=0

### Example 3: Company Info (Header Only)
- **Slug**: `about-company`
- **Show in Header**: ✅ Yes
- **Show in Footer**: ❌ No
- **Menu Order**: 2
- **Result**: Appears in header only, after items with menuOrder 0 and 1

## Testing
Comprehensive tests are included:
- **Backend**: `/backend/__tests__/integration/pages.test.js`
- **Frontend**: `/frontend/src/__tests__/DynamicNavigation.test.js`

Run tests:
```bash
# Backend tests
cd backend
npm test pages.test.js

# Frontend tests
cd frontend
npm test DynamicNavigation.test.js
```

## Security Considerations
- Only published pages with `status: 'published'` and `isActive: true` are returned
- The API endpoint is public (no authentication required) since it only exposes published content
- No sensitive data (author, version, etc.) is included in the response
- Input is sanitized using mongo-sanitize to prevent injection attacks

## Backward Compatibility
- Existing static navigation links (Home, Courses, About, Contact) remain unchanged
- Dynamic pages are added in addition to static links
- Existing pages without navigation flags won't appear in navigation menus
- The feature is fully backward compatible with existing CMS pages
