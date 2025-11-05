# Security & Activity Logs Features - Usage Guide

## Overview
This implementation adds comprehensive security monitoring and activity logging capabilities to the GreenDye Academy admin dashboard.

## Features Implemented

### 1. Real-time Activity Monitoring
Tracks all user actions across the platform with detailed metadata.

**Endpoint:** `GET /api/admin/security/activity`

**Query Parameters:**
- `limit` (number) - Number of records to return (default: 50)
- `user` (ObjectId) - Filter by user ID
- `actionType` - Filter by action type (login, logout, create, read, update, delete, etc.)
- `status` - Filter by status (success, failure, pending)
- `ipAddress` - Filter by IP address
- `startDate` - Start date for filtering
- `endDate` - End date for filtering

**Example Request:**
```bash
curl -H "Authorization: Bearer <admin-token>" \
  "http://localhost:5000/api/admin/security/activity?limit=100&actionType=login"
```

**Response:**
```json
{
  "success": true,
  "count": 50,
  "data": {
    "activities": [...],
    "stats": {
      "login": 45,
      "create": 23,
      "update": 12
    }
  }
}
```

### 2. Failed Login Attempts Tracking
Automatically tracks all failed login attempts with IP addresses and reasons.

**Endpoint:** `GET /api/admin/security/failed-logins`

**Query Parameters:**
- `email` - Filter by email
- `ipAddress` - Filter by IP address
- `startDate` - Start date for filtering
- `endDate` - End date for filtering
- `limit` - Number of records (default: 100)

**Features:**
- Automatic security alert after 5 failed attempts from same IP
- Auto-blacklisting after 10 failed attempts in 1 hour
- Tracks reason for failure (invalid_credentials, user_not_found, account_suspended, account_disabled)
- Stores IP address and user agent

**Example Request:**
```bash
curl -H "Authorization: Bearer <admin-token>" \
  "http://localhost:5000/api/admin/security/failed-logins?ipAddress=192.168.1.1"
```

**Response:**
```json
{
  "success": true,
  "count": 25,
  "data": {
    "attempts": [...],
    "topOffendingIPs": [
      {
        "_id": "192.168.1.100",
        "count": 15,
        "emails": ["user1@example.com", "user2@example.com"],
        "lastAttempt": "2025-11-05T23:00:00.000Z"
      }
    ]
  }
}
```

### 3. Security Alerts Dashboard
Comprehensive security alerts with severity levels and status management.

**Endpoint:** `GET /api/admin/security/alerts`

**Query Parameters:**
- `status` - Filter by status (open, investigating, resolved, false_positive)
- `severity` - Filter by severity (low, medium, high, critical)
- `type` - Filter by alert type
- `startDate` - Start date
- `endDate` - End date

**Alert Types:**
- `multiple_failed_logins` - Multiple failed login attempts
- `suspicious_ip` - Suspicious IP activity
- `unusual_activity` - Unusual user behavior
- `account_breach_attempt` - Account breach attempt
- `privilege_escalation_attempt` - Privilege escalation attempt
- `mass_data_access` - Mass data access pattern
- `blacklisted_ip_attempt` - Blacklisted IP access attempt

**Update Alert Status:**
```bash
curl -X PUT \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"status": "resolved", "notes": "False positive"}' \
  "http://localhost:5000/api/admin/security/alerts/<alert-id>"
```

### 4. IP Blacklist Management
Manage blacklisted IP addresses with expiration support.

**List Blacklist:**
```bash
GET /api/admin/security/blacklist?isActive=true&page=1&limit=50
```

**Add IP to Blacklist:**
```bash
curl -X POST \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "ipAddress": "192.168.1.100",
    "reason": "manual_block",
    "description": "Suspicious activity detected",
    "expiresAt": "2025-12-31T23:59:59.000Z"
  }' \
  "http://localhost:5000/api/admin/security/blacklist"
```

**Blacklist Reasons:**
- `multiple_failed_logins` - Multiple failed login attempts
- `suspicious_activity` - Suspicious activity
- `manual_block` - Manual block by admin
- `automated_threat_detection` - Automated threat detection
- `spam` - Spam activity
- `ddos_attack` - DDoS attack
- `brute_force` - Brute force attack

**Remove IP from Blacklist:**
```bash
curl -X DELETE \
  -H "Authorization: Bearer <admin-token>" \
  "http://localhost:5000/api/admin/security/blacklist/<blacklist-id>"
```

### 5. Security Dashboard Overview
Comprehensive security overview with statistics and trends.

**Endpoint:** `GET /api/admin/security/dashboard`

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "failedLogins24h": 45,
      "alertsBySeverity": {
        "critical": 2,
        "high": 5,
        "medium": 12,
        "low": 8
      },
      "topTargetedIPs": [...],
      "activeBlacklists": 15
    },
    "recentActivities": [...],
    "openAlerts": {...},
    "loginTrends": [...]
  }
}
```

### 6. Activity Statistics
Detailed activity statistics for different time periods.

**Endpoint:** `GET /api/admin/security/activity/stats?period=24h`

**Period Options:**
- `1h` - Last hour
- `24h` - Last 24 hours
- `7d` - Last 7 days
- `30d` - Last 30 days

**Response:**
```json
{
  "success": true,
  "data": {
    "period": "24h",
    "activityByType": [...],
    "activityByStatus": [...],
    "mostActiveUsers": [...],
    "mostActiveIPs": [...]
  }
}
```

## Automatic Features

### Auto-Blacklisting
- System automatically blacklists IPs after 10 failed login attempts within 1 hour
- Auto-blacklist expires after 24 hours
- Creates security alert with severity "high"

### Security Alert Generation
- Automatically creates alerts after 5 failed login attempts
- Alert severity increases based on number of attempts:
  - 5-9 attempts: medium severity
  - 10+ attempts: high severity

### Activity Logging
- All login attempts (successful and failed) are automatically logged
- IP address and user agent are captured for all activities
- Activity logs are automatically deleted after 90 days (TTL)
- Failed login attempts are deleted after 30 days (TTL)

## Data Retention

- **Activity Logs**: Automatically deleted after 90 days
- **Failed Login Attempts**: Automatically deleted after 30 days
- **Security Alerts**: Kept indefinitely (manual cleanup required)
- **IP Blacklist**: Can have optional expiration dates

## Integration with Existing Auth

The failed login tracking is automatically integrated with the existing authentication system:

1. Every failed login attempt is tracked
2. IP address and user agent are captured
3. Security alerts are created for suspicious patterns
4. Auto-blacklisting prevents brute force attacks

## IP Blacklist Middleware

The IP blacklist checking middleware is applied globally to all routes:

```javascript
// In server.js
app.use(checkIPBlacklist);
```

This ensures that blacklisted IPs are blocked from accessing any part of the application.

## MongoDB Indexes

The implementation includes optimized indexes for efficient queries:

- Activity logs indexed by user, email, IP, actionType, status, and timestamp
- Failed login attempts indexed by email, IP, and timestamp
- Security alerts indexed by type, severity, status, and IP
- IP blacklist indexed by IP address and active status

## Testing

Run the security tests:
```bash
cd backend
npm test -- __tests__/integration/adminSecurity.test.js
npm test -- __tests__/integration/failedLoginTracking.test.js
```

## Security Best Practices

1. **Monitor the dashboard regularly** for critical alerts
2. **Review failed login attempts** for potential threats
3. **Maintain the IP blacklist** by removing expired or false positive entries
4. **Investigate high-severity alerts** immediately
5. **Use expiration dates** for IP blacklist entries when appropriate
6. **Review activity logs** for unusual patterns

## API Authentication

All security endpoints require:
- Valid JWT token in Authorization header
- Admin role (`role: 'admin'`)

Example:
```bash
Authorization: Bearer <your-admin-jwt-token>
```
