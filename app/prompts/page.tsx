import { PromptTemplatesBrowser } from '@/components/prompts/templates-browser';

export default function PromptsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-medium tracking-tight mb-2">
            Prompt Templates
          </h1>
          <p className="text-muted-foreground">
            Browse and use pre-built prompts or create your own
          </p>
        </div>
        <PromptTemplatesBrowser />
      </div>
    </div>
  );
}

