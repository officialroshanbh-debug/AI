'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, MessageSquare, Activity, TrendingUp, BarChart3, Zap } from 'lucide-react';

interface OverviewData {
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
}

export function OverviewCards({ data }: { data: OverviewData }) {
    const cards = [
        {
            title: 'Total Users',
            value: data.users.total.toLocaleString(),
            change: `+${data.users.newToday} today`,
            icon: Users,
            color: 'text-blue-600',
        },
        {
            title: 'Active Users',
            value: data.users.activeWeek.toLocaleString(),
            change: 'Last 7 days',
            icon: Activity,
            color: 'text-green-600',
        },
        {
            title: 'Total Chats',
            value: data.chats.total.toLocaleString(),
            change: `${data.chats.totalMessages.toLocaleString()} messages`,
            icon: MessageSquare,
            color: 'text-purple-600',
        },
        {
            title: 'API Calls Today',
            value: data.usage.apiCallsToday.toLocaleString(),
            change: 'Real-time',
            icon: BarChart3,
            color: 'text-orange-600',
        },
        {
            title: 'Tokens Used',
            value: (data.usage.tokensUsed / 1000).toFixed(1) + 'K',
            change: 'Last 7 days',
            icon: Zap,
            color: 'text-yellow-600',
        },
        {
            title: 'New Signups',
            value: data.users.newToday.toString(),
            change: 'Today',
            icon: TrendingUp,
            color: 'text-pink-600',
        },
    ];

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {cards.map((card) => {
                const Icon = card.icon;
                return (
                    <Card key={card.title}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                            <Icon className={`h-4 w-4 ${card.color}`} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{card.value}</div>
                            <p className="text-xs text-muted-foreground mt-1">{card.change}</p>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
