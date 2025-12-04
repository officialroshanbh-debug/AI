import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import Google from 'next-auth/providers/google';

if (!process.env.AUTH_SECRET && !process.env.NEXTAUTH_SECRET) {
  console.error('[Auth] CRITICAL: AUTH_SECRET or NEXTAUTH_SECRET is not set! This will cause authentication failures.');
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  adapter: PrismaAdapter(prisma),
  trustHost: true, // Required for Vercel deployments
  session: {
    strategy: 'jwt',
  },
  debug: process.env.NODE_ENV === 'development', // Enable debug logs in dev
  pages: {
    signIn: '/auth/signin',
    // error: '/auth/signin', // Commented out to see actual error page
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      allowDangerousEmailAccountLinking: true,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      try {
        if (user) {
          token.id = user.id;
          token.email = user.email;
          console.log('[Auth] JWT Callback - User signed in:', { userId: user.id, email: user.email });
        }
        return token;
      } catch (error) {
        console.error('[Auth] JWT Callback Error:', error);
        return token;
      }
    },
    async session({ session, token }) {
      try {
        if (token && session.user) {
          session.user.id = token.id as string;
        }
        return session;
      } catch (error) {
        console.error('[Auth] Session Callback Error:', error);
        return session;
      }
    },
    async redirect({ url, baseUrl }) {
      // Ensure redirects stay within the same origin
      console.log('[Auth] Redirect callback:', { url, baseUrl });
      if (url.startsWith('/')) {
        const redirectUrl = `${baseUrl}${url}`;
        console.log('[Auth] Redirecting to:', redirectUrl);
        return redirectUrl;
      }
      if (new URL(url).origin === baseUrl) {
        console.log('[Auth] Redirecting to:', url);
        return url;
      }
      console.log('[Auth] Redirecting to baseUrl:', baseUrl);
      return baseUrl;
    },
  },
  events: {
    async signIn({ user, account }) {
      console.log('[Auth] Sign in successful', {
        userId: user.id,
        email: user.email,
        provider: account?.provider,
      });
    },
    async createUser({ user }) {
      console.log('[Auth] New user created:', {
        userId: user.id,
        email: user.email,
      });

      // Trigger news crawl for new user
      try {
        const { fetchAllNews } = await import('@/lib/news/news-fetcher');
        // Run in background without awaiting to not block auth
        fetchAllNews(50, 4).catch(err =>
          console.error('[Auth] Failed to crawl news for new user:', err)
        );
      } catch (error) {
        console.error('[Auth] Error importing news fetcher:', error);
      }
    },
    async linkAccount({ user, account }) {
      console.log('[Auth] Account linked:', {
        userId: user.id,
        provider: account.provider,
        providerAccountId: account.providerAccountId,
      });
    },
  },
});
