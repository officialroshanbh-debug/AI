# 🤖 Roshan AI - Modern Universal AI Platform

[![2025 Modern](https://img.shields.io/badge/2025-Modern-blue?style=for-the-badge)](https://github.com/officialroshanbh-debug/AI)
[![React 18](https://img.shields.io/badge/React-18.3.1-61dafb?style=for-the-badge&logo=react)](https://react.dev)
[![Next.js 15](https://img.shields.io/badge/Next.js-15.1-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178c6?style=for-the-badge&logo=typescript)](https://typescriptlang.org)

A production-ready, beautifully designed AI platform featuring multiple models (GPT, Gemini, Claude, Himalaya) with modern glassmorphism UI, markdown support, and syntax highlighting.

🎉 **Fully modernized with 2025 best practices!** See [COMPLETE_FIXES.md](./COMPLETE_FIXES.md) for details.

---

## ✨ Features

### 🤖 AI Capabilities
- **Multi-Model Support**: GPT-5.1, GPT-4.1, o3-mini, Gemini 2.0, Claude 3.7, and custom Himalaya
- **Real-time Streaming**: Watch responses generate in real-time
- **Markdown Rendering**: Full GitHub Flavored Markdown support
- **Syntax Highlighting**: 100+ programming languages with Prism
- **Code Copy**: One-click copy for all code blocks
- **Custom Learning**: Himalaya model with memory and context

### 🎨 Modern Design
- **Glassmorphism**: Frosted glass effects throughout
- **Gradient Mesh**: Dynamic gradient backgrounds
- **Bento Grid**: Modern asymmetric layouts
- **Framer Motion**: Smooth animations everywhere
- **Dark/Light Mode**: Beautiful themes with smooth transitions
- **Responsive**: Perfect on mobile, tablet, and desktop

### ⌨️ User Experience
- **Keyboard Shortcuts**: ⌘K to focus input, and more
- **Suggested Prompts**: Get started quickly
- **Empty States**: Beautiful onboarding
- **Loading Skeletons**: Smooth loading states
- **Error Boundaries**: Graceful error handling

### ♿ Accessibility
- **ARIA Labels**: Full screen reader support
- **Keyboard Navigation**: Navigate without mouse
- **Focus Management**: Clear focus indicators
- **Semantic HTML**: Proper heading hierarchy

---

## 📸 Screenshots

### Homepage
![Homepage with modern design, gradient mesh, and bento grid layout]

### Chat Interface
![Chat with markdown rendering, syntax highlighting, and glassmorphism]

### Dark Mode
![Beautiful dark mode with modern aesthetics]

---

## 🚀 Tech Stack

### Core
- **Framework**: Next.js 15.1 (App Router, React Server Components)
- **React**: 18.3.1 (stable)
- **TypeScript**: 5.7
- **Styling**: Tailwind CSS 3.4 + Custom Design System

### UI & Animations
- **Components**: Radix UI primitives
- **Animations**: Framer Motion 11
- **Icons**: Lucide React
- **Markdown**: ReactMarkdown + remark-gfm
- **Syntax**: react-syntax-highlighter (Prism)

### Backend & Data
- **Database**: PostgreSQL with Prisma ORM 5.20
- **Auth**: NextAuth v5
- **AI Models**: OpenAI, Anthropic, Google Gemini
- **Storage**: Vercel KV + Vercel Blob
- **Rate Limiting**: Upstash Redis

### Developer Experience
- **Testing**: Vitest + React Testing Library
- **Formatting**: Prettier + prettier-plugin-tailwindcss
- **Linting**: ESLint + eslint-plugin-jsx-a11y
- **Git Hooks**: Husky + lint-staged
- **Bundle Analysis**: @next/bundle-analyzer

---

## 🛠️ Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- API keys for:
  - OpenAI
  - Anthropic Claude
  - Google AI
- Upstash Redis (free tier works)
- Vercel account (for deployment)

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/officialroshanbh-debug/AI.git
cd AI
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**
```bash
cp .env.example .env
```

Fill in your `.env` file:
```env
# Database
DATABASE_URL="postgresql://..."

# NextAuth
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# AI Models
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."
GOOGLE_AI_API_KEY="AIza..."

# Rate Limiting
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."

# OAuth (optional)
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
GITHUB_CLIENT_ID="..."
GITHUB_CLIENT_SECRET="..."
```

4. **Set up the database:**
```bash
npx prisma generate
npx prisma db push
```

5. **Format code (optional but recommended):**
```bash
npm run format
```

6. **Run development server:**
```bash
npm run dev
```

7. **Open browser:**
```
http://localhost:3000
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `⌘K` or `Ctrl+K` | Focus chat input |
| `Escape` | Close modals/dialogs |
| `⌘N` | New chat (coming soon) |
| `⌘B` | Toggle sidebar (coming soon) |

---

## 🏗️ Project Structure

```
AI/
├── app/
│   ├── api/
│   │   ├── auth/          # NextAuth routes
│   │   ├── chat/          # Chat API
│   │   └── news/          # News API
│   ├── auth/            # Auth pages
│   ├── chat/            # Chat interface
│   ├── settings/        # Settings page
│   ├── error.tsx        # Root error boundary
│   ├── loading.tsx      # Root loading state
│   ├── globals.css      # Custom design system
│   ├── layout.tsx       # Root layout
│   └── page.tsx         # Modern homepage
│
├── components/
│   ├── auth/            # Auth components
│   ├── chat/            # Chat components
│   │   ├── chat-container.tsx  # Main chat
│   │   ├── chat-message.tsx    # Markdown + syntax highlighting
│   │   ├── chat-input.tsx      # Input field
│   │   └── model-selector.tsx  # Model picker
│   ├── news/            # News sidebar
│   ├── settings/        # Settings UI
│   └── ui/              # shadcn/ui components
│
├── hooks/
│   ├── useKeyboardShortcuts.ts  # Keyboard navigation
│   └── useMediaQuery.ts         # Responsive helpers
│
├── utils/
│   ├── formatting.ts   # Text/number formatting
│   └── validators.ts   # Input validation
│
├── lib/
│   ├── himalaya/       # Custom learning model
│   ├── models/         # AI model providers
│   ├── prisma.ts       # Prisma client
│   └── utils.ts        # Utility functions
│
├── types/
│   └── ai-models.ts    # TypeScript types
│
├── prisma/
│   └── schema.prisma   # Database schema
│
├── .prettierrc.json   # Prettier config
├── vitest.config.ts   # Test config
├── COMPLETE_FIXES.md  # Full modernization docs
└── README.md
```

---

## 🧪 Testing

### Run Tests
```bash
npm run test          # Run tests
npm run test:ui       # Open test UI
```

### Write Tests
Tests go in `__tests__` directories or `*.test.ts` files.

---

## 📦 Building for Production

### 1. Build
```bash
npm run build
```

### 2. Analyze Bundle (optional)
```bash
npm run analyze
```

### 3. Start Production Server
```bash
npm start
```

---

## 🚀 Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables
4. Deploy!

The project is optimized for Vercel Edge runtime.

### Database

For production, use:
- **Vercel Postgres** (easiest)
- **Supabase** (recommended)
- **Neon** (serverless)

---

## 📝 Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
npm run lint:fix     # Fix linting issues
npm run format       # Format with Prettier
npm run format:check # Check formatting
npm run type-check   # TypeScript check
npm run test         # Run tests
npm run test:ui      # Test UI dashboard
npm run analyze      # Analyze bundle size
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema changes
npm run db:migrate   # Run migrations
npm run db:studio    # Open Prisma Studio
```

---

## 🎓 Documentation

- **[COMPLETE_FIXES.md](./COMPLETE_FIXES.md)** - Full list of 2025 modernization fixes
- **[FIXES_APPLIED.md](./FIXES_APPLIED.md)** - Initial fix documentation
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System architecture
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Deployment guide
- **[QUICKSTART.md](./QUICKSTART.md)** - Quick start guide

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `npm run format` and `npm run lint:fix`
5. Submit a pull request

---

## 📝 License

MIT License - see [LICENSE](./LICENSE) file for details.

---

## 👤 Author

**Roshan Bhattarai**
- GitHub: [@officialroshanbh-debug](https://github.com/officialroshanbh-debug)
- Email: officialroshanbh@gmail.com

---

## 🙏 Acknowledgments

- **shadcn/ui** - Beautiful UI components
- **Radix UI** - Accessible primitives
- **Vercel** - Deployment platform
- **OpenAI, Anthropic, Google** - AI models

---

## ⭐ Star History

If you like this project, please give it a star!

---

**Built with ❤️ using Next.js, React, and modern web technologies.**