'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Star, Copy, Layers, TrendingUp, Code, BookOpen, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface PromptTemplate {
  id: string;
  name: string;
  description: string | null;
  category: string;
  template: string;
  variables: string[] | null;
  isPublic: boolean;
  usageCount: number;
  createdAt: Date;
}

const CATEGORIES = [
  { id: 'all', label: 'All', icon: Layers },
  { id: 'general', label: 'General', icon: BookOpen },
  { id: 'coding', label: 'Coding', icon: Code },
  { id: 'writing', label: 'Writing', icon: BookOpen },
  { id: 'analysis', label: 'Analysis', icon: TrendingUp },
  { id: 'research', label: 'Research', icon: Zap },
];

export function PromptTemplatesBrowser() {
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<PromptTemplate[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const filterTemplates = useCallback(() => {
    let filtered = templates;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter((t) => t.category === selectedCategory);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.description?.toLowerCase().includes(query) ||
          t.template.toLowerCase().includes(query)
      );
    }

    setFilteredTemplates(filtered);
  }, [templates, selectedCategory, searchQuery]);

  useEffect(() => {
    fetchTemplates();
  }, []);

  useEffect(() => {
    filterTemplates();
  }, [filterTemplates]);

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/prompts?public=true');
      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseTemplate = (template: PromptTemplate) => {
    // Copy template to clipboard or navigate to chat with template
    const templateText = template.template;
    navigator.clipboard.writeText(templateText);
    // Could also navigate to chat with template pre-filled
    window.location.href = `/chat?template=${encodeURIComponent(template.id)}`;
  };

  const handleCopyTemplate = (template: PromptTemplate) => {
    navigator.clipboard.writeText(template.template);
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => window.location.href = '/prompts/new'}>
          <Plus className="h-4 w-4 mr-2" />
          Create Template
        </Button>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {CATEGORIES.map((category) => {
          const Icon = category.icon;
          const isActive = selectedCategory === category.id;
          return (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={cn(
                'flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all whitespace-nowrap',
                isActive
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-transparent bg-secondary/50 text-muted-foreground hover:bg-secondary'
              )}
            >
              <Icon className="h-4 w-4" />
              {category.label}
            </button>
          );
        })}
      </div>

      {/* Templates Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No templates found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template, index) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="h-full flex flex-col hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    {template.isPublic && (
                      <Badge variant="secondary" className="text-xs">
                        Public
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="line-clamp-2">
                    {template.description || 'No description'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <div className="flex-1 mb-4">
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {template.template.slice(0, 150)}
                      {template.template.length > 150 ? '...' : ''}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Star className="h-3 w-3" />
                      {template.usageCount} uses
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUseTemplate(template)}
                        className="h-8"
                      >
                        Use
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleCopyTemplate(template)}
                        className="h-8 w-8"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  {template.variables && template.variables.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {template.variables.map((variable) => (
                        <Badge key={variable} variant="outline" className="text-xs">
                          {`{${variable}}`}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

