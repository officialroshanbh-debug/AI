import { ApiPlayground } from '@/components/api/playground';

export default function ApiPlaygroundPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-medium tracking-tight mb-2">
            API Playground
          </h1>
          <p className="text-muted-foreground">
            Test and explore the API with interactive examples
          </p>
        </div>
        <ApiPlayground />
      </div>
    </div>
  );
}

