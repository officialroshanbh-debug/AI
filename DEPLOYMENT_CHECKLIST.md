# 🚀 Quick Deployment Checklist for Vercel

Use this checklist before and after deploying to Vercel.

## Pre-Deployment Checklist

### 1. Environment Variables ✓
Make sure all these are set in Vercel Dashboard (Settings → Environment Variables):

```bash
# Required - Database
□ DATABASE_URL

# Required - Authentication
□ AUTH_SECRET (or NEXTAUTH_SECRET)
□ NEXTAUTH_URL (set to your Vercel URL)

# Required - AI API Keys  
□ OPENAI_API_KEY (for GPT models)
□ GOOGLE_AI_API_KEY (for Gemini models)

# Required - Rate Limiting
□ UPSTASH_REDIS_REST_URL
□ UPSTASH_REDIS_REST_TOKEN

# Required - Google OAuth
□ GOOGLE_CLIENT_ID
□ GOOGLE_CLIENT_SECRET

# Optional
□ ANTHROPIC_API_KEY (if using Claude)
□ BLOB_READ_WRITE_TOKEN (if using file uploads)
```

### 2. Google OAuth Configuration ✓
- [ ] Created OAuth 2.0 credentials in Google Cloud Console
- [ ] Added redirect URI: `https://your-app.vercel.app/api/auth/callback/google`
- [ ] Verified Client ID and Secret are correct
- [ ] OAuth consent screen is published (not in testing mode)

### 3. Database Setup ✓
- [ ] PostgreSQL database is created (Vercel Postgres, Supabase, or Neon)
- [ ] `DATABASE_URL` is added to Vercel
- [ ] Can connect to database from local machine

### 4. Code Ready ✓
- [ ] All changes committed to Git
- [ ] GitHub repository is up to date
- [ ] No `.env` file in the repo (only `.env.example`)

---

## Deploy to Vercel

```bash
# Commit and push
git add .
git commit -m "fix: Deployment fixes for auth and API integration"
git push origin main
```

Vercel will auto-deploy. Wait 2-3 minutes.

---

## Post-Deployment Checklist

### 1. Verify Build Success ✓
- [ ] Go to Vercel Dashboard → Deployments
- [ ] Latest deployment shows "Ready"
- [ ] No errors in build logs

### 2. Test Authentication ✓

**Test Sign Up (Email/Password):**
- [ ] Visit `https://your-app.vercel.app/auth/signup`
- [ ] Fill in name, email, password
- [ ] Click "Sign Up"
- [ ] Should redirect to `/chat`

**Test Sign In (Email/Password):**
- [ ] Visit `https://your-app.vercel.app/auth/signin`
- [ ] Enter email and password
- [ ] Click "Sign In"
- [ ] Should redirect to `/chat`

**Test Google OAuth:**
- [ ] Visit `https://your-app.vercel.app/auth/signup`
- [ ] Click "Continue with Google"
- [ ] Select Google account
- [ ] Should redirect to `/chat`

### 3. Test Dashboard & AI Chat ✓

**Select Model:**
- [ ] Can see model selector in header
- [ ] Can select different models (GPT-4, Gemini, Claude, Himalaya)

**Send Messages:**
- [ ] Can type a message
- [ ] Click send or press Enter
- [ ] Receives streaming response from AI
- [ ] Response renders with proper formatting
- [ ] Code blocks have syntax highlighting

**Test Different Models:**
- [ ] Select GPT-4 → Send message → Get response
- [ ] Select Gemini 2.0 → Send message → Get response
- [ ] Select Claude (if enabled) → Send message → Get response

### 4. Check Function Logs ✓
- [ ] Go to Vercel Dashboard → Deployments → Latest → "View Function Logs"
- [ ] No critical errors showing
- [ ] Auth logs show successful sign-ins
- [ ] Chat API logs show successful responses

### 5. Test Session Persistence ✓
- [ ] Sign in
- [ ] Refresh page
- [ ] Still signed in (session persists )
- [ ] Sign out
- [ ] Redirected to home page

---

## Common Issues & Quick Fixes

### Issue: Build fails with "Prisma Client not generated"
**Fix:** Already handled in `package.json`:
```json
"postinstall": "prisma generate",
"build": "prisma generate && prisma migrate deploy && next build"
```

### Issue: "Unauthorized" error in /chat
**Fix:**
1. Check `AUTH_SECRET` is set in Vercel
2. Clear browser cookies
3. Sign in again

### Issue: Google sign-in redirects but doesn't work
**Fix:**
1. Verify redirect URI in Google Console matches exactly: `https://your-app.vercel.app/api/auth/callback/google`
2. Check `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct
3. Ensure OAuth app is published (not in testing)

### Issue: AI responses return errors
**Fix:**
1. Check API key for the selected model is set
2. Verify API key has credits/quota
3. Check function logs for specific error
4. Test API key directly in the provider's playground

### Issue: "Rate limit exceeded" immediately
**Fix:**
1. Verify Upstash credentials are correct
2. Check Upstash dashboard - database should be "Active"
3. Try creating a new Upstash database

---

## Performance Checks

After deployment:
- [ ] Homepage loads in < 2 seconds
- [ ] Chat page loads in < 2 seconds  
- [ ] AI responses start streaming in < 3 seconds
- [ ] No console errors in browser DevTools
- [ ] Mobile responsive (test on phone)

---

## Security Checks

- [ ] Environment variables are NOT visible in source code
- [ ] API keys are NOT in Git history
- [ ] HTTPS is enforced (Vercel does this automatically)
- [ ] Rate limiting is working
- [ ] Sign out properly clears session

---

## Monitoring Setup (Optional but Recommended)

- [ ] Set up billing alerts on OpenAI
- [ ] Set up quota alerts on Google AI Studio
- [ ] Monitor Vercel analytics
- [ ] Check Upstash usage dashboard
- [ ] Set up error tracking (Sentry, LogRocket, etc.)

---

## 🎉 Deployment Complete!

If all checks pass, your app is live and working correctly!

**Your app URL:** `https://your-app.vercel.app`

Share with users and enjoy! 🚀

---

## Need Help?

1. Check `VERCEL_RUNTIME_FIXES.md` for detailed troubleshooting
2. Review Vercel function logs
3. Check browser console for client-side errors
4. Test locally with `npm run dev` first

Last updated: 2025-11-29
