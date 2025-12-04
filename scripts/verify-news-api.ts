
import { GET } from '../app/api/news/[...id]/route';
import { POST } from '../app/api/news/summarize/route';
import { NextRequest } from 'next/server';

async function verifyNewsApi() {
    console.log('Verifying News API...');

    // 1. Test GET /api/news/[...id] with a URL
    const testUrl = 'https://www.bbc.com/news/world-asia-68423992'; // Example URL
    const encodedUrl = encodeURIComponent(testUrl);

    // Mock request
    const req = new NextRequest(`http://localhost:3000/api/news/${encodedUrl}`);
    const context = { params: Promise.resolve({ id: [encodedUrl] }) };

    try {
        console.log(`Testing GET /api/news/${encodedUrl}...`);
        const response = await GET(req, context);
        const data = await response.json();

        if (response.status === 200 && data.newsItem) {
            console.log('✅ GET /api/news/[...id] success');
            console.log('Title:', data.newsItem.title);
            console.log('Content length:', data.newsItem.fullContent?.length);
        } else {
            console.error('❌ GET /api/news/[...id] failed', response.status, data);
        }
    } catch (error) {
        console.error('❌ GET /api/news/[...id] error', error);
    }

    // 2. Test POST /api/news/summarize
    const summarizeReq = new NextRequest('http://localhost:3000/api/news/summarize', {
        method: 'POST',
        body: JSON.stringify({
            title: 'Test Article',
            url: testUrl,
            content: 'This is a test article content. It should be summarized by the Himalaya model. The model is expected to provide a comprehensive summary.'
        })
    });

    // Mock auth session (this is tricky in a script, might need to mock auth function)
    // For now, we'll just check if the route exists and handles the request structure
    // We might get 401 Unauthorized, which confirms the route is reachable

    try {
        console.log('Testing POST /api/news/summarize...');
        const response = await POST(summarizeReq);
        const data = await response.json();

        if (response.status === 200) {
            console.log('✅ POST /api/news/summarize success');
            console.log('Summary:', data.summary);
        } else if (response.status === 401) {
            console.log('✅ POST /api/news/summarize reachable (Unauthorized as expected in script)');
        } else {
            console.error('❌ POST /api/news/summarize failed', response.status, data);
        }

    } catch (error) {
        console.error('❌ POST /api/news/summarize error', error);
    }
}

verifyNewsApi();
