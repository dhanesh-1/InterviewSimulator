# Interview Simulator Architecture & Tech Stack Summary

This document provides an overview of the tools, libraries, and methodologies used within the AI Interview Simulator project.

## 1. Resume / PDF Upload Handling
- **Middleware:** `multer` is used in the Express backend to securely handle `multipart/form-data` uploads, allowing users to upload resumes. 
- **Validation (File Level):** File type filtering ensures only `.pdf` and `.docx` extensions and MIME types are accepted. Files are temporarily saved to a local `uploads` directory.
- **Text Extraction:** 
  - For PDF files, `pdf-parse` reads the buffer and extracts the raw textual content.
  - For DOCX files, `mammoth` is used to reliably extract raw text.
- **Cleanup:** After processing, the temporary file is immediately unlinked (deleted) from the local filesystem to save space.

## 2. Invalid or Random Document Handling
If a user uploads a completely random PDF document or an image-based PDF where no text is found, it is handled securely through the following layered mechanism:
- **Length Check:** If the extracted text is severely short (less than 50 characters) or unreadable, the backend throws an initial error ("Could not extract enough text").
- **AI Validation (isResume Flag):** We explicitly instruct the Gemini LLM parser to evaluate the unstructured text first. It is passed an instruction to set an `isResume` boolean extraction flag. If the provided document text is missing recognizable professional sections, random garble, or completely distinct from a resume format, the LLM safely flags `isResume = false`. The API detects this and aborts the request securely, returning: *"Uploaded file does not appear to be a valid resume. Please upload a real resume."*

## 3. Generative AI Integration
- **Platform:** Google Gemini API via the official `@google/genai` Node.js SDK.
- **Model Used:** `gemini-2.5-flash`, favored for its extremely low latency and fast parsing capabilities necessary for interactive tools.
- **Use Cases:**
  1. **Resume Parsing:** Structures the unstructured resume text into JSON objects holding `skills`, `experience`, and `education`.
  2. **Question Generation:** Dynamically formulates a mix of 6 technical, behavioral, HR, and situational questions tailored perfectly to the candidate's skills and the specific job role string.
  3. **Answer Evaluation:** Receives the candidate's spoken/text answer along with the original question and background context to evaluate Clarity, Relevance, and Confidence—providing localized, specific feedback and 3 actionable suggestions for each response.

## 4. Speech-to-Text (Microphone Input)
- **Technology Used:** Native Browser **Web Speech API (`window.SpeechRecognition` / `window.webkitSpeechRecognition`)**
- **How it Works:** Rather than using heavy third-party libraries, the application directly queries the user's browser APIs to continuously transcribe audio on-device.
- **Resolution of Micro-Pause Resets:** Native Chromium continuous speech APIs tend to stop capturing and throw `onend` after 10-15 seconds of silence or breath pauses. Our custom `SpeechInput.jsx` wrapper employs React `useRef` states to securely accumulate sequential bursts of words. It preserves state across starts and stops, ensuring a user's multi-sentence response is captured effortlessly before clicking "Submit".

## 5. Text-to-Speech (Audio Playback)
- **Technology Used:** Native Browser **Web Speech API (`window.speechSynthesis`)**
- **How it Works:** The simulator mimics a real interviewer asking the question out loud upon loading. We package `SpeechSynthesisUtterance` within `speechUtils.js`. It filters through available browser voice synthesis engines, prioritizing high-quality human-sounding proxies (like Google Natural voices or Samantha).

## 6. Core Tech Stack Summary
**Frontend:**
- **React.js 18** configured with **Vite** for incredibly fast Hot-Module Replacement (HMR) and builds.
- **React Router DOM** for client-side routing.
- **CSS3** utilizing custom CSS variables, raw glassmorphism stylings, and dynamic CSS transitions instead of utility-class frameworks.
- **Recharts** for visualizing historical interview skill growth on user dashboard graphs.
- **React Icons** for clean scalable vector icons (using the `fi` Feather Icons pack).

**Backend:**
- **Node.js** running an **Express.js** API server.
- **MongoDB / Mongoose** acting as the primary database storage engine to historically log Sessions, extracted Resumes, and individual Question Evaluations.
- **dotenv** for local environment variable resolution.
