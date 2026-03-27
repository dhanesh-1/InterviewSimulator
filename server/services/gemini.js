const { GoogleGenAI } = require('@google/genai');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Generate interview questions based on parsed resume data
 */
async function generateQuestions(parsedResume, role, difficulty, previousPerformance = null) {
  let difficultyInstruction = '';
  if (difficulty === 'adaptive' && previousPerformance) {
    const avgScore = previousPerformance.averageScore || 5;
    if (avgScore > 7.5) difficultyInstruction = 'Generate HARD difficulty questions. The candidate has been performing very well.';
    else if (avgScore > 5) difficultyInstruction = 'Generate MEDIUM difficulty questions. The candidate is performing at an average level.';
    else difficultyInstruction = 'Generate EASY difficulty questions. The candidate needs simpler questions to build confidence.';
  } else {
    difficultyInstruction = `Generate ${(difficulty || 'medium').toUpperCase()} difficulty questions.`;
  }

  const prompt = `You are an expert interview coach. Based on the following candidate profile, generate exactly 6 interview questions for the role of "${role}".

CANDIDATE PROFILE:
- Skills: ${parsedResume.skills?.join(', ') || 'Not specified'}
- Experience: ${parsedResume.experience?.map(e => `${e.title} at ${e.company} (${e.duration})`).join('; ') || 'Not specified'}
- Education: ${parsedResume.education?.map(e => `${e.degree} from ${e.institution}`).join('; ') || 'Not specified'}
- Summary: ${parsedResume.summary || 'Not specified'}

INSTRUCTIONS:
${difficultyInstruction}

Generate a MIX of question types:
- 2 Technical questions (specific to their skills and role)
- 2 Behavioral questions (STAR method style)
- 1 HR question (about career goals, work style, etc.)
- 1 Situational question (hypothetical scenario)

Return ONLY a valid JSON array with this exact format (no markdown, no extra text):
[
  {
    "text": "question text here",
    "type": "technical|behavioral|HR|situational",
    "difficulty": "easy|medium|hard"
  }
]`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });

    let text = response.text.trim();
    const startIndex = text.indexOf('[');
    const endIndex = text.lastIndexOf(']');
    if (startIndex !== -1 && endIndex !== -1) {
      text = text.substring(startIndex, endIndex + 1);
    }
    
    const questions = JSON.parse(text);
    return questions;
  } catch (error) {
    if (error.status === 429) {
      throw new Error('API Quota Exceeded. Please try again soon.');
    }
    console.error('Gemini generateQuestions error:', error);
    throw new Error('Failed to generate interview questions. Please try again.');
  }
}

/**
 * Evaluate a user's answer to an interview question
 */
async function evaluateAnswer(question, userAnswer, resumeContext) {
  const prompt = `You are an expert interview evaluator. Evaluate the following interview answer.

QUESTION: "${question.text}"
QUESTION TYPE: ${question.type}
CANDIDATE'S ANSWER: "${userAnswer}"
CANDIDATE'S BACKGROUND SKILLS: ${resumeContext?.skills?.join(', ') || 'Not specified'}

Evaluate across these criteria (score each 1-10):
1. **Relevance**: How well the answer addresses the question
2. **Clarity**: How clearly the answer is structured and communicated
3. **Confidence**: How confident and assertive the response sounds
4. **Overall**: Overall impression and quality

Also provide:
- A paragraph of detailed constructive feedback
- 3 specific, actionable suggestions for improvement

Return ONLY a valid JSON object with this exact format (no markdown, no extra text):
{
  "relevance": 7,
  "clarity": 6,
  "confidence": 8,
  "overall": 7,
  "feedback": "Detailed feedback paragraph here...",
  "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"]
}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });

    let text = response.text.trim();
    const startIndex = text.indexOf('{');
    const endIndex = text.lastIndexOf('}');
    if (startIndex !== -1 && endIndex !== -1) {
      text = text.substring(startIndex, endIndex + 1);
    }

    const evaluation = JSON.parse(text);
    return evaluation;
  } catch (error) {
    if (error.status === 429) {
      throw new Error('API Quota Exceeded. Please wait 1 minute before trying again.');
    }
    console.error('Gemini evaluateAnswer error:', error);
    throw new Error('Failed to evaluate answer. Please try again.');
  }
}

/**
 * Parse resume raw text into structured data using Gemini
 */
async function parseResumeWithAI(rawText) {
  const prompt = `You are an expert resume parser. Extract structured information from the following resume text.

RESUME TEXT:
"""
${rawText.substring(0, 8000)}
"""

Extract and return ONLY a valid JSON object with this exact format (no markdown, no extra text):
{
  "isResume": true or false (evaluate if the text is actually a resume, return false if it's a random document/PDF),
  "skills": ["skill1", "skill2", ...],
  "experience": [
    {
      "title": "Job Title",
      "company": "Company Name",
      "duration": "Duration or dates",
      "description": "Brief description of responsibilities"
    }
  ],
  "education": [
    {
      "degree": "Degree name",
      "institution": "University/School name",
      "year": "Graduation year or date range"
    }
  ],
  "summary": "A 2-3 sentence professional summary of the candidate",
  "certifications": ["cert1", "cert2"]
}

If any section is not found in the resume, use empty arrays or empty strings. Be thorough in extracting skills - include both technical and soft skills mentioned anywhere in the resume.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });

    let text = response.text.trim();
    const startIndex = text.indexOf('{');
    const endIndex = text.lastIndexOf('}');
    if (startIndex !== -1 && endIndex !== -1) {
      text = text.substring(startIndex, endIndex + 1);
    }

    const parsed = JSON.parse(text);
    return parsed;
  } catch (error) {
    if (error.status === 429) {
      throw new Error('API Quota Exceeded. Please wait 1 minute before trying again.');
    }
    console.error('Gemini parseResume error:', error);
    throw new Error('Failed to parse resume with AI. Please try again.');
  }
}

module.exports = { generateQuestions, evaluateAnswer, parseResumeWithAI };
