# Deployment Guide

This guide will help you deploy the AI Platform to Vercel.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Account**: For connecting your repository
3. **Database**: Vercel Postgres or Supabase PostgreSQL
4. **API Keys**: 
   - OpenAI API key
   - Anthropic API key (optional, for Claude)
   - Google AI API key (optional, for Gemini)
5. **Upstash Redis**: For rate limiting (optional but recommended)

## Step-by-Step Deployment

### 1. Prepare Your Repository

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

### 2. Set Up Vercel Postgres

1. Go to your Vercel dashboard
2. Navigate to Storage → Create Database → Postgres
3. Create a new database
4. Copy the connection string (it will be automatically added as `DATABASE_URL`)

### 3. Set Up Upstash Redis (Optional)

1. Go to [Upstash Console](https://console.upstash.com)
2. Create a new Redis database
3. Copy the REST URL and token
4. Add them to your Vercel environment variables

### 4. Deploy to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./`
   - **Build Command**: `npm run build` (or `prisma generate && next build`)
   - **Output Directory**: `.next`

### 5. Environment Variables

Add the following environment variables in Vercel:

#### Required
```
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=your-random-secret-here
NEXTAUTH_URL=https://your-app.vercel.app
OPENAI_API_KEY=sk-...
```

#### Optional (for OAuth)
```
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
```

#### Optional (for additional models)
```
ANTHROPIC_API_KEY=...
GOOGLE_AI_API_KEY=...
```

#### Optional (for rate limiting)
```
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```

#### Optional (for embeddings)
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

### 6. Run Database Migrations

After deployment, run migrations:

```bash
# Using Vercel CLI
vercel env pull .env.local
npx prisma migrate deploy

# Or using Vercel dashboard
# Go to your project → Settings → Environment Variables
# Then use Vercel's built-in database tools
```

Alternatively, you can add a build script:

```json
{
  "scripts": {
    "vercel-build": "prisma generate && prisma migrate deploy && next build"
  }
}
```

### 7. Verify Deployment

1. Visit your deployed URL
2. Test sign up/sign in
3. Test chat functionality
4. Check logs in Vercel dashboard for any errors

## Post-Deployment

### Set Up OAuth Providers

#### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create OAuth 2.0 credentials
3. Add authorized redirect URI: `https://your-app.vercel.app/api/auth/callback/google`
4. Copy Client ID and Secret to Vercel

#### GitHub OAuth
1. Go to GitHub Settings → Developer settings → OAuth Apps
2. Create new OAuth App
3. Set Authorization callback URL: `https://your-app.vercel.app/api/auth/callback/github`
4. Copy Client ID and Secret to Vercel

### Monitoring

- **Vercel Analytics**: Enable in project settings
- **Error Tracking**: Check Vercel logs
- **Database**: Monitor in Vercel dashboard or Supabase dashboard

### Scaling

The application is designed to scale automatically on Vercel:
- Serverless functions scale with traffic
- Edge functions for optimal performance
- Database connection pooling handled by Prisma

## Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` is correct
- Check if database allows connections from Vercel IPs
- Ensure migrations have run

### Authentication Issues
- Verify `NEXTAUTH_SECRET` is set
- Check `NEXTAUTH_URL` matches your domain
- Ensure OAuth redirect URLs are correct

### API Errors
- Check API keys are valid
- Verify rate limits aren't exceeded
- Check Vercel function logs

### Build Failures
- Ensure all dependencies are in `package.json`
- Check TypeScript errors: `npm run type-check`
- Verify Prisma schema is valid: `npx prisma validate`

## Production Checklist

- [ ] All environment variables set
- [ ] Database migrations run
- [ ] OAuth providers configured
- [ ] Rate limiting enabled
- [ ] Error monitoring set up
- [ ] Custom domain configured (optional)
- [ ] SSL certificate active (automatic on Vercel)

## Support

For issues:
1. Check Vercel function logs
2. Review database logs
3. Check API provider status
4. Open an issue on GitHub

