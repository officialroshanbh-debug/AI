'use client';

import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MODEL_CONFIGS } from '@/types/ai-models';

export function SettingsContent() {
  const { data: session } = useSession();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Name</label>
            <p className="text-sm text-muted-foreground">{session?.user?.name || 'Not set'}</p>
          </div>
          <div>
            <label className="text-sm font-medium">Email</label>
            <p className="text-sm text-muted-foreground">{session?.user?.email}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Available Models</CardTitle>
          <CardDescription>AI models available in your account</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.values(MODEL_CONFIGS).map((model) => (
              <div key={model.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">{model.name}</div>
                  <div className="text-sm text-muted-foreground">{model.description}</div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {model.maxTokens.toLocaleString()} tokens
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Himalaya Learning</CardTitle>
          <CardDescription>Custom learning model information</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Himalaya is our custom AI model that learns from your interactions to provide
            increasingly personalized and comprehensive responses. It maintains a calm,
            high-altitude perspective and specializes in long-form, structured answers.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

