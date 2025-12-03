'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';

interface UsageChartProps {
    data: Array<{
        date: Date | string;
        count: number;
    }>;
    type?: 'line' | 'bar';
    title: string;
    dataKey?: string;
    color?: string;
}

export function UsageChart({
    data,
    type = 'line',
    title,
    dataKey = 'count',
    color = '#8b5cf6'
}: UsageChartProps) {
    // Format data for chart
    const chartData = data.map(item => ({
        date: new Date(item.date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        }),
        [dataKey]: item.count,
    }));

    const ChartComponent = type === 'line' ? LineChart : BarChart;
    const DataComponent = type === 'line' ? Line : Bar;

    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <ChartComponent data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis
                            dataKey="date"
                            className="text-xs"
                            tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        />
                        <YAxis
                            className="text-xs"
                            tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'hsl(var(--background))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px',
                            }}
                        />
                        <Legend />
                        {React.createElement(DataComponent as any, {
                            type: 'monotone',
                            dataKey: dataKey,
                            stroke: color,
                            fill: color,
                            strokeWidth: 2,
                            name: title,
                        })}
                    </ChartComponent>
                </ResponsiveContainer>
            </CardContent>
        </Card >
    );
}
