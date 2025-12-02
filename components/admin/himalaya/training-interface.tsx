'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrainingDataUpload } from './training-data-upload';
import { TrainingDataTable } from './training-data-table';
import { FineTuneManager } from './fine-tune-manager';
import { Database, Upload, Zap } from 'lucide-react';

export function HimalayaTrainingInterface() {
    const [activeTab, setActiveTab] = useState('data');
    const [refreshKey, setRefreshKey] = useState(0);

    const handleDataUploaded = () => {
        setRefreshKey((prev) => prev + 1);
    };

    return (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-3">
                <TabsTrigger value="data" className="flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    <span className="hidden sm:inline">Training Data</span>
                </TabsTrigger>
                <TabsTrigger value="upload" className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    <span className="hidden sm:inline">Upload</span>
                </TabsTrigger>
                <TabsTrigger value="finetune" className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    <span className="hidden sm:inline">Fine-Tune</span>
                </TabsTrigger>
            </TabsList>

            <TabsContent value="data" className="mt-6">
                <TrainingDataTable key={refreshKey} />
            </TabsContent>

            <TabsContent value="upload" className="mt-6">
                <TrainingDataUpload onUploadComplete={handleDataUploaded} />
            </TabsContent>

            <TabsContent value="finetune" className="mt-6">
                <FineTuneManager />
            </TabsContent>
        </Tabs>
    );
}
