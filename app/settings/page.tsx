import { SettingsContent } from '@/components/settings/settings-content';

export default function SettingsPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Settings</h1>
        <SettingsContent />
      </div>
    </div>
  );
}

