import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  adapter: PrismaAdapter(prisma),
  trustHost: true, // Required for Vercel deployments
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/signin', // Redirect to sign-in page on error
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
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email as string },
            select: {
              id: true,
              email: true,
              name: true,
              image: true,
              password: true,
            },
          });

          if (!user) {
            return null;
          }

          // Handle case where password column might not exist yet
          if (!user.password) {
            console.warn('[Auth] User found but password column is missing or null');
            return null;
          }

          const isValid = await bcrypt.compare(
            credentials.password as string,
            user.password
          );

          if (!isValid) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
          };
        } catch (error) {
          // Handle Prisma schema mismatch errors gracefully
          if (error && typeof error === 'object' && 'code' in error && error.code === 'P2022') {
            console.error('[Auth] Database schema mismatch - password column missing');
            return null;
          }
          console.error('[Auth] Credentials authorize error:', error);
          return null;
        }
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
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
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
  },
});
