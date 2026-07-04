    const mongoose = require('mongoose');

    const courseSchema = new mongoose.Schema({
      name: {
        type: String,
        required: true,
        trim: true
      },
      language: {
        type: String,
        enum: ['German', 'English', 'Both'],
        default: 'German'
      },
      description: {
        type: String,
        required: true
      },
      embedding: {
        type: [Number], 
        required: false 
      },
      schedule: [{
        day: {
          type: String,
          enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        },
        startTime: {
          type: String,
        },
        endTime: {
          type: String, 
        },
        room: String
      }],
      examType: {
        type: String,
      },
      semester: {
        type: String,
        required: true
      },
      isActive: {
        type: Boolean,
        default: true
      }
    }, { timestamps: true });

    module.exports = mongoose.model('Course', courseSchema);