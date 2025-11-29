export interface NewsSource {
    id: string;
    name: string;
    url: string;
    category: 'general' | 'tech' | 'business' | 'entertainment' | 'sports';
    country: 'nepal' | 'india';
    logo?: string;
}

export const NEWS_SOURCES: NewsSource[] = [
    // Nepal Sources
    { id: 'onlinekhabar', name: 'Online Khabar', url: 'https://www.onlinekhabar.com', category: 'general', country: 'nepal' },
    { id: 'ekantipur', name: 'eKantipur', url: 'https://ekantipur.com', category: 'general', country: 'nepal' },
    { id: 'thehimalayantimes', name: 'The Himalayan Times', url: 'https://thehimalayantimes.com', category: 'general', country: 'nepal' },
    { id: 'myrepublica', name: 'My Republica', url: 'https://myrepublica.nagariknetwork.com', category: 'general', country: 'nepal' },
    { id: 'kathmandupost', name: 'The Kathmandu Post', url: 'https://kathmandupost.com', category: 'general', country: 'nepal' },
    { id: 'nagarik', name: 'Nagarik News', url: 'https://nagariknews.nagariknetwork.com', category: 'general', country: 'nepal' },
    { id: 'setopati', name: 'Setopati', url: 'https://www.setopati.com', category: 'general', country: 'nepal' },
    { id: 'annapurnapost', name: 'Annapurna Post', url: 'https://annapurnapost.com', category: 'general', country: 'nepal' },
    { id: 'ratopati', name: 'Ratopati', url: 'https://ratopati.com', category: 'general', country: 'nepal' },
    { id: 'nepalitimes', name: 'Nepali Times', url: 'https://www.nepalitimes.com', category: 'general', country: 'nepal' },
    { id: 'thahakhabar', name: 'Thaha Khabar', url: 'https://thahakhabar.com', category: 'general', country: 'nepal' },
    { id: 'imagekhabar', name: 'Image Khabar', url: 'https://www.imagekhabar.com', category: 'general', country: 'nepal' },

    // India Sources
    { id: 'timesofindia', name: 'Times of India', url: 'https://timesofindia.indiatimes.com', category: 'general', country: 'india' },
    { id: 'ndtv', name: 'NDTV', url: 'https://www.ndtv.com', category: 'general', country: 'india' },
    { id: 'indianexpress', name: 'The Indian Express', url: 'https://indianexpress.com', category: 'general', country: 'india' },
    { id: 'thehindu', name: 'The Hindu', url: 'https://www.thehindu.com', category: 'general', country: 'india' },
    { id: 'news18', name: 'News18', url: 'https://www.news18.com', category: 'general', country: 'india' },
    { id: 'indiatoday', name: 'India Today', url: 'https://www.indiatoday.in', category: 'general', country: 'india' },
    { id: 'dainikjagran', name: 'Dainik Jagran', url: 'https://www.jagran.com', category: 'general', country: 'india' },
    { id: 'outlookindia', name: 'Outlook India', url: 'https://www.outlookindia.com', category: 'general', country: 'india' },
    { id: 'thequint', name: 'The Quint', url: 'https://www.thequint.com', category: 'general', country: 'india' },
    { id: 'scroll', name: 'Scroll.in', url: 'https://scroll.in', category: 'general', country: 'india' },
    { id: 'economictimes', name: 'The Economic Times', url: 'https://economictimes.indiatimes.com', category: 'business', country: 'india' },
    { id: 'telegraphindia', name: 'The Telegraph', url: 'https://www.telegraphindia.com', category: 'general', country: 'india' },
];

export interface NewsItem {
    id: string;
    title: string;
    summary: string;
    sourceId: string;
    url: string;
    imageUrl?: string;
    publishedAt: string;
    topics: string[];
}

// Simulated data for initial UI
export const MOCK_NEWS: NewsItem[] = [
    {
        id: '1',
        title: 'Tech giants explore space data centers as AI demands surge',
        summary: 'Google, SpaceX, and Amazon leaders say orbital facilities could solve energy constraints, though launch costs and technical challenges remain significant barriers.',
        sourceId: 'timesofindia',
        url: '#',
        imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop',
        publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
        topics: ['Tech', 'Space', 'AI'],
    },
    {
        id: '2',
        title: 'Nepal tourism sees record growth in 2024',
        summary: 'Tourist arrivals in Nepal have surged by 20% compared to last year, with significant contributions from Indian and Chinese visitors.',
        sourceId: 'kathmandupost',
        url: '#',
        imageUrl: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=2071&auto=format&fit=crop',
        publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
        topics: ['Travel', 'Economy'],
    },
    {
        id: '3',
        title: 'Apple plans to use Intel for entry-level Mac chips by 2027',
        summary: 'In a surprising turn of events, Apple is reportedly in talks with Intel to supply chips for its entry-level Mac lineup starting in 2027.',
        sourceId: 'ndtv',
        url: '#',
        imageUrl: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?q=80&w=2070&auto=format&fit=crop',
        publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), // 12 hours ago
        topics: ['Tech', 'Apple'],
    },
    {
        id: '4',
        title: 'Google limits free Gemini 3 access after launch sparks demand surge',
        summary: 'Due to overwhelming demand, Google has temporarily restricted access to the free tier of its latest Gemini 3 model.',
        sourceId: 'onlinekhabar',
        url: '#',
        imageUrl: 'https://images.unsplash.com/photo-1697577418970-95d99b5a55cf?q=80&w=1996&auto=format&fit=crop',
        publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
        topics: ['AI', 'Google'],
    },
    {
        id: '5',
        title: 'Smartwatches become health monitors with AI analytics',
        summary: 'New AI algorithms are enabling smartwatches to detect early signs of chronic diseases with unprecedented accuracy.',
        sourceId: 'thehindu',
        url: '#',
        imageUrl: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?q=80&w=1927&auto=format&fit=crop',
        publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
        topics: ['Health', 'Tech'],
    },
    {
        id: '6',
        title: 'New Hydropower Project Announced in Eastern Nepal',
        summary: 'The government has approved a new 500MW hydropower project in the Sankhuwasabha district, aiming to boost energy exports.',
        sourceId: 'ekantipur',
        url: '#',
        imageUrl: 'https://images.unsplash.com/photo-1565625565588-44473e86c21e?q=80&w=2070&auto=format&fit=crop',
        publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
        topics: ['Energy', 'Infrastructure'],
    },
];
