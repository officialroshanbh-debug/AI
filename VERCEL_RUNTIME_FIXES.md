# VERCEL DEPLOYMENT FIX - Runtime Issues Resolved

## 🔥 Issues Fixed

### 1. **GitHub OAuth Removed** ✅
- Removed GitHub provider from NextAuth configuration (`auth.ts`)
- Updated sign-in form to show only Google OAuth
- Updated sign-up form to show only Google OAuth
- Cleaned up environment variables

### 2. **Google OAuth Configuration Improved** ✅
- Added proper authorization params for Google OAuth
- Added `prompt: 'consent'` to force account chooser
- Added `access_type: 'offline'` for refresh tokens
- Added `response_type: 'code'` for proper authorization flow
- Type-safe environment variable handling

### 3. **NextAuth v5 Cookie Configuration Fixed** ✅
- Fixed cookie names for production environment
- Added `__Secure-` prefix for all cookies in production
- Updated PKCE code verifier cookie name
- Updated state cookie name
- Ensures proper session handling on Vercel

### 4. **Error Handling Improved** ✅
- Added error page redirect in auth config
- Better error logging in API routes
- Graceful handling of missing environment variables

## 🚀 What You Need to Do Next

### Step 1: Update Environment Variables on Vercel

Go to your Vercel project dashboard and ensure these environment variables are set:

**Required Variables:**
```bash
# Database
DATABASE_URL="your-postgres-connection-string"

# Auth
AUTH_SECRET="your-32-character-secret"  # or NEXTAUTH_SECRET
NEXTAUTH_URL="https://your-app.vercel.app"

# AI APIs
OPENAI_API_KEY="sk-proj-..."
GOOGLE_AI_API_KEY="AIza..."  # For Gemini
ANTHROPIC_API_KEY="sk-ant-..."  # For Claude (if using)

# Rate Limiting
UPSTASH_REDIS_REST_URL="https://...upstash.io"
UPSTASH_REDIS_REST_TOKEN="AXXXx..."

# Google OAuth (IMPORTANT - Set these!)
GOOGLE_CLIENT_ID="xxxxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-xxxxx"
```

**⚠️ CRITICAL:** Make sure `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set on Vercel!

### Step 2: Configure Google OAuth Properly

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project or create a new one
3. Go to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure:
   - **Application type:** Web application
   - **Authorized JavaScript origins:**
     - `http://localhost:3000` (for local dev)
     - `https://your-app.vercel.app` (your Vercel URL)
   - **Authorized redirect URIs:**
     - `http://localhost:3000/api/auth/callback/google`
     - `https://your-app.vercel.app/api/auth/callback/google`
6. Copy the Client ID and Client Secret
7. Add them to Vercel environment variables

### Step 3: Deploy to Vercel

```bash
# Commit your changes
git add .
git commit -m "fix: Remove GitHub OAuth, fix Google auth, improve Vercel deployment"
git push origin main
```

Vercel will automatically deploy. The build process will:
1. Run `prisma generate`
2. Run `prisma migrate deploy`
3. Build the Next.js app

### Step 4: Verify the Deployment

After deployment:

1. **Test Sign Up:**
   - Visit `https://your-app.vercel.app/auth/signup`
   - Try email/password signup
   - Try Google OAuth signup

2. **Test Sign In:**
   - Visit `https://your-app.vercel.app/auth/signin`
   - Try email/password sign-in
   - Try Google OAuth sign-in

3. **Test Dashboard:**
   - After signing in, should redirect to `/chat`
   - Should be able to select AI model (GPT-4, Gemini, etc.)
   - Should be able to send messages

4. **Check Logs:**
   - Go to Vercel Dashboard → Deployments → Latest → **View Function Logs**
   - Look for any errors

## 🔍 Common Runtime Issues & Solutions

### Issue: "Unauthorized" when accessing chat
**Solution:** 
- Make sure `AUTH_SECRET` is set on Vercel
- Check that cookies are enabled in browser
- Clear browser cookies and try again

### Issue: "Google sign-in fails"
**Solutions:**
1. Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set on Vercel
2. Check authorized redirect URIs in Google Console match exactly:
   - `https://your-app.vercel.app/api/auth/callback/google`
3. Make sure the Google project is not in "Testing" mode (should be "Published")

### Issue: "Database schema mismatch"
**Solution:**
```bash
# Pull environment variables from Vercel
vercel env pull .env.local

# Run migration
npx prisma migrate deploy

# Or push schema
npx prisma db push
```

### Issue: "Rate limit exceeded" immediately
**Solution:**
- Verify `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are correct
- Check Upstash dashboard to ensure database is active

### Issue: "AI responses not working"
**Solutions:**
1. Check that AI API keys are set correctly:
   - `OPENAI_API_KEY` for GPT models
   - `GOOGLE_AI_API_KEY` for Gemini models
   - `ANTHROPIC_API_KEY` for Claude models
2. Verify API keys have sufficient credits/quota
3. Check function logs for specific error messages

## 📝 Authentication Flow

Here's how the authentication now works:

1. **User visits site** → Redirected to home page `/`
2. **Clicks "Get Started"** → Redirected to `/auth/signup` or `/auth/signin`
3. **Signs up/in via:**
   - **Email/Password:** Creates account → Auto signs in → Redirects to `/chat`
   - **Google OAuth:** Redirects to Google → Returns to callback → Creates account → Redirects to `/chat`
4. **In Dashboard (`/chat`):**
   - User selects AI model (GPT-4, Gemini, Claude, etc.)
   - Sends messages
   - API calls go to `/api/chat`
   - Chat API validates session
   - Calls appropriate AI provider based on model selected
   - Streams response back to user

## 🎯 Testing Checklist

- [ ] Google OAuth sign-up works
- [ ] Google OAuth sign-in works
- [ ] Email/password sign-up works
- [ ] Email/password sign-in works
- [ ] After auth, redirects to `/chat`
- [ ] Can select AI model in chat
- [ ] Can send messages and get responses with GPT-4
- [ ] Can send messages and get responses with Gemini
- [ ] Session persists after page refresh
- [ ] Sign out works
- [ ] Rate limiting works (try many requests)

## 🔐 Security Notes

1. **Never commit `.env` file** - Only `.env.example`
2. **Rotate secrets regularly** - Especially `AUTH_SECRET`
3. **Use environment-specific keys** - Don't use production keys in development
4. **Monitor API usage** - Set up billing alerts on OpenAI, Google AI, etc.
5. **Review Vercel logs** - Check for any security issues

## 📚 Additional Resources

- [NextAuth.js v5 Documentation](https://next-auth.js.org/)
- [Vercel Deployment Docs](https://vercel.com/docs)
- [Prisma with Vercel](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)
- [Google OAuth Setup](https://support.google.com/cloud/answer/6158849)

---

## 💡 Need Help?

If you're still experiencing issues:

1. **Check Vercel Function Logs** - Most errors will show here
2. **Verify all environment variables** - Use the checklist above
3. **Test locally first** - Run `npm run dev` and test everything
4. **Review the error messages** - They usually point to the exact issue

Last updated: 2025-11-29
