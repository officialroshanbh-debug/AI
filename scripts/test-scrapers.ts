
import { scrapeNepseData } from '../lib/finance/nepse-scraper';
import { scrapeShareSansarNews, scrapeCompanyDetails } from '../lib/finance/sharesansar-scraper';

async function testScrapers() {
    console.log('--- Testing NEPSE Scraper ---');
    try {
        const nepseData = await scrapeNepseData();
        console.log('NEPSE Data:', JSON.stringify(nepseData, null, 2));
    } catch (error) {
        console.error('NEPSE Scraper Error:', error);
    }

    console.log('\n--- Testing ShareSansar News Scraper ---');
    try {
        const news = await scrapeShareSansarNews();
        console.log('News Items:', JSON.stringify(news, null, 2));
    } catch (error) {
        console.error('News Scraper Error:', error);
    }

    console.log('\n--- Testing Company Details Scraper (NABIL) ---');
    try {
        const company = await scrapeCompanyDetails('NABIL');
        console.log('Company Details:', JSON.stringify(company, null, 2));
    } catch (error) {
        console.error('Company Scraper Error:', error);
    }
}

testScrapers();
