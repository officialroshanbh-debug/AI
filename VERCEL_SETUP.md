# 🚀 Vercel Deployment Setup Guide

## 📋 Quick Checklist

Before deploying, you need:
- [ ] GitHub account with this repo
- [ ] Vercel account (free)
- [ ] PostgreSQL database (Vercel Postgres / Supabase / Neon)
- [ ] OpenAI API key
- [ ] Anthropic API key
- [ ] Google AI API key
- [ ] Upstash Redis account (free tier)

---

## 🎯 Step-by-Step Setup

### Step 1: Set Up Database (Choose One)

#### Option A: Vercel Postgres (Easiest)

1. Go to [vercel.com](https://vercel.com) and sign in
2. Import your GitHub repo: `officialroshanbh-debug/AI`
3. After import, go to **Storage** tab
4. Click **Create Database** → **Postgres**
5. Choose **Hobby** (free) plan
6. Vercel automatically sets `DATABASE_URL` ✅

**Pros:** Easiest, auto-configured, free tier  
**Cons:** Limited to Vercel ecosystem

#### Option B: Supabase (Recommended)

1. Go to [supabase.com](https://supabase.com)
2. Click **Start your project** → Sign in with GitHub
3. Click **New project**
4. Fill in:
   - Name: `roshan-ai`
   - Database Password: (save this!)
   - Region: Choose closest to your users
5. Wait 2 minutes for setup
6. Go to **Settings** → **Database**
7. Under **Connection string** → **URI**, copy the connection string
8. Format: `postgresql://postgres.[project-ref]:[password]@[region].pooler.supabase.com:5432/postgres`

**Pros:** Better management, built-in auth, free tier, scalable  
**Cons:** Extra setup step

#### Option C: Neon (Serverless)

1. Go to [neon.tech](https://neon.tech)
2. Sign up with GitHub
3. Click **Create a project**
4. Name: `roshan-ai`
5. Copy the connection string
6. Format: `postgresql://[user]:[password]@[host]/[database]?sslmode=require`

**Pros:** Serverless, auto-scales, free tier  
**Cons:** Newer service

---

### Step 2: Generate NEXTAUTH_SECRET

**On Mac/Linux:**
```bash
openssl rand -base64 32
```

**On Windows PowerShell:**
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

**Online Generator:**
- Visit: https://generate-secret.vercel.app/32
- Copy the generated secret

**Save this secret** - you'll need it for `NEXTAUTH_SECRET`

---

### Step 3: Get AI API Keys

#### OpenAI (GPT-4, GPT-5)

1. Go to [platform.openai.com](https://platform.openai.com)
2. Sign in or create account
3. Click on your profile → **API keys**
4. Click **Create new secret key**
5. Name it: `Roshan AI Production`
6. **Copy the key immediately** (you won't see it again)
7. Format: `sk-proj-...`

**Cost:** Pay-as-you-go, starts at $0.01/1K tokens

#### Anthropic (Claude 3.7)

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Sign in with email
3. Go to **Settings** → **API Keys**
4. Click **Create Key**
5. Name: `Roshan AI`
6. Copy the key
7. Format: `sk-ant-...`

**Cost:** Pay-as-you-go, $3/$15 per million tokens

#### Google AI (Gemini 2.0)

1. Go to [aistudio.google.com](https://aistudio.google.com)
2. Sign in with Google account
3. Click **Get API Key**
4. Click **Create API key**
5. Copy the key
6. Format: `AIza...`

**Cost:** Free tier available (60 requests/minute)

---

### Step 4: Set Up Upstash Redis (Rate Limiting)

1. Go to [upstash.com](https://upstash.com)
2. Sign up with GitHub/Google
3. Click **Create Database**
4. Settings:
   - Name: `roshan-ai-ratelimit`
   - Type: **Global** (recommended)
   - Region: Choose closest
   - Plan: **Free** (25MB, 10K commands/day)
5. Click **Create**
6. In database dashboard:
   - Copy **REST URL**: `https://xxxxx.upstash.io`
   - Copy **REST TOKEN**: `AXXXxxxx...`

**Why needed:** Prevents API abuse, free tier is sufficient

---

### Step 5: Add Environment Variables to Vercel

#### Method A: Via Dashboard (Recommended)

1. Go to [vercel.com](https://vercel.com) → Your Project
2. Click **Settings** → **Environment Variables**
3. Add each variable:

**Required Variables:**

| Variable Name | Value | Example |
|---------------|-------|----------|
| `DATABASE_URL` | Your database connection string | `postgresql://...` |
| `NEXTAUTH_SECRET` | Generated secret (32 chars) | `abc123...` |
| `NEXTAUTH_URL` | Your Vercel URL | `https://your-app.vercel.app` |
| `OPENAI_API_KEY` | OpenAI key | `sk-proj-...` |
| `ANTHROPIC_API_KEY` | Anthropic key | `sk-ant-...` |
| `GOOGLE_AI_API_KEY` | Google AI key | `AIza...` |
| `UPSTASH_REDIS_REST_URL` | Upstash URL | `https://...upstash.io` |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash token | `AXXXx...` |

4. For each variable:
   - Enter **Key** (e.g., `DATABASE_URL`)
   - Enter **Value** (your actual key/URL)
   - Select environments: **Production**, **Preview**, **Development**
   - Click **Save**

#### Method B: Via CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Link project
cd /path/to/AI
vercel link

# Add variables one by one
vercel env add DATABASE_URL production
# Paste your value when prompted

vercel env add NEXTAUTH_SECRET production
vercel env add NEXTAUTH_URL production
# ... etc for all variables
```

---

### Step 6: Optional - Set Up OAuth (Social Login)

#### Google OAuth (Optional)

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create new project: `Roshan AI`
3. Go to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure consent screen:
   - User Type: **External**
   - App name: `Roshan AI`
   - User support email: your email
   - Developer contact: your email
6. Create OAuth Client:
   - Application type: **Web application**
   - Name: `Roshan AI Web`
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google` (for local)
     - `https://your-app.vercel.app/api/auth/callback/google` (for prod)
7. Copy **Client ID** and **Client Secret**
8. Add to Vercel:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`

#### GitHub OAuth (Optional)

1. Go to [github.com/settings/developers](https://github.com/settings/developers)
2. Click **New OAuth App**
3. Fill in:
   - Application name: `Roshan AI`
   - Homepage URL: `https://your-app.vercel.app`
   - Authorization callback URL: `https://your-app.vercel.app/api/auth/callback/github`
4. Click **Register application**
5. Copy **Client ID**
6. Click **Generate a new client secret** → Copy it
7. Add to Vercel:
   - `GITHUB_CLIENT_ID`
   - `GITHUB_CLIENT_SECRET`

---

### Step 7: Deploy!

#### First Deployment:

1. Push your code to GitHub:
```bash
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
```

2. In Vercel dashboard:
   - It should auto-deploy on push
   - Or click **Deployments** → **Deploy**

3. Wait 2-3 minutes for build

4. Check build logs for errors

#### After Deployment:

1. **Initialize Database:**

```bash
# Install Vercel CLI if not already
npm install -g vercel

# Pull environment variables
vercel env pull .env.local

# Push database schema
npx prisma db push

# Or run migrations
npx prisma migrate deploy
```

2. **Verify Deployment:**
   - Visit: `https://your-app.vercel.app`
   - Test homepage loads
   - Test chat page: `https://your-app.vercel.app/chat`
   - Test auth: `https://your-app.vercel.app/auth/signin`

3. **Check Logs:**
   - Vercel Dashboard → Deployments → Latest → **View Function Logs**
   - Look for any errors

---

## 🐛 Troubleshooting

### Build Fails: "Prisma Client not generated"

**Fix:**
```json
// Verify in package.json:
"postinstall": "prisma generate",
"build": "prisma generate && next build"
```

### Runtime Error: "DATABASE_URL not defined"

**Fix:**
- Go to Vercel → Settings → Environment Variables
- Verify `DATABASE_URL` exists
- Redeploy: Deployments → Three dots → Redeploy

### Error: "Module not found: react-markdown"

**Fix:**
```bash
# Locally, verify it's in package.json
npm install

# Push to GitHub
git push

# Vercel will auto-install
```

### Site loads but shows 500 error

**Fix:**
1. Check Function Logs for specific error
2. Most common: Missing environment variable
3. Run database migrations:

```bash
vercel env pull
npx prisma db push
```

### Rate limiting not working

**Fix:**
- Verify Upstash credentials are correct
- Check Upstash dashboard → Database → Commands
- Ensure both `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are set

---

## ✅ Post-Deployment Checklist

- [ ] Homepage loads correctly
- [ ] Chat interface works
- [ ] Can send messages and get responses
- [ ] Markdown renders properly
- [ ] Code blocks have syntax highlighting
- [ ] Dark/light mode works
- [ ] Authentication works
- [ ] Rate limiting is active
- [ ] No errors in Function Logs
- [ ] Database migrations ran successfully

---

## 💰 Cost Estimates

### Free Tier (Testing/Development):
- **Vercel**: Hobby plan - FREE
- **Database**: 
  - Vercel Postgres: FREE (256MB)
  - Supabase: FREE (500MB, 2GB bandwidth)
  - Neon: FREE (3GB storage)
- **Upstash Redis**: FREE (25MB, 10K commands/day)
- **Google Gemini**: FREE (60 req/min)

### Paid Usage (Production):
- **OpenAI GPT-4**: ~$0.03 per 1K tokens
- **Anthropic Claude**: ~$3 per 1M tokens
- **Vercel Pro**: $20/month (if needed)
- **Database**: 
  - Vercel Postgres Pro: $20/month
  - Supabase Pro: $25/month

**Estimated monthly cost for 1000 users**: $50-150

---

## 🔗 Quick Links

- **Vercel Dashboard**: https://vercel.com/dashboard
- **OpenAI API**: https://platform.openai.com
- **Anthropic**: https://console.anthropic.com
- **Google AI**: https://aistudio.google.com
- **Upstash**: https://upstash.com
- **Supabase**: https://supabase.com
- **Neon**: https://neon.tech

---

## 📞 Need Help?

1. Check [Vercel Documentation](https://vercel.com/docs)
2. Check [Next.js Deployment Docs](https://nextjs.org/docs/deployment)
3. Review Function Logs in Vercel Dashboard
4. Open an issue on GitHub

---

**Your app is now live! 🎉**

Visit: `https://your-project.vercel.app`