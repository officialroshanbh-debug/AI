import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MODEL_CONFIGS } from '@/types/ai-models';
import { ArrowRight, Sparkles, Zap, Brain } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <header className="flex items-center justify-between mb-16">
          <div className="text-2xl font-bold">AI Platform</div>
          <div className="flex gap-4">
            <Button variant="ghost" asChild>
              <Link href="/auth/signin">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/chat">Get Started</Link>
            </Button>
          </div>
        </header>

        {/* Hero */}
        <div className="text-center mb-24 space-y-6">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
            Universal AI Chat
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Experience the power of multiple AI models in one elegant interface.
            From GPT to Gemini, Claude to Himalaya—all at your fingertips.
          </p>
          <div className="flex gap-4 justify-center pt-4">
            <Button size="lg" asChild>
              <Link href="/chat">
                Start Chatting
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-24">
          <Card>
            <CardHeader>
              <Sparkles className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>Multi-Model</CardTitle>
              <CardDescription>
                Access GPT-5.1, GPT-4.1, Gemini 2.0, Claude 3.7, and our custom
                Himalaya model
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <Brain className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>Learning Engine</CardTitle>
              <CardDescription>
                Himalaya learns from interactions to provide increasingly
                personalized responses
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <Zap className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>Long-Form Answers</CardTitle>
              <CardDescription>
                Advanced pipeline for comprehensive, well-structured responses
                up to 10k tokens
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Models */}
        <div className="mb-24">
          <h2 className="text-3xl font-bold text-center mb-12">Available Models</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.values(MODEL_CONFIGS).map((model) => (
              <Card key={model.id}>
                <CardHeader>
                  <CardTitle>{model.name}</CardTitle>
                  <CardDescription>{model.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Max Tokens:</span>
                      <span>{model.maxTokens.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Streaming:</span>
                      <span>{model.supportsStreaming ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Long Form:</span>
                      <span>{model.supportsLongForm ? 'Yes' : 'No'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl">Ready to get started?</CardTitle>
              <CardDescription>
                Join thousands of users experiencing the future of AI
                conversation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button size="lg" asChild>
                <Link href="/chat">
                  Start Chatting Now
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

