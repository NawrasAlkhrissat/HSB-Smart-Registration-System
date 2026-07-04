const cron = require('node-cron');
const ScrapeTarget = require('../models/ScrapeTarget');
const UniversityData = require('../models/UniversityData');
const { scrapeWebsiteText } = require('./scraperService');
const { generateEmbedding } = require('./aiService');

const scrapeAndPersistUrl = async (url) => {
    const { title, content } = await scrapeWebsiteText(url);
    const embeddingVector = await generateEmbedding(content);

    await UniversityData.findOneAndUpdate(
        { url },
        { title, content, embedding: embeddingVector },
        { upsert: true, new: true }
    );

    await ScrapeTarget.findOneAndUpdate(
        { url },
        { lastScrapedAt: new Date() }
    );

    return { title, contentLength: content.length };
};

const runScheduledScraping = async () => {
    console.log('🔄 [CRON JOB] Starting automated website scraping...');

    const summary = { total: 0, scraped: 0, failed: 0, errors: [] };

    try {
        const targets = await ScrapeTarget.find();
        summary.total = targets.length;

        if (targets.length === 0) {
            console.log('⚠️ [CRON JOB] No URLs found in the database to scrape.');
            return summary;
        }

        for (const target of targets) {
            try {
                console.log(`Scraping: ${target.url}`);
                await scrapeAndPersistUrl(target.url);
                summary.scraped += 1;
                console.log(`✅ Successfully updated data for: ${target.url}`);
            } catch (err) {
                summary.failed += 1;
                summary.errors.push({ url: target.url, message: err.message });
                console.error(`❌ Failed to scrape ${target.url}:`, err.message);
            }
        }

        console.log('🎉 [CRON JOB] Automated scraping completed successfully!');
        return summary;
    } catch (error) {
        console.error('❌ [CRON JOB] Fatal Error:', error.message);
        throw error;
    }
};

const startCronJobs = () => {
    cron.schedule('0 2 * * 0', runScheduledScraping);
    console.log('⏰ Automated scraping cron job scheduled.');
};

module.exports = { startCronJobs, runScheduledScraping, scrapeAndPersistUrl };