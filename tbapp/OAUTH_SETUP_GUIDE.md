# Social OAuth Login Implementation Guide

This document explains the OAuth login implementation for Google, Facebook, and Twitter on Travel Buddy.

## Overview

The application now supports social login using OAuth 2.0 for:
- **Google**: Industry-standard OAuth 2.0
- **Facebook**: Facebook Login OAuth
- **Twitter (X)**: Twitter API v2 OAuth 2.0

Users can click the social icons on the login page to authenticate via their preferred provider. New users are automatically registered, while existing users are logged in.

## Architecture

### Components

1. **`oauth_service.py`** - OAuth service module
   - Initializes OAuth clients for all providers
   - Parses OAuth provider responses
   - Standardizes user data format

2. **`auth/routes.py`** - Authentication routes
   - `/auth/oauth/<provider>` - Authorization redirect
   - `/auth/oauth/callback/<provider>` - OAuth callback handler

3. **Database Integration**
   - User data stored in MongoDB (primary authentication store)
   - SQL User model stores shell records for relationships
   - OAuth provider IDs stored for future reference

4. **Login Template**
   - Social buttons converted to links
   - Points to OAuth authorization endpoints

## Setup Instructions

### 1. Google OAuth Setup

1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Enable Google+ API:
   - Go to APIs & Services > Library
   - Search for "Google+ API"
   - Click "Enable"
4. Create OAuth credentials:
   - Go to APIs & Services > Credentials
   - Click "Create Credentials" > "OAuth client ID"
   - Choose "Web application"
   - Add authorized URLs:
     - JavaScript origins: `http://localhost:5000`
     - Redirect URIs: `http://localhost:5000/auth/oauth/callback/google`
5. Copy Client ID and Client Secret
6. Add to `.env`:
   ```
   GOOGLE_OAUTH_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GOOGLE_OAUTH_CLIENT_SECRET=your-client-secret
   ```

### 2. Facebook OAuth Setup

1. Visit [Facebook Developers](https://developers.facebook.com/)
2. Create a new app:
   - Click "My Apps" > "Create App"
   - Choose "Consumer" type
   - Fill in app details
3. Add Facebook Login product:
   - Go to Products > Add Product
   - Search "Facebook Login" and add it
4. Configure OAuth settings:
   - Go to Settings > Basic (copy App ID and App Secret)
   - Go to Facebook Login > Settings
   - Add "Valid OAuth Redirect URIs":
     - `http://localhost:5000/auth/oauth/callback/facebook`
5. Add to `.env`:
   ```
   FACEBOOK_OAUTH_CLIENT_ID=your-app-id
   FACEBOOK_OAUTH_CLIENT_SECRET=your-app-secret
   ```

### 3. Twitter OAuth 2.0 Setup

1. Visit [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Create a standalone app (or use existing)
3. Go to "App Settings"
4. Enable OAuth 2.0:
   - Go to "Authentication settings"
   - Enable "OAuth 2.0"
5. Configure OAuth settings:
   - App type: Choose appropriate type
   - Set "OAuth 2.0 Redirect URLs":
     - `http://localhost:5000/auth/oauth/callback/twitter`
   - Request email address from users: **Enabled** (optional but recommended)
6. Copy Client ID and Client Secret
7. Add to `.env`:
   ```
   TWITTER_OAUTH_CLIENT_ID=your-client-id
   TWITTER_OAUTH_CLIENT_SECRET=your-client-secret
   ```

## Environment Variables

Create a `.env` file in the project root with:

```bash
# OAuth Credentials
GOOGLE_OAUTH_CLIENT_ID=your-google-client-id
GOOGLE_OAUTH_CLIENT_SECRET=your-google-client-secret

FACEBOOK_OAUTH_CLIENT_ID=your-facebook-app-id
FACEBOOK_OAUTH_CLIENT_SECRET=your-facebook-app-secret

TWITTER_OAUTH_CLIENT_ID=your-twitter-client-id
TWITTER_OAUTH_CLIENT_SECRET=your-twitter-client-secret

# Other configuration
SECRET_KEY=your-secret-key
DATABASE_URL=sqlite:///app.db
MONGODB_URI=mongodb://localhost:27017/
```

## How It Works

### Authentication Flow

1. **User Clicks Social Button**
   - User clicks Google, Facebook, or Twitter icon on login page
   - Redirected to `/auth/oauth/<provider>`

2. **Authorization Request**
   - App redirects user to OAuth provider
   - User logs in with their provider credentials
   - User grants permissions to Travel Buddy

3. **Callback Handling**
   - Provider redirects back to `/auth/oauth/callback/<provider>`
   - App exchanges authorization code for access token
   - App fetches user profile data from provider

4. **User Management**
   - **Existing User**: Logged in directly
   - **New User**: Account created automatically with:
     - Email (or generated for Twitter)
     - Name from profile
     - Profile picture
     - OAuth provider ID stored for future reference

5. **Session Creation**
   - User logged in via Flask-Login
   - Session established
   - Redirected to dashboard

### Data Storage

**MongoDB (Primary Store)**
```javascript
{
  _id: ObjectId(...),
  email: "user@example.com",
  name: "John Doe",
  password: "STORED_IN_MONGODB",
  profile_picture: "https://...",
  oauth_provider: "google",
  google_id: "123456789...",           // OAuth provider ID
  facebook_id: "987654321...",
  twitter_id: "456789...",
  is_verified: true,
  profile_complete: false,
  created_at: ISODate(...),
  last_login: ISODate(...),
  updated_at: ISODate(...)
}
```

**SQL Database (Compatibility Store)**
```python
User(
  id=1,
  email="user@example.com",
  name="John Doe",
  password="STORED_IN_MONGODB",      # Placeholder
  profile_picture="https://...",
  is_verified=True,
  profile_complete=False,
  created_at=datetime(...),
  last_login=datetime(...)
)
```

## Security Features

1. **Environment Variables**
   - All OAuth credentials stored in `.env` (never in code)
   - Config loaded from `os.environ.get()`

2. **Token Handling**
   - OAuth tokens not stored in database (ephemeral)
   - Used immediately for user data retrieval
   - Discarded after initial login

3. **Session Management**
   - Flask-Login with secure session cookies
   - HTTPOnly cookies prevent XSS attacks
   - SameSite='Lax' prevents CSRF

4. **Error Handling**
   - Invalid provider validation
   - Graceful OAuth failure handling
   - User-friendly error messages

5. **Production Deployment**
   - Update redirect URLs in OAuth providers to HTTPS
   - Use HTTPS in production (set `SESSION_COOKIE_SECURE=True`)
   - Use strong `SECRET_KEY` in production

## Troubleshooting

### OAuth not configured error
- Ensure `.env` file exists with OAuth credentials
- Restart Flask app to load new environment variables
- Verify credentials are correct in provider dashboards

### Redirect URI mismatch error
- Check exact redirect URI in provider settings
- Must match: `http://localhost:5000/auth/oauth/callback/<provider>`
- In production, use HTTPS URLs

### Email not received from provider (Twitter)
- Twitter doesn't provide email via standard scopes
- App generates pseudo-email: `twitter_<user_id>@travel-buddy.local`
- Users can update email from profile settings later

### New user not being created
- Check MongoDB connection
- Check database permissions
- Review console logs for specific error messages

### Session not persisting
- Verify `SECRET_KEY` is set in `.env`
- Check `SESSION_COOKIE_HTTPONLY` and `SESSION_COOKIE_SAMESITE` settings
- Ensure MongoDB connection is working

## Production Deployment

### 1. Update `.env` with production values
```bash
SECRET_KEY=<generate-using-secrets-module>
GOOGLE_OAUTH_CLIENT_ID=<production-id>
GOOGLE_OAUTH_CLIENT_SECRET=<production-secret>
FACEBOOK_OAUTH_CLIENT_ID=<production-id>
FACEBOOK_OAUTH_CLIENT_SECRET=<production-secret>
TWITTER_OAUTH_CLIENT_ID=<production-id>
TWITTER_OAUTH_CLIENT_SECRET=<production-secret>
```

### 2. Update OAuth provider settings
- Change redirect URLs from `http://localhost:5000` to `https://yourdomain.com`
- Update all provider dashboards with production URLs

### 3. Update config settings
- Set `SESSION_COOKIE_SECURE=True` (requires HTTPS)
- Use environment-specific configuration
- Enable HTTPS/SSL certificate

### 4. Database backup
- Regular MongoDB backups
- Regular SQL database backups
- Test restore procedures

## API Rate Limiting

OAuth providers have rate limits:
- **Google**: 100 requests/second per user
- **Facebook**: Depends on app tier
- **Twitter**: Various limits per endpoint

Monitor rate limit headers in responses. If exceeded, users will see authentication errors.

## Extending for More Providers

To add more OAuth providers (e.g., GitHub, LinkedIn):

1. Register app in provider dashboard
2. Add to `oauth_service.py`:
   ```python
   oauth.register(
       name='provider_name',
       client_id=app.config.get('PROVIDER_OAUTH_CLIENT_ID'),
       client_secret=app.config.get('PROVIDER_OAUTH_CLIENT_SECRET'),
       # ... provider-specific config
   )
   ```
3. Add to `parse_oauth_user_data`:
   ```python
   elif provider == 'provider_name':
       # Parse provider-specific user data
   ```
4. Add to config `config.py`
5. Add to `.env` file
6. Update login template with new icon

## Integration with Existing System

- **Email/Password Login**: Still fully functional
- **User Relations**: Works with SQL relationships through User model
- **Chat System**: Uses both SQL and MongoDB seamlessly
- **Profile System**: OAuth users can update profiles from dashboard
- **Session Management**: Unified across all authentication methods

## Testing

### Test Email/Password Login
1. Create account with email and password
2. Login with credentials
3. Verify redirect to dashboard

### Test Google OAuth
1. Click Google icon
2. Enter Google credentials
3. Grant permissions
4. Verify login and user creation

### Test Facebook OAuth
1. Click Facebook icon
2. Enter Facebook credentials
3. Grant permissions
4. Verify login and user creation

### Test Twitter OAuth
1. Click Twitter icon
2. Enter Twitter credentials
3. Grant permissions
4. Verify login and user creation

### Test Existing User OAuth
1. Login with OAuth (creates account)
2. Logout
3. Login again with same OAuth provider
4. Verify existing account is used (no duplicate)

## Support

For issues or questions:
1. Check console logs: `[ERROR]`, `[WARNING]`, `[INFO]` messages
2. Verify OAuth credentials in provider dashboards
3. Check Flask debug output for stack traces
4. Review this documentation

## License

This OAuth implementation is part of Travel Buddy and follows the same license.
