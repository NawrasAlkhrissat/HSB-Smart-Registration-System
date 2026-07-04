# 🎓 HSB Smart Registration & Academic RAG System

![MERN Stack](https://img.shields.io/badge/Stack-MERN-blue)
![AI Powered](https://img.shields.io/badge/AI-Google_Gemini-orange)
![Database](https://img.shields.io/badge/Database-MongoDB_Vector_Search-green)
![Security](https://img.shields.io/badge/Security-httpOnly_Cookies-red)
![Architecture](https://img.shields.io/badge/Architecture-Service_Oriented-purple)

An intelligent, AI-driven full-stack academic platform engineered for **Hochschule Bremen (HSB)**. This system transcends traditional CRUD applications by orchestrating advanced Large Language Models (LLMs), Retrieval-Augmented Generation (RAG), and Vector Search to fully automate student course scheduling, knowledge retrieval, and administrative data entry.

---

## 🚀 Key Features & Innovations

### 🧠 1. Intelligent AI Schedule Builder
* **Semantic Constraint Parsing:** Students input complex natural language queries (e.g., *"I want 3 software courses in English, but no classes on Friday"*). The AI parses this into exact JSON constraints.
* **Vector Similarity Search:** Uses **MongoDB Atlas Vector Search** to mathematically match student prompts with semantically similar course embeddings.
* **Algorithmic Conflict Resolution:** A custom conflict-detection engine processes the vector results against the user's constraints and schedule, silently filtering out time collisions and outputting a perfectly aligned timetable.

### 🤖 2. Institutional Chatbot (RAG Architecture)
* **Zero Hallucination Policy:** The chatbot is strictly constrained using **Retrieval-Augmented Generation (RAG)**. It only answers questions based on a localized, vectorized knowledge base scraped directly from the official HSB website.
* **Automated Knowledge Refresh:** Integrated **Cron Jobs** (`node-cron`) automatically scrape and re-vectorize targeted URLs on a schedule, ensuring the LLM is always querying the most up-to-date institutional data.

### 📄 3. Admin AI Workflow (PDF Syllabus Extraction)
* **Automated Data Pipeline:** Admins upload unstructured PDF course syllabi. The system leverages `gemini-1.5-flash` with strict Prompt Engineering to enforce structured JSON array outputs.
* **Human-in-the-Loop (HITL):** Before persistence, the AI output is held in a draft state, allowing administrators to review, amend, and append scheduling parameters, ensuring 100% data integrity.

### 🛡️ 4. Enterprise-Grade Robustness & Security
* **Graceful Degradation:** The AI service layer implements rigorous **Fallback Mechanisms** and **Exponential Backoff Auto-Retries**. If third-party AI APIs (like Google's) experience high traffic (503/429 errors), the system safely falls back to standard queries without crashing the UI.
* **Hardened Security:** Built with robust RBAC (Role-Based Access Control). Authentication is secured via `bcrypt` hashing and stateless `JWT` tokens stored exclusively in **httpOnly, SameSite strict cookies** to prevent XSS attacks.

---

## 🛠️ Tech Stack & Architecture

### Frontend (Client-Side)
* **Framework:** React.js (Vite)
* **Styling:** Tailwind CSS (Responsive, Modern UI)
* **State Management:** React Context API
* **Routing & Protection:** `react-router-dom` with custom Protected Routes for Admin/Student isolation.
* **HTTP Client:** Axios (configured for automatic cookie inclusion).

### Backend (Server-Side)
* **Runtime Environment:** Node.js
* **Framework:** Express.js
* **AI Provider:** Google Gemini API (`gemini-1.5-flash` for generation/parsing, `embedding-001` for vectors).
* **Automation:** Node Cron (for scheduled web scraping), Puppeteer/Cheerio (for DOM parsing).
* **File Handling:** Multer (for PDF buffer processing).

### Database & Storage
* **Primary Database:** MongoDB Atlas
* **ORM:** Mongoose
* **Search Engine:** `$vectorSearch` aggregation pipeline.

---

## 📂 System Architecture Overview

The backend is built using a clean, **Service-Oriented Architecture (SOA)** to keep controllers lean and business logic testable:

```text
📦 backend
 ┣ 📂 src
 ┃ ┣ 📂 controllers    # Request/Response handling (Admin, Student, Auth)
 ┃ ┣ 📂 models         # Mongoose Schemas (Course, User, ScrapeTarget)
 ┃ ┣ 📂 routes         # Express routing definitions
 ┃ ┣ 📂 services       # Heavy lifting logic:
 ┃ ┃ ┣ 📜 aiService.js   # LLM interaction, Prompt Engineering, Vectorization
 ┃ ┃ ┗ 📜 cronService.js # Automated web scraping orchestration
 ┃ ┣ 📂 utils          # Helper functions (Error handling, Hashers)
 ┃ ┗ 📜 server.js      # Entry point & Middleware configuration
⚡ Engineering Challenges Solved
Handling API Rate Limits (503 Service Unavailable):

Challenge: Cloud AI providers frequently throttle free-tier or high-demand connections, causing frontend crashes.

Solution: Architected a self-healing retry loop inside aiService.js that catches HTTP 503 errors, waits asynchronously, and retries. If the service completely fails, it triggers a safe default JSON object to maintain operational continuity.

Preventing Empty Vector Crashes:

Challenge: If a user prompt only contained constraints (e.g., "No Monday classes") with no specific topic, the AI parser returned an empty semantic string, causing the embedding model to throw a 400 Bad Request.

Solution: Implemented conditional runtime logic to detect empty semantic returns and dynamically inject the raw student query as a fallback embedding string.

⚙️ Getting Started (Local Development)
Prerequisites
Node.js (v18+)

MongoDB Atlas Cluster (with Vector Search index configured on the courses collection)

Google Gemini API Key

Installation
Clone the repository

Bash
git clone [https://github.com/yourusername/hsb-smart-system.git](https://github.com/yourusername/hsb-smart-system.git)
Backend Setup

Bash
cd backend
npm install
Create a .env file in the backend directory:

Code-Snippet
PORT=5000
MONGODB_URI=your_mongo_atlas_connection_string
JWT_SECRET=your_super_secret_key
GEMINI_API_KEY=your_google_api_key
NODE_ENV=development
Start the server:

Bash
npm run dev
Frontend Setup

Bash
cd frontend
npm install
npm run dev
👤 Author
Nawras Alkhrissat

Software Engineer | CS Student at HSB

LinkedIn | GitHub

Built with passion and deep engineering focus as part of an advanced AI integration elective.
