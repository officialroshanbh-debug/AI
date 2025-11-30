import { EnhancedSettingsContent } from '@/components/settings/enhanced-settings-content';
import { Settings } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Settings className="h-6 w-6" />
            </div>
            <h1 className="text-3xl font-serif font-medium tracking-tight">Profile & Settings</h1>
          </div>
          <p className="text-sm text-muted-foreground ml-13">
            Manage your account, preferences, and settings
          </p>
        </div>
        <div className="max-w-4xl mx-auto">
          <EnhancedSettingsContent />
        </div>
      </div>
    </div>
  );
}

