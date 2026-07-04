const express = require('express');
const {
  suggestCourses,
  saveSchedule,
  getMySchedule,
  getScheduleByStudentId,
  askChatbot,
  getAllCourses,
} = require('../controllers/studentController');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);
router.use(authorize('student', 'admin'));

router.get('/all-courses', getAllCourses);
router.post('/suggest-courses', suggestCourses);
router.post('/save-schedule', saveSchedule);
router.post('/ask-chatbot', askChatbot);
router.get('/my-schedule', getMySchedule);
router.get('/my-schedule/:studentId', getScheduleByStudentId);

module.exports = router;
