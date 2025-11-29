# Vercel Environment Variables Guide

## Required Environment Variables

These are **essential** for the application to function:

### Database
```
DATABASE_URL=postgresql://user:password@host:port/database
```
- **Required**: Yes
- **Description**: PostgreSQL connection string
- **How to get**: Create a Vercel Postgres database in your Vercel dashboard, or use Supabase/other PostgreSQL provider
- **Note**: Vercel Postgres automatically adds this when you create a database

### Authentication (NextAuth)
```
NEXTAUTH_SECRET=your-random-secret-here
NEXTAUTH_URL=https://your-app.vercel.app
```
- **Required**: Yes
- **Description**: 
  - `NEXTAUTH_SECRET`: Random secret for encrypting JWT tokens (generate with `openssl rand -base64 32`)
  - `NEXTAUTH_URL`: Your production URL (must match your Vercel deployment URL)
- **Note**: For local development, use `http://localhost:3000`

### AI Models - OpenAI (Required)
```
OPENAI_API_KEY=sk-your-openai-api-key-here
```
- **Required**: Yes (at minimum for GPT models)
- **Description**: OpenAI API key for GPT models
- **How to get**: https://platform.openai.com/api-keys

---

## Optional Environment Variables

### AI Models - Additional Providers

#### Anthropic (Claude)
```
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key-here
```
- **Required**: No (only if you want Claude 3.7 support)
- **Description**: Anthropic API key for Claude models
- **How to get**: https://console.anthropic.com/

#### Google AI (Gemini)
```
GOOGLE_AI_API_KEY=your-google-ai-api-key-here
```
- **Required**: No (only if you want Gemini 2.0 support)
- **Description**: Google AI API key for Gemini models
- **How to get**: https://aistudio.google.com/app/apikey

### OAuth Providers (Optional)

#### Google OAuth
```
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
```
- **Required**: No (only if you want Google sign-in)
- **Description**: Google OAuth credentials
- **How to get**: 
  1. Go to [Google Cloud Console](https://console.cloud.google.com)
  2. Create OAuth 2.0 credentials
  3. Add authorized redirect URI: `https://your-app.vercel.app/api/auth/callback/google`

#### GitHub OAuth
```
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```
- **Required**: No (only if you want GitHub sign-in)
- **Description**: GitHub OAuth credentials
- **How to get**:
  1. Go to GitHub Settings → Developer settings → OAuth Apps
  2. Create new OAuth App
  3. Set Authorization callback URL: `https://your-app.vercel.app/api/auth/callback/github`

### Rate Limiting (Recommended)

```
UPSTASH_REDIS_REST_URL=https://your-redis-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-upstash-token
```
- **Required**: No (app will work without it, but rate limiting won't function)
- **Description**: Upstash Redis credentials for rate limiting
- **How to get**:
  1. Go to [Upstash Console](https://console.upstash.com)
  2. Create a new Redis database
  3. Copy the REST URL and token
- **Note**: Without this, the app uses a no-op rate limiter (allows all requests)

### Development/Testing

```
NODE_ENV=production
ANALYZE=false
```
- **Required**: No (automatically set by Vercel)
- **Description**: 
  - `NODE_ENV`: Set to `production` automatically on Vercel
  - `ANALYZE`: Set to `true` to enable bundle analysis during build

---

## Quick Setup Checklist for Vercel

### Step 1: Required Variables
- [ ] `DATABASE_URL` (auto-added if using Vercel Postgres)
- [ ] `NEXTAUTH_SECRET` (generate with: `openssl rand -base64 32`)
- [ ] `NEXTAUTH_URL` (your Vercel app URL)
- [ ] `OPENAI_API_KEY` (minimum required for basic functionality)

### Step 2: Optional but Recommended
- [ ] `UPSTASH_REDIS_REST_URL` (for rate limiting)
- [ ] `UPSTASH_REDIS_REST_TOKEN` (for rate limiting)

### Step 3: Additional AI Models (Optional)
- [ ] `ANTHROPIC_API_KEY` (for Claude)
- [ ] `GOOGLE_AI_API_KEY` (for Gemini)

### Step 4: OAuth (Optional)
- [ ] `GOOGLE_CLIENT_ID` (for Google sign-in)
- [ ] `GOOGLE_CLIENT_SECRET` (for Google sign-in)
- [ ] `GITHUB_CLIENT_ID` (for GitHub sign-in)
- [ ] `GITHUB_CLIENT_SECRET` (for GitHub sign-in)

---

## How to Add Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Click **Add New**
4. Enter the variable name and value
5. Select the environments (Production, Preview, Development)
6. Click **Save**
7. Redeploy your application for changes to take effect

---

## Security Best Practices

1. **Never commit** `.env` files to git
2. **Use different secrets** for production and development
3. **Rotate secrets** periodically
4. **Use Vercel's built-in secret management** (don't hardcode)
5. **Limit API key permissions** when possible
6. **Monitor API usage** to detect unauthorized access

---

## Testing Your Environment Variables

After deployment, verify your environment variables are set correctly:

1. Check Vercel function logs for any missing variable errors
2. Test authentication (sign up/sign in)
3. Test AI model functionality (try different models)
4. Check rate limiting is working (if Upstash is configured)

---

## Troubleshooting

### "Missing environment variable" errors
- Verify all required variables are set in Vercel dashboard
- Ensure variable names match exactly (case-sensitive)
- Redeploy after adding new variables

### Authentication not working
- Verify `NEXTAUTH_SECRET` is set and matches between environments
- Check `NEXTAUTH_URL` matches your actual deployment URL
- Verify OAuth redirect URLs are correct

### AI models not working
- Verify API keys are valid and have sufficient credits
- Check API provider status pages
- Review Vercel function logs for specific errors

### Database connection errors
- Verify `DATABASE_URL` is correct
- Check if database allows connections from Vercel IPs
- Ensure database migrations have run

