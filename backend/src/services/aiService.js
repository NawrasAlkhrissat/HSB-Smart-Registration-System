const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const parseCourseToJSON = async (rawText) => {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0,
    },
  });

  const prompt = `You are an intelligent assistant specializing in extracting and analyzing academic data.
Please read the following text extracted from a university course PDF syllabus.
The text may contain ONE OR MORE courses. Extract the static information for EACH course and return it exactly in this JSON structure:
{
  "courses": [
    {
      "name": "Course Name",
      "language": "German or English or Both",
      "description": "A short, comprehensive description of the course and its topics (around 100 words)",
      "instructor": "Name of the professor or instructor teaching the course",
      "examType": "Project or Written Exam or Oral Presentation etc."
    }
  ]
}

Important: 
- If there is only one course, return it inside the array.
- If there are multiple courses, extract each one as a separate object inside the array.
- Do NOT attempt to extract or guess any scheduling details (days, times, or rooms).

Here is the extracted course text:
${rawText}`;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    return JSON.parse(responseText);
  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      semanticQuery: studentText,
      constraints: {
        avoidDays: [],
        preferredLanguage: "Both",
        maxCourses: 4,
      },
    };
  }
};

const generateEmbedding = async (text) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-embedding-2" });
    const result = await model.embedContent(text);
    const embedding = result.embedding.values;

    return embedding;
  } catch (error) {
    console.error("Embedding Generation Error:", error);
    throw new Error(
      "Failed to generate vector embedding for the course description",
    );
  }
};

const parseStudentQuery = async (studentText) => {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0,
    },
  });

  const prompt = `You are a scheduling assistant. Analyze the student's request and extract two things:
1. 'semanticQuery': The core topic or field of study they are looking for (e.g., "business, ai, web development").
2. 'constraints': Any specific rules they mentioned.
   - 'avoidDays': Array of days they DO NOT want to attend (e.g., ["Monday", "Friday"]). If none, return empty array.
   - 'preferredLanguage': "English", "German", or "Both". If not specified, return "Both".
   - 'maxCourses': The maximum number of courses they want. If not specified, return 5.

Return EXACTLY this JSON structure:
{
  "semanticQuery": "String",
  "constraints": {
    "avoidDays": ["String"],
    "preferredLanguage": "String",
    "maxCourses": Number
  }
}

Student request: "${studentText}"`;

  try {
    const result = await model.generateContent(prompt);
    return JSON.parse(result.response.text());
  } catch (error) {
    console.error("AI Query Parsing Error:", error);
    throw new Error("Failed to parse student request constraints");
  }
};

const generateChatbotResponse = async (question, context) => {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const prompt = `You are a helpful and friendly academic assistant for students at Hochschule Bremen (HSB).
Answer the student's question based ONLY on the provided context. 
If the context does not contain the answer, politely apologize and advise them to contact the university administration. Do not invent information.

Context from HSB Website:
${context}

Student Question:
${question}`;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("Chatbot AI Error:", error);
    throw new Error("Failed to generate response from the AI Chatbot");
  }
};

const extractCoursesFromPDF = async (pdfBase64) => {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const pdfPart = {
    inlineData: {
      data: pdfBase64,
      mimeType: "application/pdf",
    },
  };

  const prompt = `
    You are an expert university data extractor reading a syllabus PDF for Hochschule Bremen (HSB).
    Extract all the courses/modules mentioned.
    Return the result STRICTLY as a JSON array of objects. 
    Each object MUST have exactly these keys:
    - "name" (string): The exact name of the course/module.
    - "description" (string): A comprehensive summary of the course content.
    - "language" (string): The language of instruction (e.g., "English", "German").
    - "examType" (string): The type of assessment (e.g., "Written Exam", "Presentation", "Portfolio").
    
    Do not include any other text, markdown formatting, or explanations. Only the raw JSON array.
    `;

  const result = await model.generateContent([prompt, pdfPart]);
  const responseText = result.response.text();

  const cleanJson = responseText
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();
  return JSON.parse(cleanJson);
};

module.exports = {
  parseCourseToJSON,
  generateEmbedding,
  parseStudentQuery,
  generateChatbotResponse,
  extractCoursesFromPDF,
};
