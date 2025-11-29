'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="fixed inset-0 gradient-mesh opacity-30" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <Card className="glass border-border/50 shadow-large">
          <CardHeader className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10"
            >
              <AlertCircle className="h-8 w-8 text-destructive" />
            </motion.div>
            <CardTitle className="text-2xl">Something went wrong!</CardTitle>
            <CardDescription className="mt-2">
              We encountered an unexpected error. Don&apos;t worry, you can try again or go back to the
              homepage.
            </CardDescription>
            {error.digest && (
              <p className="mt-2 text-xs text-muted-foreground">Error ID: {error.digest}</p>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={reset} className="w-full" size="lg">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            <Button variant="outline" className="w-full" size="lg" asChild>
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