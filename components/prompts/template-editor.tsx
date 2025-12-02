'use client';

import { useState } from 'react';
import { Save, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';

const CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'coding', label: 'Coding' },
  { value: 'writing', label: 'Writing' },
  { value: 'analysis', label: 'Analysis' },
  { value: 'research', label: 'Research' },
];

export function PromptTemplateEditor() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('general');
  const [template, setTemplate] = useState('');
  const [variables, setVariables] = useState<string[]>([]);
  const [isPublic, setIsPublic] = useState(false);
  const [previewValues, setPreviewValues] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Extract variables from template (format: {variableName})
  const extractVariables = (text: string): string[] => {
    const matches = text.match(/\{([^}]+)\}/g);
    if (!matches) return [];
    const uniqueVars = [...new Set(matches.map((m) => m.slice(1, -1)))];
    return uniqueVars;
  };

  const handleTemplateChange = (value: string) => {
    setTemplate(value);
    const extracted = extractVariables(value);
    setVariables(extracted);
    // Initialize preview values for new variables
    extracted.forEach((v) => {
      if (!previewValues[v]) {
        setPreviewValues((prev) => ({ ...prev, [v]: '' }));
      }
    });
  };

  const renderPreview = () => {
    let preview = template;
    variables.forEach((variable) => {
      const value = previewValues[variable] || `{${variable}}`;
      preview = preview.replaceAll(`{${variable}}`, value);
    });
    return preview;
  };

  const handleSave = async () => {
    if (!name || !template) {
      alert('Name and template are required');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          category,
          template,
          variables,
          isPublic,
        }),
      });

      if (!response.ok) throw new Error('Failed to save template');

      await response.json();
      router.push(`/prompts`);
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Failed to save template');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Editor */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Template Details</CardTitle>
              <CardDescription>Create a reusable prompt template</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Code Review Assistant"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of what this template does"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger id="category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-8">
                  <Label htmlFor="public">Public</Label>
                  <Switch
                    id="public"
                    checked={isPublic}
                    onCheckedChange={setIsPublic}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="template">Template *</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPreview(!showPreview)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      {showPreview ? 'Edit' : 'Preview'}
                    </Button>
                  </div>
                </div>
                {showPreview ? (
                  <div className="p-4 rounded-lg border bg-muted/50 min-h-[300px] whitespace-pre-wrap">
                    {renderPreview() || <span className="text-muted-foreground">Preview will appear here</span>}
                  </div>
                ) : (
                  <Textarea
                    id="template"
                    value={template}
                    onChange={(e) => handleTemplateChange(e.target.value)}
                    placeholder="Enter your prompt template. Use {variableName} for variables."
                    rows={12}
                    className="font-mono text-sm"
                  />
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Use {'{variableName}'} to create variables
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Variables & Preview */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Variables</CardTitle>
              <CardDescription>
                {variables.length} variable{variables.length !== 1 ? 's' : ''} detected
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {variables.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No variables found. Add {'{variableName}'} in your template.
                </p>
              ) : (
                variables.map((variable) => (
                  <div key={variable} className="space-y-1">
                    <Label className="text-xs">{variable}</Label>
                    <Input
                      value={previewValues[variable] || ''}
                      onChange={(e) =>
                        setPreviewValues((prev) => ({
                          ...prev,
                          [variable]: e.target.value,
                        }))
                      }
                      placeholder={`Enter value for ${variable}`}
                      className="text-sm"
                    />
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleSave}
                disabled={isSaving || !name || !template}
                className="w-full"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Template'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

