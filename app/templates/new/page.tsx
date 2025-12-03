'use client';

import { PromptTemplateEditor } from '@/components/prompts/template-editor';

export default function NewTemplatePage() {
    return (
        <div className="container mx-auto py-8 px-4 max-w-4xl">
            <PromptTemplateEditor />
        </div>
    );
}
