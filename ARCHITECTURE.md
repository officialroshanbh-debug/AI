# System Architecture

## Overview

The AI Platform is a full-stack Next.js application designed for production deployment on Vercel. It provides a unified interface for multiple AI models with advanced learning capabilities.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Client (Browser)                     │
│  React 19 + Next.js 15 + Tailwind CSS + shadcn/ui      │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Next.js App Router (Server)                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   API Routes │  │ Server Actions│  │   Middleware  │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬─────────┘ │
│         │                 │                  │           │
│         ▼                 ▼                  ▼           │
│  ┌──────────────────────────────────────────────────┐   │
│  │         Model Router & Providers                  │   │
│  │  OpenAI │ Gemini │ Claude │ Himalaya            │   │
│  └──────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────┘
                     │
         ┌───────────┼───────────┐
         ▼           ▼           ▼
    ┌─────────┐ ┌─────────┐ ┌─────────┐
    │ Prisma  │ │ Upstash │ │ NextAuth │
    │  (DB)   │ │ (Redis) │ │   (Auth) │
    └─────────┘ └─────────┘ └─────────┘
```

## Core Components

### 1. Model Routing Layer

**Location**: `lib/models/`

The platform uses a universal `AIModelProvider` interface that abstracts different AI providers:

```typescript
interface AIModelProvider {
  id: string;
  name: string;
  callModel: (params) => Promise<ModelResponse>;
  streamModel: (params) => AsyncGenerator<ModelStreamChunk>;
  supportsStreaming: boolean;
}
```

**Providers**:
- `OpenAIProvider`: Handles GPT models via OpenAI SDK
- `GeminiProvider`: Handles Gemini via REST API
- `ClaudeProvider`: Handles Claude via Anthropic API
- `HimalayaProvider`: Custom model with learning capabilities

**Router**: `lib/models/router.ts` - Central registry for all providers

### 2. Himalaya Learning System

**Location**: `lib/himalaya/`

Himalaya is a custom AI model that:

1. **Memory Layer** (`memory.ts`):
   - Stores conversation summaries and embeddings
   - Retrieves relevant context using similarity search
   - Updates memory after each interaction

2. **Long-Form Pipeline** (`pipeline.ts`):
   - Structures short answers into organized sections
   - Expands with reasoning and context
   - Refines for coherence and flow

3. **Configuration** (`config.json`):
   - Defines personality traits
   - Sets behavioral parameters
   - Configures learning parameters

**How It Works**:
1. User sends message
2. Himalaya retrieves relevant memories
3. Enhances system prompt with context
4. Calls base model (GPT-4) with enhanced prompt
5. Applies long-form pipeline if needed
6. Stores interaction in memory

### 3. Authentication System

**Location**: `auth.ts`, `app/api/auth/`

- **NextAuth v5**: Modern authentication framework
- **Providers**: Email/password, Google OAuth, GitHub OAuth
- **Session**: JWT-based sessions
- **Middleware**: Protects routes automatically

### 4. Database Schema

**Location**: `prisma/schema.prisma`

**Tables**:
- `User`: User accounts
- `Account`: OAuth account links
- `Session`: Active sessions
- `Chat`: Conversation threads
- `Message`: Individual messages
- `ModelSelection`: Model preferences per chat
- `HimalayaMemory`: Learning memory storage
- `UsageLog`: Usage tracking and analytics

### 5. API Routes

**Location**: `app/api/`

- `/api/auth/[...nextauth]`: NextAuth handlers
- `/api/auth/signup`: User registration
- `/api/chat`: Main chat endpoint with streaming

**Chat API Flow**:
1. Authenticate user
2. Rate limit check
3. Get/create chat
4. Save user message
5. Stream model response
6. Save assistant message
7. Log usage

### 6. UI Components

**Location**: `components/`

- **Chat**: `components/chat/`
  - `ChatContainer`: Main chat interface
  - `ChatMessage`: Message display
  - `ChatInput`: Input component
  - `ModelSelector`: Model selection dropdown

- **Auth**: `components/auth/`
  - `SignInForm`: Sign in form
  - `SignUpForm`: Registration form

- **UI**: `components/ui/`
  - shadcn/ui components (Button, Input, Card, etc.)

### 7. Rate Limiting

**Location**: `lib/rate-limit.ts`

- Uses Upstash Redis for distributed rate limiting
- Sliding window algorithm
- Graceful fallback if Redis unavailable
- Two tiers: standard (10 req/10s) and strict (5 req/1m)

## Data Flow

### Chat Request Flow

```
1. User types message
   ↓
2. ChatContainer sends POST /api/chat
   ↓
3. API route:
   - Authenticates user
   - Rate limits
   - Gets model provider
   ↓
4. Provider streams response
   ↓
5. Client receives chunks via SSE
   ↓
6. UI updates in real-time
   ↓
7. Message saved to database
```

### Himalaya Learning Flow

```
1. User message received
   ↓
2. Retrieve relevant memories
   ↓
3. Enhance system prompt
   ↓
4. Call base model
   ↓
5. Apply long-form pipeline
   ↓
6. Stream response
   ↓
7. Store in memory (async)
```

## Security Considerations

1. **Authentication**: All routes protected by middleware
2. **Rate Limiting**: Prevents abuse
3. **API Keys**: Stored server-side only
4. **Input Validation**: Zod schemas for all inputs
5. **SQL Injection**: Prisma ORM prevents SQL injection
6. **XSS**: React automatically escapes content

## Performance Optimizations

1. **Streaming**: Real-time responses via SSE
2. **Edge Functions**: Where possible for low latency
3. **Database Indexing**: Optimized queries with Prisma
4. **Connection Pooling**: Prisma handles connection management
5. **Caching**: Redis for rate limiting and session storage

## Scalability

The architecture is designed for horizontal scaling:

- **Stateless API**: All state in database
- **Serverless Functions**: Auto-scale with traffic
- **Database**: Connection pooling handles concurrent requests
- **Redis**: Distributed rate limiting
- **CDN**: Static assets via Vercel Edge Network

## Extensibility

### Adding a New Model

1. Create provider class implementing `AIModelProvider`
2. Add to `MODEL_CONFIGS` in `types/ai-models.ts`
3. Register in `lib/models/router.ts`
4. UI automatically picks it up

### Customizing Himalaya

1. Edit `lib/himalaya/config.json`
2. Modify prompts in `himalaya-provider.ts`
3. Adjust pipeline in `pipeline.ts`
4. Update memory retrieval in `memory.ts`

## Monitoring & Observability

- **Vercel Logs**: Function execution logs
- **Database Logs**: Query performance
- **Usage Logs**: Track model usage per user
- **Error Tracking**: Built into Next.js error boundaries

## Future Enhancements

1. **Real Embeddings**: Integrate OpenAI embeddings API
2. **Vector Database**: Use Pinecone or Weaviate for better similarity search
3. **Fine-tuning**: Custom model fine-tuning pipeline
4. **Analytics Dashboard**: Usage analytics and insights
5. **Multi-language**: Internationalization support
6. **Voice Input**: Speech-to-text integration

