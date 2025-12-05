'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, TrendingUp, TrendingDown, Activity, Building2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Mock chart data generator
const generateChartData = (basePrice: number) => {
    const data = [];
    let price = basePrice;
    for (let i = 0; i < 30; i++) {
        price = price + (Math.random() * 20 - 10);
        data.push({
            day: i + 1,
            price: Math.max(0, price)
        });
    }
    return data;
};

export default function StockAnalysisPage() {
    const params = useParams();
    const symbol = params.symbol as string;

    const [data, setData] = useState<any>(null);
    const [analysis, setAnalysis] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [chartData, setChartData] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch(`/api/finance/stock/${symbol}`);
                if (res.ok) {
                    const json = await res.json();
                    setData(json.data);
                    setAnalysis(json.analysis);
                    setChartData(generateChartData(json.data.price));
                }
            } catch (error) {
                console.error('Failed to fetch stock data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        if (symbol) {
            fetchData();
        }
    }, [symbol]);

    if (isLoading) {
        return (
            <div className="container max-w-6xl py-8 space-y-8 animate-pulse">
                <div className="h-8 w-32 bg-muted rounded" />
                <div className="h-64 bg-muted rounded-xl" />
                <div className="h-40 bg-muted rounded-xl" />
            </div>
        );
    }

    if (!data) {
        return (
            <div className="container max-w-6xl py-8 text-center">
                <h1 className="text-2xl font-bold">Stock Not Found</h1>
                <Link href="/finance">
                    <Button variant="link">Return to Finance</Button>
                </Link>
            </div>
        );
    }

    const isPositive = data.change >= 0;

    return (
        <div className="container max-w-6xl py-8 space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/finance">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        {data.symbol}
                        <span className="text-lg font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded">
                            {data.sector}
                        </span>
                    </h1>
                    <p className="text-muted-foreground">{data.name}</p>
                </div>
                <div className="ml-auto text-right">
                    <div className="text-3xl font-bold">₹{data.price.toFixed(2)}</div>
                    <div className={`flex items-center justify-end gap-1 font-medium ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                        {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                        {data.change > 0 ? '+' : ''}{data.change} ({data.percentChange.toFixed(2)}%)
                    </div>
                </div>
            </div>

            {/* Chart */}
            <div className="h-[400px] w-full bg-card border rounded-xl p-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-4">Price History (30 Days)</h3>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis
                            dataKey="day"
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            domain={['auto', 'auto']}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'hsl(var(--popover))',
                                borderColor: 'hsl(var(--border))',
                                borderRadius: '8px'
                            }}
                        />
                        <Line
                            type="monotone"
                            dataKey="price"
                            stroke={isPositive ? '#22c55e' : '#ef4444'}
                            strokeWidth={2}
                            dot={false}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* AI Analysis */}
            <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-card border rounded-xl p-6 space-y-4">
                        <div className="flex items-center gap-2">
                            <Activity className="h-5 w-5 text-primary" />
                            <h2 className="text-xl font-semibold">AI Investment Analysis</h2>
                        </div>
                        <div className="prose dark:prose-invert max-w-none">
                            <p className="whitespace-pre-line leading-relaxed text-muted-foreground">
                                {analysis || "Generating analysis..."}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Key Stats */}
                <div className="space-y-6">
                    <div className="bg-card border rounded-xl p-6 space-y-4">
                        <div className="flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-muted-foreground" />
                            <h2 className="text-lg font-semibold">Key Statistics</h2>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between py-2 border-b">
                                <span className="text-muted-foreground">Open</span>
                                <span className="font-medium">₹{data.open || '--'}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b">
                                <span className="text-muted-foreground">High</span>
                                <span className="font-medium">₹{data.high || '--'}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b">
                                <span className="text-muted-foreground">Low</span>
                                <span className="font-medium">₹{data.low || '--'}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b">
                                <span className="text-muted-foreground">Volume</span>
                                <span className="font-medium">{data.volume || '--'}</span>
                            </div>
                            <div className="flex justify-between py-2">
                                <span className="text-muted-foreground">Status</span>
                                <span className="font-medium capitalize">{data.status}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-muted/30 border rounded-xl p-6">
                        <div className="flex items-center gap-2 mb-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <h3 className="font-medium">About</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {data.name} is a leading institution in the {data.sector} sector, listed on the Nepal Stock Exchange.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
