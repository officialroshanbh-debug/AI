import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import Google from 'next-auth/providers/google';
import GitHub from 'next-auth/providers/github';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  adapter: PrismaAdapter(prisma),
  trustHost: true, // Required for Vercel deployments - allows NextAuth to trust the host
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.password) {
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
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/auth/signin',
  },
  callbacks: {
    async signIn({ user, account, profile, email }) {
      try {
        // Allow OAuth sign-ins - the adapter will handle account linking
        if (account?.provider === 'google' || account?.provider === 'github') {
          // Ensure we have the required user data
          if (!user?.email) {
            console.error('[Auth] OAuth sign-in missing email:', { user, account });
            return false;
          }
          return true;
        }
        // For credentials, user is already validated
        return true;
      } catch (error) {
        console.error('[Auth] SignIn callback error:', error);
        return false;
      }
    },
    async jwt({ token, user, account, trigger }) {
      try {
        // When user signs in, store their ID in the token
        if (user) {
          token.id = user.id;
          token.email = user.email;
        }
        // Ensure token.id persists across requests
        return token;
      } catch (error) {
        console.error('[Auth] JWT callback error:', error);
        return token;
      }
    },
    async session({ session, token }) {
      try {
        // Ensure session.user exists and has the ID from token
        if (session.user && token.id) {
          session.user.id = token.id as string;
        }
        return session;
      } catch (error) {
        console.error('[Auth] Session callback error:', error);
        return session;
      }
    },
    async redirect({ url, baseUrl }) {
      try {
        // Ensure redirects stay within the same origin
        if (url.startsWith('/')) return `${baseUrl}${url}`;
        if (new URL(url).origin === baseUrl) return url;
        return baseUrl;
      } catch (error) {
        console.error('[Auth] Redirect callback error:', error);
        return baseUrl;
      }
    },
  },
  events: {
    async signIn({ user, account, isNewUser }) {
      // Log successful sign-ins for debugging
      if (account?.provider === 'google' || account?.provider === 'github') {
        console.log('[Auth] OAuth sign-in successful:', {
          provider: account.provider,
          userId: user.id,
          email: user.email,
          isNewUser,
        });
      }
    },
    async signInError({ error }) {
      // Log sign-in errors
      console.error('[Auth] Sign-in error:', error);
    },
  },
});

