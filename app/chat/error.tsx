'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function ChatError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Chat error:', error);
  }, [error]);

  return (
    <div className="flex h-screen items-center justify-center p-4">
      <div className="fixed inset-0 gradient-mesh opacity-30" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-md"
      >
        <Card className="glass border-border/50 shadow-large">
          <CardHeader className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10"
            >
              <AlertCircle className="h-8 w-8 text-destructive" />
            </motion.div>
            <CardTitle className="text-2xl">Chat Error</CardTitle>
            <CardDescription className="mt-2">
              We couldn&apos;t load the chat. This might be a temporary issue.
            </CardDescription>
            {error.message && (
              <p className="mt-2 text-xs text-muted-foreground">{error.message}</p>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={reset} className="w-full shadow-medium" size="lg">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            <Button variant="outline" className="glass w-full" size="lg" asChild>
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Back to Home
              </Link>
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}