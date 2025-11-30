'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { MODEL_CONFIGS, MODEL_IDS, type ModelId } from '@/types/ai-models';
import { User, Mail, Phone, MapPin, Download, Trash2, Calendar, BarChart3 } from 'lucide-react';

export function EnhancedSettingsContent() {
  const { data: session } = useSession();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
  });
  const [preferences, setPreferences] = useState({
    defaultModel: MODEL_IDS.GPT_4_1,
    responseStyle: 'balanced',
    researchDepth: 'medium',
    theme: 'system',
    language: 'en',
    compactMode: false,
    animations: true,
    autoSaveHistory: true,
    notifications: true,
    dataSharing: false,
  });
  const [stats, setStats] = useState({
    memberSince: new Date(),
    totalSearches: 0,
    researchCompleted: 0,
  });

  useEffect(() => {
    if (session?.user) {
      setFormData({
        name: session.user.name || '',
        email: session.user.email || '',
        phone: '',
        location: '',
      });
      // Load preferences from localStorage
      const savedPrefs = localStorage.getItem('userPreferences');
      if (savedPrefs) {
        try {
          const parsed = JSON.parse(savedPrefs);
          setPreferences((prev) => ({ ...prev, ...parsed }));
        } catch {
          // Ignore parse errors
        }
      }
      // Load stats (mock for now)
      setStats({
        memberSince: new Date(session.user.createdAt || Date.now()),
        totalSearches: 42,
        researchCompleted: 8,
      });
    }
  }, [session]);

  const handleSave = () => {
    localStorage.setItem('userPreferences', JSON.stringify(preferences));
    setIsEditing(false);
  };

  const handleDownloadData = () => {
    const data = {
      profile: formData,
      preferences,
      stats,
      exportDate: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `user-data-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Account Information
          </CardTitle>
          <CardDescription>Manage your account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Name
            </Label>
            {isEditing ? (
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            ) : (
              <p className="text-sm text-muted-foreground">{formData.name || 'Not set'}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email
            </Label>
            <p className="text-sm text-muted-foreground">{formData.email}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Phone
            </Label>
            {isEditing ? (
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 (555) 123-4567"
              />
            ) : (
              <p className="text-sm text-muted-foreground">{formData.phone || 'Not set'}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="location" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Location
            </Label>
            {isEditing ? (
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="City, Country"
              />
            ) : (
              <p className="text-sm text-muted-foreground">{formData.location || 'Not set'}</p>
            )}
          </div>

          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button onClick={handleSave}>Save Changes</Button>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* AI Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            AI Preferences
          </CardTitle>
          <CardDescription>Customize your AI experience</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Default Model</Label>
            <Select
              value={preferences.defaultModel}
              onValueChange={(value) =>
                setPreferences({ ...preferences, defaultModel: value as ModelId })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(MODEL_CONFIGS).map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    {model.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Response Style</Label>
            <Select
              value={preferences.responseStyle}
              onValueChange={(value) =>
                setPreferences({ ...preferences, responseStyle: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="concise">Concise</SelectItem>
                <SelectItem value="balanced">Balanced</SelectItem>
                <SelectItem value="detailed">Detailed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Research Depth</Label>
            <Select
              value={preferences.researchDepth}
              onValueChange={(value) =>
                setPreferences({ ...preferences, researchDepth: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="quick">Quick</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="deep">Deep</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleSave} className="w-full">
            Save Preferences
          </Button>
        </CardContent>
      </Card>

      {/* Interface Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Interface Settings</CardTitle>
          <CardDescription>Customize the appearance and behavior</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Compact Mode</Label>
              <p className="text-sm text-muted-foreground">Reduce spacing for more content</p>
            </div>
            <Switch
              checked={preferences.compactMode}
              onCheckedChange={(checked) =>
                setPreferences({ ...preferences, compactMode: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Animations</Label>
              <p className="text-sm text-muted-foreground">Enable smooth transitions</p>
            </div>
            <Switch
              checked={preferences.animations}
              onCheckedChange={(checked) =>
                setPreferences({ ...preferences, animations: checked })
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto-save History</Label>
              <p className="text-sm text-muted-foreground">Automatically save search history</p>
            </div>
            <Switch
              checked={preferences.autoSaveHistory}
              onCheckedChange={(checked) =>
                setPreferences({ ...preferences, autoSaveHistory: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive updates and alerts</p>
            </div>
            <Switch
              checked={preferences.notifications}
              onCheckedChange={(checked) =>
                setPreferences({ ...preferences, notifications: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Data Sharing</Label>
              <p className="text-sm text-muted-foreground">Help improve our services</p>
            </div>
            <Switch
              checked={preferences.dataSharing}
              onCheckedChange={(checked) =>
                setPreferences({ ...preferences, dataSharing: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Member Since</p>
              <p className="text-lg font-semibold">
                {new Date(stats.memberSince).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Searches</p>
              <p className="text-lg font-semibold">{stats.totalSearches}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Research Completed</p>
              <p className="text-lg font-semibold">{stats.researchCompleted}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Account Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" className="w-full" onClick={handleDownloadData}>
            <Download className="h-4 w-4 mr-2" />
            Download My Data
          </Button>
          <Button variant="outline" className="w-full text-destructive">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Account
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

