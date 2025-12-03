'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Loader2 } from 'lucide-react';

interface ResearchProgressProps {
    status: string;
    progress: number;
    isComplete?: boolean;
}

export function ResearchProgress({ status, progress, isComplete }: ResearchProgressProps) {
    return (
        <Card>
            <CardContent className="pt-6">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        {isComplete ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                            <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        )}
                        <p className="text-sm font-medium">{status}</p>
                    </div>

                    <div className="space-y-2">
                        <Progress value={progress} className="h-2" />
                        <p className="text-xs text-muted-foreground text-right">
                            {Math.round(progress)}%
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
