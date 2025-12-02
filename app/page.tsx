'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MODEL_CONFIGS } from '@/types/ai-models';
import {
  ArrowRight,
  Sparkles,
  Zap,
  Brain,
  Shield,
  Layers,
  MessageSquare,
} from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.33, 1, 0.68, 1],
    },
  },
};

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-hidden bg-background">
      {/* Gradient Mesh Background */}
      <div className="fixed inset-0 gradient-mesh opacity-50" />

      <div className="relative">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-24 md:py-32">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="mx-auto max-w-4xl text-center"
          >
            <motion.div variants={itemVariants} className="mb-6 inline-block">
              <div className="glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium shadow-subtle">
                <Sparkles className="h-4 w-4 text-accent" />
                <span>Powered by Advanced AI Models</span>
              </div>
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="mb-6 text-5xl font-bold leading-tight tracking-tight md:text-7xl"
            >
              Your Universal
              <br />
              <span className="gradient-text">AI Assistant</span>
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="mb-8 text-lg text-muted-foreground md:text-xl"
            >
              Experience the power of GPT-4, Gemini, Claude, and custom Himalaya models
              <br className="hidden md:block" />
              all in one elegant, minimalist interface.
            </motion.p>

            <motion.div variants={itemVariants} className="flex flex-wrap justify-center gap-4">
              <Button size="lg" className="group shadow-large" asChild>
                <Link href="/chat">
                  Start Chatting
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="glass" asChild>
                <Link href="#features">Learn More</Link>
              </Button>
            </motion.div>
          </motion.div>
        </section>

        {/* Bento Grid Features */}
        <section id="features" className="container mx-auto px-4 py-16 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-3xl font-bold md:text-4xl">Why Choose Roshan AI?</h2>
              <p className="text-muted-foreground">Powerful features designed for modern workflows</p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Feature 1 - Large Card */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
                className="lg:col-span-2"
              >
                <Card className="glass h-full border-border/50 shadow-medium transition-all hover:shadow-large">
                  <CardHeader>
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                      <Layers className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">Multi-Model Support</CardTitle>
                    <CardDescription className="text-base">
                      Access GPT-4.1, GPT-5.1, Gemini 2.0, Claude 3.7, and our proprietary Himalaya
                      model. Switch seamlessly between models for optimal results.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>

              {/* Feature 2 */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="glass h-full border-border/50 shadow-medium transition-all hover:shadow-large">
                  <CardHeader>
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
                      <Brain className="h-6 w-6 text-accent" />
                    </div>
                    <CardTitle>Learning Engine</CardTitle>
                    <CardDescription>
                      Himalaya learns from interactions to provide increasingly personalized
                      responses.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>

              {/* Feature 3 */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="glass h-full border-border/50 shadow-medium transition-all hover:shadow-large">
                  <CardHeader>
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
                      <Zap className="h-6 w-6 text-accent" />
                    </div>
                    <CardTitle>Long-Form Answers</CardTitle>
                    <CardDescription>
                      Advanced pipeline for comprehensive responses up to 10k tokens with perfect
                      formatting.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>

              {/* Feature 4 */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
                className="lg:col-span-2"
              >
                <Card className="glass h-full border-border/50 shadow-medium transition-all hover:shadow-large">
                  <CardHeader>
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                      <MessageSquare className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">Real-Time Streaming</CardTitle>
                    <CardDescription className="text-base">
                      Watch responses generate in real-time with our advanced streaming technology.
                      No more waiting for complete responses.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* Models Showcase */}
        <section className="container mx-auto px-4 py-16 md:py-24">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-3xl font-bold md:text-4xl">Available Models</h2>
              <p className="text-muted-foreground">
                Choose from our curated selection of AI models
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Object.values(MODEL_CONFIGS).map((model, index) => (
                <motion.div
                  key={model.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                >
                  <Card className="glass h-full border-border/50 shadow-subtle transition-all hover:shadow-medium">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        {model.name}
                      </CardTitle>
                      <CardDescription>{model.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Max Tokens:</span>
                          <span className="font-medium">{model.maxTokens.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Streaming:</span>
                          <span className="font-medium">
                            {model.supportsStreaming ? '✓ Yes' : '✗ No'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Long Form:</span>
                          <span className="font-medium">
                            {model.supportsLongForm ? '✓ Yes' : '✗ No'}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-16 md:py-24">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-4xl"
          >
            <Card className="glass border-border/50 shadow-large">
              <CardHeader className="space-y-6 text-center">
                <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-3xl md:text-4xl">Ready to Get Started?</CardTitle>
                <CardDescription className="text-base md:text-lg">
                  Join thousands of users experiencing the future of AI conversation.
                  <br />
                  No credit card required. Start chatting in seconds.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center pb-8">
                <Button size="lg" className="group shadow-large" asChild>
                  <Link href="/chat">
                    Start Chatting Now
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border/40 bg-background/50 backdrop-blur-xl">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center text-sm text-muted-foreground">
              <p>
                © 2025 <span className="font-semibold">Roshan AI</span>. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}