const axios = require('axios');
const cheerio = require('cheerio');

const scrapeWebsiteText = async (url) => {
    try {
        const response = await axios.get(url);
        
        const $ = cheerio.load(response.data);

        $('script, style, nav, footer, header, aside').remove();

        const title = $('title').text() || url;
        
        const rawText = $('body').text().replace(/\s+/g, ' ').trim();

        if (!rawText) {
            throw new Error('No readable text found on this page');
        }

        return { title, content: rawText };
    } catch (error) {
        console.error("Scraping Error:", error.message);
        throw new Error('Failed to scrape the provided URL');
    }
};

module.exports = { scrapeWebsiteText };