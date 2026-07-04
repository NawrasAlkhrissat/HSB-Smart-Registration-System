# 🎓 HSB Smart Registration & Academic RAG System

![Node.js](https://img.shields.io/badge/Node.js-≥20.19-339933?style=flat-square&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-5.2.1-000000?style=flat-square&logo=express&logoColor=white)
![React](https://img.shields.io/badge/React-19.2.6-61DAFB?style=flat-square&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas%20%2B%20Vector%20Search-47A248?style=flat-square&logo=mongodb&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.3.1-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![JWT](https://img.shields.io/badge/Auth-JWT%20%2B%20httpOnly%20Cookie-black?style=flat-square&logo=jsonwebtokens)
![Google Gemini](https://img.shields.io/badge/AI-Google%20Generative%20AI-4285F4?style=flat-square&logo=google&logoColor=white)

An intelligent, AI-driven full-stack academic platform. This system transcends traditional CRUD applications by orchestrating advanced Large Language Models (LLMs), Retrieval-Augmented Generation (RAG), and Vector Search to fully automate student course scheduling, knowledge retrieval, and administrative data entry.

---

## 📖 Project Description

This repository contains a robust two-tier application:

- **`backend/`** — A Node.js/Express REST API that handles authentication, course catalog management, AI-driven course suggestions, a RAG chatbot, PDF syllabus ingestion, and scheduled/manual website scraping.
- **`frontend/`** — A React 19 single-page application (Vite + Tailwind CSS) providing a public landing page, authentication screens, a student portal (AI assistant + manual catalog + weekly timetable), an admin dashboard, and a floating chatbot widget.

---

## 🎯 Business Problem & Solution

**The Problem:**
Students face a manual, error-prone process for selecting courses: cross-referencing PDFs, checking for time-slot conflicts by hand, and searching for scattered institutional information. Administrators lack an efficient way to digitize syllabus PDFs into structured data and keep chatbot knowledge bases current.

**The Solution:**
* **AI Course Scheduling:** Students describe preferences in natural language. The backend parses constraints, embeds the query, performs a vector search over the `Course` collection, and returns a constraint-filtered, conflict-free schedule.
* **RAG Chatbot:** Students ask questions; the backend embeds the question, performs a vector search over scraped `UniversityData`, and asks Gemini to answer strictly from that retrieved context.
* **Admin AI Workflow:** A Gemini multimodal pipeline reads uploaded syllabus PDFs directly and returns structured course drafts for admins to review.
* **Automated Scraping Pipeline:** A robust `cron` scheduler extracts text from configured URLs, embeds it, and stores it for the chatbot.

---

## ⚙️ Tech Stack

### Frontend
- **React 19.2.6** + **React Router DOM 7.18.1**
- **Vite 8** (Lightning-fast dev server & bundler)
- **Tailwind CSS 4.3.1** (Modern utility-first styling)
- **react-hot-toast** (Elegant UX feedback)
- **Axios** (Configured for secure `httpOnly` cookie transmission)

### Backend
- **Node.js** + **Express 5.2.1**
- **Mongoose 9.7.0** (MongoDB ODM)
- **Security:** `jsonwebtoken` (JWT), `bcrypt` (Hashing), `cors`, `cookie-parser`
- **AI Integration:** `@google/generative-ai` SDK (`gemini-1.5-flash` & `embedding-001`)
- **Automation:** `node-cron`, `axios`, `cheerio` (Web scraping)
- **File Handling:** `multer` (In-memory PDF processing)

### Database
- **MongoDB Atlas**
- **Atlas Vector Search** (`$vectorSearch` aggregation stage) for semantic matching.

---

## 🏗️ System Architecture

The application follows a clean, three-tier Service-Oriented Architecture (SOA):

~~~mermaid
graph TB
    A["React 19 SPA<br/>Vite + Tailwind CSS v4"]

    subgraph Server["Node.js / Express API — app.js"]
        C["Auth Routes<br/>/api/auth"]
        D["Admin Routes<br/>/api/admin"]
        E["Student Routes<br/>/api/student"]
        F["authMiddleware<br/>protect + authorize"]
        G["Controllers"]
        H["Services Layer<br/>aiService / cronService / scraperService"]
        N["node-cron scheduler<br/>weekly background jobs"]
    end

    I[("MongoDB Atlas<br/>+ Vector Search")]
    J["Google Generative AI<br/>Gemini API"]
    K["Public Websites<br/>scraped via Axios + Cheerio"]

    A -- "Axios, withCredentials,<br/>JWT httpOnly cookie" --> C
    A --> D
    A --> E
    C --> F
    D --> F
    E --> F
    F --> G
    G --> H
    N --> H
    H --> I
    H --> J
    H --> K
~~~

### AI Course-Suggestion Flow

~~~mermaid
sequenceDiagram
    participant S as Student
    participant FE as StudentPortal.jsx
    participant API as POST /api/student/suggest-courses
    participant AI as aiService (Gemini)
    participant DB as MongoDB (Course collection)

    S->>FE: Enter natural-language request
    FE->>API: {studentQuery}
    API->>AI: parseStudentQuery(studentQuery)
    AI-->>API: {semanticQuery, constraints}
    API->>AI: generateEmbedding(semanticQuery)
    AI-->>API: embedding vector
    API->>DB: $vectorSearch on Course.embedding
    DB-->>API: Candidate courses ranked by similarity
    API->>API: Filter by maxCourses, avoidDays, preferredLanguage, time conflicts
    API-->>FE: {aiAnalysis, finalSchedule, ignoredCoursesDetails}
    FE-->>S: Render weekly timetable + excluded courses
~~~

---

## 🛡️ Security & Error Handling

- **HttpOnly, SameSite Cookies:** JWTs are never exposed to client-side JavaScript.
- **Role-Based Access Control (RBAC):** Centralized route protection (`authorize('admin', 'student')`) with redundant defense-in-depth controller checks for sensitive data.
- **Graceful Degradation:** The AI service layer implements **Fallback Mechanisms** and **Auto-Retries**. If third-party AI APIs experience high traffic (503/429 errors), the system falls back to standard workflows without crashing the UI.
- **Batch-Tolerant Scraping:** Scheduled scraping jobs catch errors per URL, accumulating them into a summary so a single failing website does not abort the entire cron process.

---

## 🚀 Getting Started (Local Development)

### Prerequisites
* Node.js (v18+)
* MongoDB Atlas Cluster
* Google Gemini API Key
* *Note: You must manually create two Atlas Vector Search Indexes in your MongoDB cluster (`vector_index` for Courses, and `chatbot_vector_index` for UniversityData).*

### Installation

1. **Clone the repository**
   ~~~bash
   git clone <repository-url>
   cd <repository-folder>
   ~~~

2. **Backend Setup**
   ~~~bash
   cd backend
   npm install
   ~~~
   *Create a `.env` file in the `backend` directory:*
   ~~~env
   PORT=3000
   MONGODB_URI=your-mongodb-atlas-uri
   JWT_SECRET=your-jwt-secret
   GEMINI_API_KEY=your-gemini-api-key
   NODE_ENV=development
   ~~~
   *Start the server:*
   ~~~bash
   npm run dev
   ~~~

3. **Frontend Setup**
   ~~~bash
   cd ../frontend
   npm install
   npm run dev
   ~~~

---

## 👤 Author

**Nawras Alkhrissat** — *Software Engineer | CS Student at GJU / HSB*

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/nawras-alkhrissat-70ab04303)

*Built with passion and deep engineering focus as part of an advanced AI integration elective.*
