import { PromptTemplateEditor } from '@/components/prompts/template-editor';

export default function NewPromptPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-medium tracking-tight mb-2">
            Create Prompt Template
          </h1>
          <p className="text-muted-foreground">
            Build reusable prompts with variables for dynamic content
          </p>
        </div>
        <PromptTemplateEditor />
      </div>
    </div>
  );
}

