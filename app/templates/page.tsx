'use client';

import { useRouter } from 'next/navigation';
import { PromptTemplatesBrowser } from '@/components/prompts/templates-browser';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function TemplatesPage() {
    const router = useRouter();

    return (
        <div className="container mx-auto py-8 px-4 max-w-7xl">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold">Prompt Templates</h1>
                    <p className="text-muted-foreground mt-2">
                        Browse and manage your reusable prompt templates
                    </p>
                </div>
                <Button onClick={() => router.push('/templates/new')}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Template
                </Button>
            </div>

            <PromptTemplatesBrowser />
        </div>
    );
}
