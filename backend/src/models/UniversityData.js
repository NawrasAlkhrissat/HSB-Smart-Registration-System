const mongoose = require('mongoose');

const universityDataSchema = new mongoose.Schema({
    url: { 
        type: String, 
        required: true, 
        unique: true
    },
    title: { 
        type: String 
    },
    content: { 
        type: String, 
        required: true
    },
    embedding: { 
        type: [Number], 
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('UniversityData', universityDataSchema);