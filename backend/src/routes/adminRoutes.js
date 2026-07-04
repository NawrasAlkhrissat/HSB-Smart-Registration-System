const express = require('express');
const multer = require('multer');
const { uploadCoursePDF , saveCourse , scrapeAndSaveURL , addScrapeTarget , removeScrapeTarget, getScrapeTargets, updateCourse, deleteCourse, triggerScraping } = require('../controllers/adminController');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = multer({ storage: multer.memoryStorage() });


router.use(protect);
router.use(authorize('admin'));

router.get('/scrape-targets', getScrapeTargets);

router.post('/upload-pdf', upload.single('pdfFile'), uploadCoursePDF);

router.post('/save-courses', saveCourse);

router.post('/scrape-url', scrapeAndSaveURL);

router.post('/trigger-scraping', triggerScraping);

router.post('/add-target', addScrapeTarget);

router.delete('/remove-target/:id', removeScrapeTarget);

router.put('/course/:id', updateCourse);

router.delete('/course/:id', deleteCourse);

module.exports = router;