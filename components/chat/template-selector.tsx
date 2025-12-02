'use client';

import { useState, useEffect } from 'react';
import { FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface PromptTemplate {
  id: string;
  name: string;
  template: string;
  variables: string[] | null;
}

interface TemplateSelectorProps {
  onSelect: (template: string, variables: Record<string, string>) => void;
  onClose: () => void;
}

export function TemplateSelector({ onSelect, onClose }: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null);
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState('');

  useEffect(() => {
    fetchTemplates();
  }, []);

  useEffect(() => {
    if (selectedTemplate) {
      setVariableValues((prev) => {
        const vars = selectedTemplate.variables || [];
        const newValues: Record<string, string> = {};
        let hasNew = false;
        vars.forEach((v) => {
          if (!prev[v]) {
            newValues[v] = '';
            hasNew = true;
          }
        });
        return hasNew ? { ...prev, ...newValues } : prev;
      });
    }
  }, [selectedTemplate]);

  useEffect(() => {
    if (selectedTemplate) {
      updatePreview(selectedTemplate, variableValues);
    }
  }, [variableValues, selectedTemplate]);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/prompts?public=true');
      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const updatePreview = (template: PromptTemplate, values: Record<string, string>) => {
    let previewText = template.template;
    const vars = template.variables || [];
    vars.forEach((variable) => {
      const value = values[variable] || `{${variable}}`;
      previewText = previewText.replaceAll(`{${variable}}`, value);
    });
    setPreview(previewText);
  };

  const handleUseTemplate = () => {
    if (selectedTemplate) {
      onSelect(preview, variableValues);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Select Template</CardTitle>
            <CardDescription>Choose a prompt template to use</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Template List */}
            <div className="space-y-2">
              <h3 className="font-semibold">Templates</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => setSelectedTemplate(template)}
                    className={cn(
                      'w-full text-left p-3 rounded-lg border transition-colors',
                      selectedTemplate?.id === template.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:bg-muted'
                    )}
                  >
                    <div className="font-medium">{template.name}</div>
                    {template.variables && template.variables.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {template.variables.map((v) => (
                          <Badge key={v} variant="outline" className="text-xs">
                            {`{${v}}`}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Template Editor */}
            {selectedTemplate && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Fill Variables</h3>
                  {(selectedTemplate.variables || []).map((variable) => (
                    <div key={variable} className="mb-2">
                      <label className="text-sm font-medium mb-1 block">{variable}</label>
                      <Input
                        value={variableValues[variable] || ''}
                        onChange={(e) =>
                          setVariableValues((prev) => ({
                            ...prev,
                            [variable]: e.target.value,
                          }))
                        }
                        placeholder={`Enter value for ${variable}`}
                      />
                    </div>
                  ))}
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Preview</h3>
                  <div className="p-3 rounded-lg border bg-muted/50 min-h-[100px] whitespace-pre-wrap text-sm">
                    {preview || selectedTemplate.template}
                  </div>
                </div>

                <Button onClick={handleUseTemplate} className="w-full">
                  <FileText className="h-4 w-4 mr-2" />
                  Use Template
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

