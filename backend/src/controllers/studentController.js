const {
  generateEmbedding,
  parseStudentQuery,
} = require("../services/aiService");
const Course = require("../models/Course");
const User = require("../models/User");
const { hasConflictWithSchedule } = require("./scheduleUtils");
const UniversityData = require("../models/UniversityData");
const { generateChatbotResponse } = require("../services/aiService");

module.exports.suggestCourses = async (req, res) => {
  try {
    const { studentQuery } = req.body;

    if (!studentQuery) {
      return res.status(400).json({ message: "Please provide a search query" });
    }

    const parsedQuery = await parseStudentQuery(studentQuery);
    const { semanticQuery, constraints } = parsedQuery;
    const textToEmbed =
      semanticQuery && semanticQuery.trim() !== ""
        ? semanticQuery
        : studentQuery;

    const queryVector = await generateEmbedding(textToEmbed);

    const potentialCourses = await Course.aggregate([
      {
        $vectorSearch: {
          index: "vector_index",
          path: "embedding",
          queryVector: queryVector,
          numCandidates: 30,
          limit: 15,
        },
      },
      {
        $project: {
          embedding: 0,
          createdAt: 0,
          updatedAt: 0,
          score: { $meta: "vectorSearchScore" },
        },
      },
    ]);

    const finalSchedule = [];
    const ignoredCoursesDetails = [];

    const maxCourses = constraints?.maxCourses || 5;
    const avoidDays = constraints?.avoidDays || [];
    const preferredLanguage = constraints?.preferredLanguage || "Both";

    const hasTimeConflict = (newCourse, currentSchedule) => {
      if (!newCourse.schedule || !newCourse.schedule[0]) return false;
      const newSched = newCourse.schedule[0];
      const timeToMins = (t) => {
        if (!t) return 0;
        const [h, m] = t.split(":").map(Number);
        return h * 60 + m;
      };
      const newStart = timeToMins(newSched.startTime);
      const newEnd = timeToMins(newSched.endTime);

      for (let existingCourse of currentSchedule) {
        if (!existingCourse.schedule || !existingCourse.schedule[0]) continue;
        const existingSched = existingCourse.schedule[0];
        if (existingSched.day === newSched.day) {
          const existingStart = timeToMins(existingSched.startTime);
          const existingEnd = timeToMins(existingSched.endTime);
          if (
            Math.max(newStart, existingStart) < Math.min(newEnd, existingEnd)
          ) {
            return existingCourse.name;
          }
        }
      }
      return false;
    };

    for (let course of potentialCourses) {
      if (finalSchedule.length >= maxCourses) {
        ignoredCoursesDetails.push({
          course: course,
          reason: "Maximum number of courses reached.",
          courseDetails: course,
        });
        continue;
      }
      if (
        preferredLanguage !== "Both" &&
        course.language !== "Both" &&
        course.language !== preferredLanguage
      ) {
        ignoredCoursesDetails.push({
          course: course,
          reason: `You prefer ${preferredLanguage}, but this course is in ${course.language}.`,
          courseDetails: course,
        });
        continue;
      }
      const courseDay =
        course.schedule && course.schedule[0] ? course.schedule[0].day : null;
      if (courseDay && avoidDays.includes(courseDay)) {
        ignoredCoursesDetails.push({
          course: course,
          reason: `Course is scheduled on ${courseDay}, which you want to avoid.`,
          courseDetails: course,
        });
        continue;
      }

      const conflict = hasTimeConflict(course, finalSchedule);
      if (conflict) {
        ignoredCoursesDetails.push({
          course: course,
          reason: `Time conflict with ${conflict}.`,
          courseDetails: course,
        });
        continue;
      }

      finalSchedule.push(course);
    }

    const aiAnalysis = `I analyzed your request and found ${finalSchedule.length} courses tailored to your constraints! ✨`;

    res.status(200).json({
      success: true,
      aiAnalysis: aiAnalysis,
      finalSchedule: finalSchedule,
      ignoredCoursesDetails: ignoredCoursesDetails,
    });
  } catch (error) {
    console.error("Student Search Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process AI search.",
      error: error.message,
    });
  }
};

module.exports.saveSchedule = async (req, res) => {
  try {
    const { courseIds, targetStudentId } = req.body;
    if (!courseIds || !Array.isArray(courseIds)) {
      return res.status(400).json({ message: "Missing course list" });
    }

    let targetUser;

    if (targetStudentId && req.user.role === "admin") {
      targetUser = await User.findOne({ studentId: targetStudentId });
      if (!targetUser) {
        return res
          .status(404)
          .json({ message: "No user found with this Student ID." });
      }
    } else {
      targetUser = await User.findById(req.user._id);
    }

    targetUser.enrolledCourses = courseIds;
    await targetUser.save();

    const populated = await User.findById(targetUser._id).populate(
      "enrolledCourses",
    );

    res.status(200).json({
      message: "Schedule saved successfully!",
      schedule: populated.enrolledCourses,
      savedFor: {
        name: populated.name,
        studentId: populated.studentId || null,
      },
    });
  } catch (error) {
    console.error("Save Schedule Error:", error);
    res
      .status(500)
      .json({ message: "Failed to save schedule", error: error.message });
  }
};

module.exports.getMySchedule = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("enrolledCourses");

    res.status(200).json({
      message: "Schedule retrieved successfully",
      schedule: user.enrolledCourses || [],
      owner: {
        name: user.name,
        studentId: user.studentId || null,
      },
    });
  } catch (error) {
    console.error("Get Schedule Error:", error);
    res
      .status(500)
      .json({ message: "Failed to retrieve schedule", error: error.message });
  }
};

module.exports.getScheduleByStudentId = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Only admins can view schedules by Student ID." });
    }

    const { studentId } = req.params;
    const user = await User.findOne({ studentId }).populate("enrolledCourses");

    if (!user) {
      return res
        .status(404)
        .json({ message: "No user found with this Student ID." });
    }

    res.status(200).json({
      message: "Schedule retrieved successfully",
      schedule: user.enrolledCourses || [],
      owner: {
        name: user.name,
        studentId: user.studentId,
      },
    });
  } catch (error) {
    console.error("Get Schedule By Student ID Error:", error);
    res
      .status(500)
      .json({ message: "Failed to retrieve schedule", error: error.message });
  }
};

module.exports.askChatbot = async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) {
      return res.status(400).json({ message: "Please provide a question" });
    }
    const queryVector = await generateEmbedding(question);

    const searchResults = await UniversityData.aggregate([
      {
        $vectorSearch: {
          index: "chatbot_vector_index",
          path: "embedding",
          queryVector: queryVector,
          numCandidates: 10,
          limit: 3,
        },
      },
      {
        $project: {
          content: 1,
          url: 1,
          score: { $meta: "vectorSearchScore" },
        },
      },
    ]);

    const contextText = searchResults
      .map((doc) => doc.content)
      .join("\n\n---\n\n");
    const sourceUrls = searchResults.map((doc) => doc.url);

    const aiAnswer = await generateChatbotResponse(question, contextText);

    res.status(200).json({
      answer: aiAnswer,
      sources: sourceUrls,
    });
  } catch (error) {
    console.error("Chatbot Error:", error);
    res.status(500).json({
      message: "The Chatbot encountered an error",
      error: error.message,
    });
  }
};

module.exports.getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find();
    res.status(200).json(courses);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch courses" });
  }
};
