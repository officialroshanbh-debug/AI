'use client';

import { useEffect, useState } from 'react';
import { OverviewCards } from './overview-cards';
import { ChartsSection } from './charts-section';
import { RecentActivity } from './recent-activity';
import { Loader2 } from 'lucide-react';

interface AnalyticsData {
    overview: {
        users: {
            total: number;
            newToday: number;
            activeWeek: number;
        };
        chats: {
            total: number;
            totalMessages: number;
        };
        usage: {
            apiCallsToday: number;
            tokensUsed: number;
        };
    };
    charts: {
        userGrowth: Array<{ date: string; count: number }>;
        modelUsage: Array<{ modelId: string; count: number; percentage: number }>;
    };
    recent: {
        signups: Array<{
            id: string;
            name: string | null;
            email: string;
            createdAt: string;
            _count: { chats: number };
        }>;
        chats: Array<{
            id: string;
            title: string;
            createdAt: string;
            user: { name: string | null; email: string };
            _count: { messages: number };
        }>;
    };
}

export function AdminDashboard() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const response = await fetch('/api/admin/analytics');
            const result = await response.json();
            setData(result);
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!data) {
        return (
            <div className="text-center text-muted-foreground">
                Failed to load analytics data
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <OverviewCards data={data.overview} />
            <ChartsSection charts={data.charts} />
            <RecentActivity recent={data.recent} />
        </div>
    );
}
