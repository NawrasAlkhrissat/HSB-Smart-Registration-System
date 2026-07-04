const {
  generateEmbedding,
  extractCoursesFromPDF
} = require("../services/aiService");
const mongoose = require('mongoose');
const Course = require("../models/Course");
const ScrapeTarget = require('../models/ScrapeTarget');
const User = require('../models/User');
const { runScheduledScraping, scrapeAndPersistUrl } = require('../services/cronService');
const fs = require('fs');

module.exports.uploadCoursePDF = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No PDF file uploaded.' });
    }
    try {
        const pdfBase64 = req.file.buffer 
            ? req.file.buffer.toString("base64") 
            : fs.readFileSync(req.file.path).toString("base64");

        const extractedCourses = await extractCoursesFromPDF(pdfBase64);

        res.status(200).json({ success: true, extractedCourses });

    } catch (error) {
        console.error("PDF Extraction Error:", error);
        res.status(500).json({ 
            message: 'Failed to process PDF with AI.', 
            error: error.message 
        });
    }
};

module.exports.saveCourse = async (req, res) => {
    try {
        const { courses } = req.body;
        if (!courses || !Array.isArray(courses) || courses.length === 0) {
            return res.status(400).json({ message: 'Missing or invalid courses array' });
        }

        const coursesWithEmbeddings = await Promise.all(
            courses.map(async (course) => {
                if (!course.name || !course.description || !course.semester) {
                    throw new Error(`Course "${course.name || 'Unknown'}" is missing required fields.`);
                }

                const embeddingVector = await generateEmbedding(course.description)
                return {
                    ...course,
                    embedding: embeddingVector
                };
            })
        );
        const savedCourses = await Course.insertMany(coursesWithEmbeddings);
        res.status(201).json({
            message: `${savedCourses.length} courses saved successfully with vector embeddings!`,
            savedCount: savedCourses.length
        });
    } catch (error) {
        console.error("Save Courses Error:", error);
        res.status(500).json({ message: 'Failed to save courses to the database', error: error.message });
    }
};

module.exports.scrapeAndSaveURL = async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) return res.status(400).json({ message: 'Please provide a URL' });

        const data = await scrapeAndPersistUrl(url);

        res.status(200).json({
            message: 'Website data successfully scraped and vectorized for the Chatbot!',
            data,
        });
    } catch (error) {
        console.error("Scrape URL Error:", error);
        res.status(500).json({ message: 'Failed to process the URL', error: error.message });
    }
};

module.exports.triggerScraping = async (req, res) => {
    try {
        const summary = await runScheduledScraping();

        if (summary.total === 0) {
            return res.status(200).json({
                message: 'No scrape targets found in the database.',
                summary,
            });
        }

        res.status(200).json({
            message: `Scraping finished: ${summary.scraped}/${summary.total} succeeded.`,
            summary,
        });
    } catch (error) {
        console.error('Trigger Scraping Error:', error);
        res.status(500).json({ message: 'Failed to run scraping job', error: error.message });
    }
};

module.exports.addScrapeTarget = async (req, res) => {
    try {
        const { url, description } = req.body;
        const newTarget = new ScrapeTarget({ url, description });
        await newTarget.save();
        res.status(201).json({ message: 'URL added to the automation queue', target: newTarget });
    } catch (error) {
        res.status(500).json({ message: 'Error adding URL', error: error.message });
    }
};

module.exports.removeScrapeTarget = async (req, res) => {
    try {
        const { id } = req.params;
        await ScrapeTarget.findByIdAndDelete(id);
        res.status(200).json({ message: 'URL removed from the automation queue' });
    } catch (error) {
        res.status(500).json({ message: 'Error removing URL', error: error.message });
    }
};


module.exports.getScrapeTargets = async (req, res) => {
    try {
        const targets = await ScrapeTarget.find().sort({ createdAt: -1 });
        res.status(200).json(targets);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching URLs', error: error.message });
    }
};

module.exports.updateCourse = async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid course ID format.' });
    }

    try {
        const course = await Course.findById(id);
        if (!course) {
            return res.status(404).json({ message: 'Course not found.' });
        }

        let updatedData = { ...req.body };

        if (req.body.name !== undefined || req.body.description !== undefined) {
            const newName = req.body.name ?? course.name;
            const newDesc = req.body.description ?? course.description;
            const textToEmbed = `Course: ${newName}. Description: ${newDesc}`;
            updatedData.embedding = await generateEmbedding(textToEmbed);
        }

        const updatedCourse = await Course.findByIdAndUpdate(
            id, 
            updatedData, 
            { new: true, runValidators: true }
        );

        res.status(200).json({ success: true, data: updatedCourse });
    } catch (error) {
        res.status(500).json({ message: 'Server error during course update', error: error.message });
    }
};

module.exports.deleteCourse = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid course ID format.' });
    }

    try {
        const course = await Course.findById(id);
        if (!course) {
            return res.status(404).json({ message: 'Course not found.' });
        }

        await User.updateMany({ enrolledCourses: id }, { $pull: { enrolledCourses: id } });
        await Course.findByIdAndDelete(id);

        res.status(200).json({ success: true, message: 'Course deleted successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error during course deletion', error: error.message });
    }
};