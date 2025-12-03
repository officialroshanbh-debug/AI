import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category') || 'business';
        const country = searchParams.get('country') || 'np';
        const apiKey = process.env.NEWSDATA_API_KEY;

        if (!apiKey) {
            // Return mock data if API key is missing (for development)
            return NextResponse.json({
                status: 'success',
                results: [
                    {
                        title: 'NEPSE Index surges by 25 points as market sentiment improves',
                        link: 'https://example.com/nepse-surge',
                        source_id: 'mock_source',
                        pubDate: new Date().toISOString(),
                        image_url: null,
                        description: 'The Nepal Stock Exchange (NEPSE) witnessed a significant jump today...',
                    },
                    {
                        title: 'NRB issues new directives for microfinance institutions',
                        link: 'https://example.com/nrb-directive',
                        source_id: 'mock_source',
                        pubDate: new Date().toISOString(),
                        image_url: null,
                        description: 'Nepal Rastra Bank has tightened regulations on microfinance loans...',
                    }
                ]
            });
        }

        const response = await fetch(
            `https://newsdata.io/api/1/news?apikey=${apiKey}&country=${country}&category=${category}&language=en`
        );

        if (!response.ok) {
            throw new Error(`NewsData API error: ${response.statusText}`);
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching finance news:', error);
        return NextResponse.json(
            { error: 'Failed to fetch news' },
            { status: 500 }
        );
    }
}
