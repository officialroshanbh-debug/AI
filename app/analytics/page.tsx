import { AnalyticsDashboard } from '@/components/analytics/dashboard';

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-medium tracking-tight mb-2">
            Analytics Dashboard
          </h1>
          <p className="text-muted-foreground">
            Track usage, costs, and performance metrics
          </p>
        </div>
        <AnalyticsDashboard />
      </div>
    </div>
  );
}

