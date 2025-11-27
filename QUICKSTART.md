# Quick Start Guide

Get your AI Platform up and running in minutes.

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database (local or cloud)
- API keys for at least OpenAI

## Installation

1. **Install dependencies**:
```bash
npm install
```

2. **Set up environment variables**:
Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/aiplatform"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-a-random-secret-here"

# OpenAI (required)
OPENAI_API_KEY="sk-your-key-here"

# Optional: Other AI providers
ANTHROPIC_API_KEY="your-key"
GOOGLE_AI_API_KEY="your-key"

# Optional: OAuth
GOOGLE_CLIENT_ID="your-client-id"
GOOGLE_CLIENT_SECRET="your-client-secret"
GITHUB_CLIENT_ID="your-client-id"
GITHUB_CLIENT_SECRET="your-client-secret"

# Optional: Rate limiting
UPSTASH_REDIS_REST_URL="your-url"
UPSTASH_REDIS_REST_TOKEN="your-token"
```

3. **Set up the database**:
```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push
```

4. **Start the development server**:
```bash
npm run dev
```

5. **Open your browser**:
Navigate to [http://localhost:3000](http://localhost:3000)

## First Steps

1. **Sign Up**: Create an account at `/auth/signup`
2. **Start Chatting**: Go to `/chat` and select a model
3. **Try Different Models**: Switch between GPT, Gemini, Claude, and Himalaya
4. **Explore Settings**: Check out `/settings` for your account info

## Testing the Models

### GPT Models
- **GPT-5.1**: Most advanced (uses GPT-4o as fallback)
- **GPT-4.1**: Enhanced GPT-4
- **o3-mini**: Fast and efficient

### Gemini 2.0
- Requires `GOOGLE_AI_API_KEY`
- Great for multimodal tasks

### Claude 3.7
- Requires `ANTHROPIC_API_KEY`
- Excellent for long-form content

### Himalaya
- Custom learning model
- Provides comprehensive, structured answers
- Learns from your interactions

## Troubleshooting

### Database Connection Error
- Verify `DATABASE_URL` is correct
- Ensure PostgreSQL is running
- Check database credentials

### API Key Errors
- Verify API keys are valid
- Check environment variables are loaded
- Restart dev server after adding keys

### Build Errors
```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

### Type Errors
```bash
# Check TypeScript
npm run type-check
```

## Next Steps

- Read [ARCHITECTURE.md](./ARCHITECTURE.md) for system design
- Check [DEPLOYMENT.md](./DEPLOYMENT.md) for production deployment
- Review [README.md](./README.md) for full documentation

## Getting Help

- Check the logs in your terminal
- Review error messages in the browser console
- Verify all environment variables are set
- Ensure database migrations have run

Happy coding! 🚀

