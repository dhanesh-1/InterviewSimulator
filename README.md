# 🎙️ AI Interview Simulator

An intelligent, full-stack web application designed to help job seekers practice and perfect their interview skills. By uploading a resume, candidates participate in a dynamic, voice-enabled interview tailored specifically to their background and the role they are applying for. The application leverages Google's Gemini AI to parse resumes, generate adaptive questions, and provide immediate, actionable feedback on spoken answers.

## ✨ Features

- **📄 Smart Resume Parsing:** Upload your PDF or DOCX resume. The platform extracts your skills, experience, and education using AI. Includes built-in validation to reject non-resume documents.
- **🤖 Tailored Question Generation:** Utilizing the `gemini-2.5-flash` model, the app dynamically constructs a customized set of Behavioral, Technical, HR, and Situational questions based on your unique profile and chosen difficulty.
- **🗣️ Voice-Interactive Interface:**
  - **Text-to-Speech (TTS):** The AI "speaks" the interview questions to you out loud for a realistic experience (using native Browser Speech Synthesis).
  - **Speech-to-Text (STT):** Answer questions using your microphone! A robust, continuously-accumulating speech recognition engine captures your full response accurately.
- **📊 Real-Time AI Evaluation:** Get scored instantly on Relevance, Clarity, and Confidence for each answer, along with detailed constructive feedback and actionable suggestions.
- **📈 Progress Dashboard:** Review past interview sessions, track your average scores over time with interactive charts, and identify areas for improvement.

## 🛠️ Tech Stack

**Frontend**
- **React 18** (bootstrapped with Vite for high performance)
- **React Router** for seamless client-side navigation
- **Custom CSS:** Modern aesthetics using CSS Variables, Glassmorphism, and dynamic animations.
- **Recharts** & **React Icons** for data visualization and UI elements.

**Backend**
- **Node.js** & **Express.js** providing a robust RESTful API.
- **MongoDB** (with Mongoose) for persistent storage of user profiles, resumes, and interview evaluations.
- **@google/genai SDK** to interface with Google's Gemini LLMs.
- `multer`, `pdf-parse`, and `mammoth` for handling secure multi-part document uploads and text extraction.

## 🚀 Getting Started

### Prerequisites
Make sure you have the following installed on your machine:
- Node.js (v16+)
- A MongoDB cluster/database (Local or MongoDB Atlas)
- A Google Gemini API Key

### 1. Environment Setup
Create a `.env` file inside the `server/` directory and add the following variables:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_jwt_key
GEMINI_API_KEY=your_google_gemini_api_key
```

### 2. Backend Installation
Open a terminal and navigate to the `server` directory:
```bash
cd server
npm install
npm run dev # Starts the backend on http://localhost:5000
```

### 3. Frontend Installation
Open a second terminal and navigate to the `client` directory:
```bash
cd client
npm install
npm run dev # Starts the frontend on http://localhost:5173
```

### 4. Open the App
Navigate to `http://localhost:5173` in your browser (preferably Google Chrome or Edge for the best Web Speech API compatibility) and start practicing!

## 💡 Usage Guide
1. **Sign Up / Login:** Create a new account to keep track of your progress.
2. **Upload Resume:** Navigate to the Dashboard and upload your latest professional resume.
3. **Start an Interview:** Enter the exact Role/Job Title you are practicing for and select your difficulty level.
4. **Answer:** Use your microphone to practice answering out loud, or toggle to "Text Mode" if you prefer typing.
5. **Review:** Complete all questions and read through the AI's final detailed critique of your performance.
