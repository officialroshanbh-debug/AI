# AI Platform - Universal AI Chat

A production-ready, full-stack AI platform built with Next.js 15, React 19, and modern best practices. Experience multiple AI models (GPT, Gemini, Claude, and custom Himalaya) in one elegant interface.

## Features

- **Multi-Model Support**: GPT-5.1, GPT-4.1, o3-mini, Gemini 2.0, Claude 3.7, and custom Himalaya model
- **Custom Learning Engine**: Himalaya model with persistent memory and learning capabilities
- **Long-Form Optimization**: Advanced pipeline for comprehensive, well-structured responses up to 10k tokens
- **Latest News Feed**: Real-time news from 12 popular Nepali news sources displayed in a sidebar
- **Modern UI**: Clean, minimalist design with light/dark themes and smooth animations
- **Authentication**: Email/password and OAuth (Google, GitHub) via NextAuth v5
- **Real-time Streaming**: Smooth streaming responses for all models
- **Rate Limiting**: Built-in rate limiting with Upstash
- **Production Ready**: Fully optimized for Vercel deployment

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **UI**: React 19, Tailwind CSS, shadcn/ui
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth v5
- **AI Models**: OpenAI, Google Gemini, Anthropic Claude
- **Storage**: Vercel KV + Vercel Blob (for embeddings)
- **Rate Limiting**: Upstash Redis

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- API keys for OpenAI, Anthropic, and Google AI
- Upstash Redis (for rate limiting)
- Vercel account (for deployment)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd AI
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Fill in your environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_SECRET`: Random secret for NextAuth
- `NEXTAUTH_URL`: Your app URL (http://localhost:3000 for local)
- `OPENAI_API_KEY`: Your OpenAI API key
- `ANTHROPIC_API_KEY`: Your Anthropic API key
- `GOOGLE_AI_API_KEY`: Your Google AI API key
- `UPSTASH_REDIS_REST_URL` & `UPSTASH_REDIS_REST_TOKEN`: Upstash Redis credentials
- OAuth credentials for Google and GitHub

4. Set up the database:
```bash
npx prisma generate
npx prisma db push
```

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Architecture

### Model Routing Layer

The platform uses a universal `AIModelProvider` interface that allows seamless switching between different AI models:

```typescript
interface AIModelProvider {
  id: string;
  name: string;
  callModel: (params: ModelCallParams) => Promise<ModelResponse>;
  streamModel: (params: ModelCallParams) => AsyncGenerator<ModelStreamChunk>;
  supportsStreaming: boolean;
}
```

### Himalaya Learning Model

Himalaya is a custom AI model that:

- Provides long, comprehensive answers with structured reasoning
- Maintains a calm, high-altitude perspective
- Learns from previous interactions using embeddings and memory
- Uses a custom prompt engineering system
- Stores conversation summaries for context retrieval

The learning system:
- Stores anonymized embeddings and conversation summaries
- Uses vector similarity for context retrieval
- Gradually refines behavioral patterns
- Compatible with Vercel's serverless architecture

### Long-Form Answer Pipeline

The platform includes an optimization pipeline that:

1. **Structures** short answers into organized sections
2. **Expands** with reasoning and context
3. **Refines** for coherence and flow

This ensures comprehensive responses even when the base model provides brief answers.

## Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Import the project in Vercel
3. Add all environment variables in Vercel dashboard
4. Deploy!

The project is configured for Vercel Edge runtime where possible for optimal performance.

### Database Setup

For production, use Vercel Postgres or Supabase:

1. Create a PostgreSQL database
2. Update `DATABASE_URL` in environment variables
3. Run migrations: `npx prisma migrate deploy`

## Project Structure

```
app/
  api/
    auth/          # NextAuth routes
    chat/          # Chat API endpoint
  auth/            # Authentication pages
  chat/            # Chat interface
  globals.css      # Global styles
  layout.tsx       # Root layout
  page.tsx         # Landing page

components/
  auth/            # Authentication components
  chat/            # Chat components
  ui/              # shadcn/ui components
  providers.tsx    # React providers

lib/
  himalaya/        # Himalaya learning system
  models/          # AI model providers
  prisma.ts        # Prisma client
  rate-limit.ts    # Rate limiting
  utils.ts         # Utilities

prisma/
  schema.prisma    # Database schema

types/
  ai-models.ts     # TypeScript types
```

## API Usage

### Chat Endpoint

```typescript
POST /api/chat
{
  "messages": [
    { "role": "user", "content": "Hello!" }
  ],
  "modelId": "gpt-4.1",
  "temperature": 0.7,
  "maxTokens": 2000
}
```

Returns a streaming response (Server-Sent Events).

## Environment Variables

See `.env.example` for all required environment variables.

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.

