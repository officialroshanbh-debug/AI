import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import Google from 'next-auth/providers/google';
import GitHub from 'next-auth/providers/github';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';

// Create adapter with error handling
// Note: We handle account linking manually in signIn callback, but NextAuth still needs adapter
// for some internal operations. We'll create it but errors will be caught in callbacks.
let adapter;
try {
  adapter = PrismaAdapter(prisma);
  console.log('[Auth] PrismaAdapter created successfully');
} catch (error) {
  console.error('[Auth] Failed to create PrismaAdapter:', error);
  // Don't throw - we can still use JWT sessions without adapter
  // Adapter is only needed for OAuth account linking
  adapter = undefined;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  adapter: adapter || undefined, // Only use adapter if it was created successfully
  trustHost: true, // Required for Vercel deployments - allows NextAuth to trust the host
  cookies: {
    pkceCodeVerifier: {
      name: `${process.env.NODE_ENV === 'production' ? '__Secure-' : ''}next-auth.pkce.code_verifier`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 15, // 15 minutes - enough time for OAuth flow
      },
    },
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      checks: ['state'], // Disable PKCE for Google - use state check instead
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
        // Handle OAuth sign-ins manually to avoid adapter errors
        if (account?.provider === 'google' || account?.provider === 'github') {
          // Ensure we have the required user data
          if (!user?.email) {
            console.error('[Auth] OAuth sign-in missing email:', { user, account, profile });
            return false;
          }
          
          try {
            // Test database connection
            await prisma.$queryRaw`SELECT 1`;
            console.log('[Auth] Database connection verified');
            
            // Manually handle account linking to avoid adapter errors
            const existingUser = await prisma.user.findUnique({
              where: { email: user.email },
              include: { accounts: true },
            });
            
            if (existingUser) {
              // User exists - check if account is linked
              const existingAccount = existingUser.accounts.find(
                (acc) => acc.provider === account.provider && acc.providerAccountId === account.providerAccountId
              );
              
              if (!existingAccount && account.providerAccountId) {
                // Link account
                try {
                  await prisma.account.create({
                    data: {
                      userId: existingUser.id,
                      type: account.type,
                      provider: account.provider,
                      providerAccountId: account.providerAccountId,
                      access_token: account.access_token,
                      expires_at: account.expires_at,
                      id_token: account.id_token,
                      refresh_token: account.refresh_token,
                      scope: account.scope,
                      session_state: account.session_state,
                      token_type: account.token_type,
                    },
                  });
                  console.log('[Auth] Account linked successfully');
                } catch (linkError) {
                  console.error('[Auth] Failed to link account:', {
                    message: linkError instanceof Error ? linkError.message : String(linkError),
                    stack: linkError instanceof Error ? linkError.stack : undefined,
                  });
                  // Continue anyway - account might already exist
                }
              }
            } else {
              // Create new user and account
              try {
                await prisma.user.create({
                  data: {
                    email: user.email,
                    name: user.name || null,
                    image: user.image || null,
                    emailVerified: user.emailVerified ? new Date(user.emailVerified) : null,
                    accounts: {
                      create: {
                        type: account.type,
                        provider: account.provider,
                        providerAccountId: account.providerAccountId || '',
                        access_token: account.access_token,
                        expires_at: account.expires_at,
                        id_token: account.id_token,
                        refresh_token: account.refresh_token,
                        scope: account.scope,
                        session_state: account.session_state,
                        token_type: account.token_type,
                      },
                    },
                  },
                });
                console.log('[Auth] User and account created successfully');
              } catch (createError) {
                console.error('[Auth] Failed to create user/account:', {
                  message: createError instanceof Error ? createError.message : String(createError),
                  stack: createError instanceof Error ? createError.stack : undefined,
                });
                // If creation fails, still allow sign-in (user might exist from previous attempt)
                // The adapter will handle it or we'll retry next time
              }
            }
          } catch (dbError) {
            console.error('[Auth] Database error during OAuth sign-in:', {
              message: dbError instanceof Error ? dbError.message : String(dbError),
              stack: dbError instanceof Error ? dbError.stack : undefined,
            });
            // Still allow sign-in - JWT session will work without database
            // Account linking can happen on next sign-in
          }
          
          // Log for debugging
          console.log('[Auth] Allowing OAuth sign-in:', {
            provider: account.provider,
            email: user.email,
            hasAccount: !!account,
            userId: user.id,
          });
          return true;
        }
        // For credentials, user is already validated
        return true;
      } catch (error) {
        console.error('[Auth] SignIn callback error:', error);
        // Log full error details
        if (error instanceof Error) {
          console.error('[Auth] SignIn error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name,
          });
        }
        // Don't block sign-in on callback errors - let it proceed
        return true;
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
  },
});

