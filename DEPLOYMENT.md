# 🚀 Vercel Deployment Guide

## Prerequisites

- Vercel account (free tier works)
- GitHub account
- Database (Vercel Postgres, Supabase, or Neon)
- API keys for AI models

---

## 🔧 Setup Steps

### 1. Prepare Your Database

#### Option A: Vercel Postgres (Recommended)

1. Go to your Vercel dashboard
2. Navigate to **Storage** tab
3. Click **Create Database** → Select **Postgres**
4. Vercel automatically adds `DATABASE_URL` to your environment variables

#### Option B: Supabase

1. Go to [Supabase](https://supabase.com)
2. Create new project
3. Go to **Settings** → **Database**
4. Copy **Connection String** (choose "Direct connection" or "Session pooler")
5. Format: `postgresql://postgres:[YOUR-PASSWORD]@[HOST]:5432/postgres`

#### Option C: Neon

1. Go to [Neon](https://neon.tech)
2. Create new project
3. Copy connection string from dashboard

---

### 2. Setup Environment Variables in Vercel

1. Go to your project in Vercel Dashboard
2. Click **Settings** → **Environment Variables**
3. Add the following (one by one):

```bash
# Database (REQUIRED)
DATABASE_URL=postgresql://...

# NextAuth (REQUIRED)
NEXTAUTH_SECRET=your-32-character-secret
NEXTAUTH_URL=https://your-project.vercel.app

# AI Models (REQUIRED)
OPENAI_API_KEY=sk-proj-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_AI_API_KEY=AIza...

# Rate Limiting (REQUIRED)
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# OAuth (OPTIONAL)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

**Important:** Set environment for **Production**, **Preview**, AND **Development**

---

### 3. Generate NEXTAUTH_SECRET

Run one of these commands:

**Mac/Linux:**
```bash
openssl rand -base64 32
```

**Windows PowerShell:**
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

**Online:**
Visit https://generate-secret.vercel.app/32

---

### 4. Setup Upstash Redis (Rate Limiting)

1. Go to [Upstash](https://upstash.com) (free tier available)
2. Create new Redis database
3. Copy **REST URL** and **REST TOKEN**
4. Add to Vercel environment variables

---

### 5. Deploy to Vercel

#### Method 1: GitHub Integration (Recommended)

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com)
3. Click **Add New...** → **Project**
4. Import your GitHub repository
5. Vercel will auto-detect Next.js
6. Click **Deploy**

#### Method 2: Vercel CLI

```bash
npm install -g vercel
vercel login
vercel
```

---

### 6. Run Database Migrations

**⚠️ IMPORTANT:** After first deployment, you need to run migrations.

#### Option A: Using Vercel CLI (Recommended)

```bash
# Install Vercel CLI if not already installed
npm install -g vercel

# Login
vercel login

# Link to your project
vercel link

# Run migration
vercel env pull .env.production
npx prisma migrate deploy
```

#### Option B: From Local Machine

1. Copy your production `DATABASE_URL` from Vercel
2. Create `.env.production` file:
   ```bash
   DATABASE_URL="your-production-database-url"
   ```
3. Run migration:
   ```bash
   npx prisma migrate deploy --schema=./prisma/schema.prisma
   ```

#### Option C: Using Prisma Data Platform

1. Go to [Prisma Data Platform](https://cloud.prisma.io)
2. Connect your database
3. Run migrations from the dashboard

---

### 7. Verify Deployment

1. Visit your Vercel URL
2. Check homepage loads correctly
3. Try signing up/logging in
4. Test chat with different AI models
5. Check Vercel logs if any errors:
   - Dashboard → Project → Logs

---

## 🐛 Troubleshooting Common Issues

### Issue 1: "Prisma Client not generated"

**Solution:** This is fixed in the updated `package.json` with `postinstall` script.

### Issue 2: "Database does not exist" or Migration Errors

**Solution:**
```bash
# Pull production env
vercel env pull .env.production

# Generate Prisma Client
npx prisma generate

# Push schema (for development)
npx prisma db push

# OR deploy migrations (for production)
npx prisma migrate deploy
```

### Issue 3: "Environment variable not found"

**Solution:**
1. Go to Vercel Dashboard → Settings → Environment Variables
2. Make sure ALL variables are set for:
   - ✅ Production
   - ✅ Preview
   - ✅ Development
3. Redeploy after adding variables

### Issue 4: "Build failed with exit code 1"

**Check Vercel build logs for:**
- Missing dependencies → Run `npm install` locally
- TypeScript errors → Run `npm run type-check`
- ESLint errors → Run `npm run lint:fix`

### Issue 5: "Function execution timeout"

**Solution:** Upgrade to Vercel Pro for longer function execution or optimize your API routes.

### Issue 6: Rate Limit / Redis Connection Failed

**Solution:**
1. Verify `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are correct
2. Check Upstash dashboard for database status
3. Ensure you're using REST API endpoints (not regular Redis URLs)

---

## 🔄 Updating Your Deployment

### For Code Changes

Just push to your `main` branch:
```bash
git add .
git commit -m "your changes"
git push origin main
```

Vercel automatically redeploys!

### For Database Schema Changes

1. Update `prisma/schema.prisma`
2. Create migration locally:
   ```bash
   npx prisma migrate dev --name your_migration_name
   ```
3. Push changes to GitHub
4. After Vercel deploys, run:
   ```bash
   vercel env pull .env.production
   npx prisma migrate deploy
   ```

---

## 📊 Monitoring

### Vercel Dashboard

- **Analytics**: Monitor traffic and performance
- **Logs**: Real-time function logs
- **Domains**: Custom domain setup
- **Usage**: Check bandwidth and function invocations

### Database Monitoring

- **Vercel Postgres**: Built-in dashboard
- **Supabase**: Database usage stats
- **Neon**: Query performance insights

---

## 🔐 Security Best Practices

1. ✅ Never commit `.env` files
2. ✅ Rotate API keys regularly
3. ✅ Use strong `NEXTAUTH_SECRET`
4. ✅ Enable Vercel's automatic HTTPS
5. ✅ Set up rate limiting (already implemented)
6. ✅ Use environment-specific configs

---

## 🆘 Getting Help

- **Vercel Docs**: https://vercel.com/docs
- **Prisma Docs**: https://www.prisma.io/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Project Issues**: https://github.com/officialroshanbh-debug/AI/issues

---

## ✅ Post-Deployment Checklist

- [ ] All environment variables set in Vercel
- [ ] Database created and connected
- [ ] Prisma migrations deployed
- [ ] Homepage loads successfully
- [ ] User authentication works
- [ ] Chat functionality works with all models
- [ ] No errors in Vercel logs
- [ ] Custom domain configured (optional)
- [ ] Analytics enabled

---

**Need help?** Open an issue on GitHub or check Vercel deployment logs.
