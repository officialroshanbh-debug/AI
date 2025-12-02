'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ChartsData {
    userGrowth: Array<{ date: string; count: number }>;
    modelUsage: Array<{ modelId: string; count: number; percentage: number }>;
}

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6366f1'];

export function ChartsSection({ charts }: { charts: ChartsData }) {
    // Format dates for better display
    const formattedGrowth = charts.userGrowth.map((item) => ({
        ...item,
        date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    }));

    return (
        <div className="grid gap-6 md:grid-cols-2">
            {/* User Growth Chart */}
            <Card className="col-span-full lg:col-span-1">
                <CardHeader>
                    <CardTitle>User Growth</CardTitle>
                    <CardDescription>New signups over the last 30 days</CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={formattedGrowth}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                dataKey="date"
                                tick={{ fontSize: 12 }}
                                interval="preserveStartEnd"
                            />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="count"
                                stroke="#3b82f6"
                                strokeWidth={2}
                                name="New Users"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Model Usage Chart */}
            <Card>
                <CardHeader>
                    <CardTitle>Model Usage</CardTitle>
                    <CardDescription>Distribution by AI model</CardDescription>
                </CardHeader>
                <CardContent>
                    {charts.modelUsage.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={charts.modelUsage}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={(entry) => `${entry.modelId} (${entry.percentage.toFixed(0)}%)`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="count"
                                >
                                    {charts.modelUsage.map((_entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                            No model usage data yet
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Daily API Calls */}
            <Card className="col-span-full">
                <CardHeader>
                    <CardTitle>API Usage Trend</CardTitle>
                    <CardDescription>Daily API calls over time</CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={formattedGrowth}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="count" fill="#8b5cf6" name="API Calls" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
}
