# Security Features Testing Examples

This document provides examples for manually testing the security features when MongoDB is available.

## Prerequisites

1. Start MongoDB
2. Configure `.env` file with MongoDB connection
3. Start the backend server: `npm run dev`
4. Create an admin user

## Setup Admin User

```javascript
// Run this in MongoDB shell or use the register endpoint
// Then update the user role to 'admin' in the database
db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { role: "admin" } }
)
```

## Test Scenarios

### 1. Test Failed Login Tracking

**Scenario 1: Single failed login**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "wrongpassword"}'
```

Expected: 
- Returns 401 Unauthorized
- Creates a FailedLoginAttempt record in database

**Scenario 2: Multiple failed logins (trigger alert)**
```bash
# Run this 6 times to trigger security alert
for i in {1..6}; do
  curl -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email": "test@example.com", "password": "wrongpassword"}'
  sleep 1
done
```

Expected:
- 6 FailedLoginAttempt records created
- SecurityAlert created with type "multiple_failed_logins"
- Severity: "medium"

**Scenario 3: Auto-blacklist (10+ failed attempts)**
```bash
# Run this 11 times to trigger auto-blacklist
for i in {1..11}; do
  curl -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email": "test@example.com", "password": "wrongpassword"}'
  sleep 1
done
```

Expected:
- IP automatically added to blacklist
- Subsequent requests from same IP blocked with 403
- SecurityAlert with severity "high"

### 2. Test Activity Monitoring

**Login successfully**
```bash
# First get a token
TOKEN=$(curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "yourpassword"}' \
  | jq -r '.data.token')

echo "Token: $TOKEN"
```

**View activity logs**
```bash
curl -X GET "http://localhost:5000/api/admin/security/activity?limit=20" \
  -H "Authorization: Bearer $TOKEN"
```

Expected:
- Returns recent activities including the login
- Shows actionType: "login"
- Includes IP address and user agent

**View activity by type**
```bash
# View only login activities
curl -X GET "http://localhost:5000/api/admin/security/activity?actionType=login&limit=50" \
  -H "Authorization: Bearer $TOKEN"
```

### 3. Test Security Dashboard

**Get dashboard overview**
```bash
curl -X GET "http://localhost:5000/api/admin/security/dashboard" \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.'
```

Expected response structure:
```json
{
  "success": true,
  "data": {
    "overview": {
      "failedLogins24h": 17,
      "alertsBySeverity": {
        "high": 1,
        "medium": 1
      },
      "topTargetedIPs": [...],
      "activeBlacklists": 1
    },
    "recentActivities": [...],
    "openAlerts": {...},
    "loginTrends": [...]
  }
}
```

### 4. Test Failed Login Viewing

**View all failed logins**
```bash
curl -X GET "http://localhost:5000/api/admin/security/failed-logins" \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.'
```

**View failed logins by email**
```bash
curl -X GET "http://localhost:5000/api/admin/security/failed-logins?email=test@example.com" \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.'
```

Expected:
- Returns list of failed login attempts
- Shows topOffendingIPs with counts

### 5. Test Security Alerts

**View open alerts**
```bash
curl -X GET "http://localhost:5000/api/admin/security/alerts?status=open" \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.'
```

**Update alert status**
```bash
# Get an alert ID first
ALERT_ID="<alert-id-from-previous-response>"

curl -X PUT "http://localhost:5000/api/admin/security/alerts/$ALERT_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "resolved",
    "notes": "Investigated - false positive, legitimate user forgot password"
  }' \
  | jq '.'
```

Expected:
- Alert status updated to "resolved"
- resolvedBy set to admin user ID
- resolvedAt timestamp set

**Filter alerts by severity**
```bash
curl -X GET "http://localhost:5000/api/admin/security/alerts?severity=high&status=open" \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.'
```

### 6. Test IP Blacklist Management

**View blacklist**
```bash
curl -X GET "http://localhost:5000/api/admin/security/blacklist?isActive=true" \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.'
```

**Add IP to blacklist**
```bash
curl -X POST "http://localhost:5000/api/admin/security/blacklist" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "ipAddress": "10.0.0.100",
    "reason": "manual_block",
    "description": "Suspicious activity detected during penetration test",
    "expiresAt": "2025-12-31T23:59:59.000Z"
  }' \
  | jq '.'
```

Expected:
- IP added to blacklist
- SecurityAlert created
- isActive: true

**Remove IP from blacklist**
```bash
# Get blacklist entry ID first
BLACKLIST_ID="<blacklist-id-from-previous-response>"

curl -X DELETE "http://localhost:5000/api/admin/security/blacklist/$BLACKLIST_ID" \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.'
```

Expected:
- isActive set to false
- IP can access system again

### 7. Test Activity Statistics

**Get 24-hour statistics**
```bash
curl -X GET "http://localhost:5000/api/admin/security/activity/stats?period=24h" \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.'
```

**Get 7-day statistics**
```bash
curl -X GET "http://localhost:5000/api/admin/security/activity/stats?period=7d" \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.'
```

Expected response structure:
```json
{
  "success": true,
  "data": {
    "period": "24h",
    "activityByType": [
      {"_id": "login", "count": 45},
      {"_id": "create", "count": 23}
    ],
    "activityByStatus": [
      {"_id": "success", "count": 95},
      {"_id": "failure", "count": 5}
    ],
    "mostActiveUsers": [...],
    "mostActiveIPs": [...]
  }
}
```

### 8. Test Logout Activity

**Logout and check activity log**
```bash
# Logout
curl -X GET "http://localhost:5000/api/auth/logout" \
  -H "Authorization: Bearer $TOKEN"

# Then check if logout was logged (need new admin token)
curl -X GET "http://localhost:5000/api/admin/security/activity?actionType=logout" \
  -H "Authorization: Bearer $NEW_TOKEN" \
  | jq '.'
```

Expected:
- Logout activity logged with actionType: "logout"
- Includes user, email, IP, and user agent

## MongoDB Verification Queries

**Check failed login attempts**
```javascript
db.failedloginattempts.find().sort({attemptedAt: -1}).limit(10)
```

**Check security alerts**
```javascript
db.securityalerts.find({status: "open"}).sort({createdAt: -1})
```

**Check IP blacklist**
```javascript
db.ipblacklists.find({isActive: true})
```

**Check activity logs**
```javascript
db.activitylogs.find().sort({timestamp: -1}).limit(10)
```

**Count activities by type**
```javascript
db.activitylogs.aggregate([
  {$group: {_id: "$actionType", count: {$sum: 1}}},
  {$sort: {count: -1}}
])
```

## Testing Auto-Blacklist Expiration

The auto-blacklist feature sets a 24-hour expiration. To test:

1. Trigger auto-blacklist (10+ failed logins)
2. Verify IP is blocked
3. Update expiration to near future:
   ```javascript
   db.ipblacklists.updateOne(
     {ipAddress: "your-ip"},
     {$set: {expiresAt: new Date(Date.now() + 60000)}} // 1 minute
   )
   ```
4. Wait 1 minute
5. Verify IP can access system again (middleware checks expiration)

## Testing Without Database

Some components can be tested without MongoDB:

**Test middleware loading**
```bash
cd backend
node -e "const security = require('./middleware/security'); console.log('Middleware loaded:', Object.keys(security));"
```

**Test service loading**
```bash
node -e "const service = require('./services/securityService'); console.log('Service loaded:', Object.keys(service));"
```

**Test controller loading**
```bash
node -e "const controller = require('./controllers/adminSecurityController'); console.log('Controller loaded:', Object.keys(controller));"
```

## Integration Test

To run the full test suite (requires MongoDB):

```bash
# Start MongoDB
docker run -d -p 27017:27017 --name mongo-test mongo:latest

# Run tests
cd backend
npm test -- __tests__/integration/adminSecurity.test.js --verbose
npm test -- __tests__/integration/failedLoginTracking.test.js --verbose

# Cleanup
docker stop mongo-test && docker rm mongo-test
```

## Performance Considerations

When testing with large datasets:

1. **Activity Logs**: Automatically deleted after 90 days (TTL index)
2. **Failed Logins**: Automatically deleted after 30 days (TTL index)
3. **Indexes**: Ensure MongoDB has created all indexes:
   ```javascript
   db.activitylogs.getIndexes()
   db.failedloginattempts.getIndexes()
   db.securityalerts.getIndexes()
   db.ipblacklists.getIndexes()
   ```

## Troubleshooting

**IP not being blacklisted?**
- Check if 10+ failed attempts within 1 hour
- Verify securityService is being called
- Check MongoDB for FailedLoginAttempt records

**Alerts not showing?**
- Check alert status filter (default is 'open')
- Verify SecurityAlert records in MongoDB
- Check user permissions (admin role required)

**Activity not logged?**
- Verify ActivityLog model is imported
- Check if logActivity is being called
- Verify MongoDB connection

**Blacklisted IP can still access?**
- Check if middleware is applied before routes
- Verify isActive is true
- Check expiresAt date is in future or null
