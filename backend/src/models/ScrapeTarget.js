const mongoose = require('mongoose');

const scrapeTargetSchema = new mongoose.Schema({
    url: { 
        type: String, 
        required: true, 
        unique: true 
    },
    description: { 
        type: String,
        required: true 
    },
    lastScrapedAt: { 
        type: Date, 
        default: null
    }
}, { timestamps: true });

module.exports = mongoose.model('ScrapeTarget', scrapeTargetSchema);