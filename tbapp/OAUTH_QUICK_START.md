# OAuth Quick Start Guide

Get Travel Buddy OAuth social login up and running in 10 minutes!

## Step 1: Install Dependencies (1 minute)

```bash
cd App/app
pip install -r requirement.txt
```

Or if you want to install just the new packages:
```bash
pip install authlib==1.2.0 requests==2.31.0
```

## Step 2: Create .env File (1 minute)

```bash
# Copy the example
cp .env.example .env

# Edit .env and add your credentials (see Step 3)
# nano .env  (or use your preferred editor)
```

## Step 3: Get OAuth Credentials

### 🔵 Google OAuth (3 minutes)

1. Go to: https://console.cloud.google.com/
2. Create new project (if needed)
3. Enable Google+ API (search in APIs & Services > Library)
4. Go to APIs & Services > Credentials
5. Create OAuth client ID > Web application
6. Add these URLs:
   - Authorized JavaScript origins: `http://localhost:5000`
   - Authorized redirect URIs: `http://localhost:5000/auth/oauth/callback/google`
7. Copy Client ID and Secret
8. Add to .env:
   ```bash
   GOOGLE_OAUTH_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GOOGLE_OAUTH_CLIENT_SECRET=your-client-secret
   ```

### 🟦 Facebook OAuth (3 minutes)

1. Go to: https://developers.facebook.com/
2. Click My Apps > Create App
3. Choose "Consumer" as app type
4. In Dashboard, find App ID and toggle to show App Secret
5. Add Facebook Login product
6. Go to Facebook Login > Settings
7. Add this URL to "Valid OAuth Redirect URIs":
   ```
   http://localhost:5000/auth/oauth/callback/facebook
   ```
8. Add to .env:
   ```bash
   FACEBOOK_OAUTH_CLIENT_ID=your-app-id
   FACEBOOK_OAUTH_CLIENT_SECRET=your-app-secret
   ```

### 🐦 Twitter OAuth (3 minutes)

1. Go to: https://developer.twitter.com/en/portal/dashboard
2. Create standalone app (or use existing)
3. Go to App Settings > Authentication Settings
4. Enable OAuth 2.0
5. Add Redirect URI:
   ```
   http://localhost:5000/auth/oauth/callback/twitter
   ```
6. Copy Client ID and Client Secret
7. Add to .env:
   ```bash
   TWITTER_OAUTH_CLIENT_ID=your-client-id
   TWITTER_OAUTH_CLIENT_SECRET=your-client-secret
   ```

## Step 4: Start the App (2 minutes)

```bash
# Make sure you're in the App directory
cd App

# Run the Flask app
python app/run.py
```

You should see:
```
[OK] MongoDB connected successfully to travel_buddy_chat
[INFO] Server running on http://localhost:5000
```

## Step 5: Test OAuth (5 minutes)

1. Open http://localhost:5000/auth/login
2. Click the **Google**, **Facebook**, or **Twitter** icon
3. You'll be redirected to the provider's login
4. Log in with your credentials
5. Click "Allow" or "Authorize"
6. You'll be redirected back and logged in! ✅

## Troubleshooting

### "OAuth not configured" error
- Check your .env file exists
- Verify credentials are correct
- Restart Flask app to reload .env

### "Redirect URI mismatch" error
- Make sure redirect URI in provider dashboard matches exactly:
  - Google: `http://localhost:5000/auth/oauth/callback/google`
  - Facebook: `http://localhost:5000/auth/oauth/callback/facebook`
  - Twitter: `http://localhost:5000/auth/oauth/callback/twitter`

### OAuth button doesn't work
- Check browser console for errors (F12)
- Verify Flask app is running
- Check OAuth credentials are set in .env

### New account not created
- Check MongoDB is running
- Check Flask console for error messages
- Verify MongoDB URI in .env

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Invalid OAuth provider" | Check provider name is spelled correctly (google, facebook, twitter) |
| Login fails silently | Check .env file for missing credentials |
| Different user page appears | Clear browser cookies and try again |
| Profile picture not showing | Some providers require additional permissions |
| Email missing (Twitter) | Twitter generates pseudo-email; user can update in profile |

## Next Steps

### After OAuth Works

1. **Complete Your Profile**: Update profile picture, bio, travel preferences
2. **Find Travel Buddies**: Use the match feature
3. **Start Chatting**: Connect with travel companions
4. **Plan Trips**: Create and manage travel plans

### For Production

When ready to deploy:

1. Update provider OAuth settings to use `https://yourdomain.com` instead of `localhost`
2. Generate strong SECRET_KEY
3. Set `SESSION_COOKIE_SECURE=True` in config
4. Use HTTPS/SSL certificate
5. Test all OAuth providers on production domain

See [OAUTH_SETUP_GUIDE.md](OAUTH_SETUP_GUIDE.md) for detailed production deployment.

## What's Included

✅ Google OAuth 2.0 login
✅ Facebook OAuth login
✅ Twitter OAuth 2.0 login
✅ Automatic user creation
✅ Session management
✅ Error handling
✅ Email/password login (still works)

## Security

- OAuth credentials stored in .env (never hardcoded)
- Secure session cookies (HTTPOnly, SameSite)
- No token storage (ephemeral)
- Graceful error handling

## Support

Need help? Check the full documentation:
- [OAUTH_IMPLEMENTATION_SUMMARY.md](OAUTH_IMPLEMENTATION_SUMMARY.md) - Complete overview
- [OAUTH_SETUP_GUIDE.md](OAUTH_SETUP_GUIDE.md) - Detailed setup & troubleshooting

## Commands Reference

```bash
# Install dependencies
pip install -r App/app/requirement.txt

# Run the app
cd App
python app/run.py

# Test OAuth endpoints
curl http://localhost:5000/auth/oauth/google
```

---

**That's it! You're all set up.** 🎉

Visit http://localhost:5000/auth/login and try OAuth login!
