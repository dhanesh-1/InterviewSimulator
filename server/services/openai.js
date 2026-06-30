const OpenAI = require('openai');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const MODEL = 'gpt-5.4-mini';
let client;

function getClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is required. Please add your OpenAI API key to server/.env.');
  }

  if (!client) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  return client;
}

async function generateText(prompt) {
  const response = await getClient().responses.create({
    model: MODEL,
    input: prompt
  });

  return (response.output_text || '').trim();
}

/**
 * Generate interview questions based on parsed resume data
 */
async function generateQuestions(parsedResume, role, difficulty, previousPerformance = null, jobDescription = null) {
  let difficultyInstruction = '';
  if (difficulty === 'adaptive' && previousPerformance) {
    const avgScore = previousPerformance.averageScore || 5;
    if (avgScore > 7.5) difficultyInstruction = 'Generate HARD difficulty questions. The candidate has been performing very well.';
    else if (avgScore > 5) difficultyInstruction = 'Generate MEDIUM difficulty questions. The candidate is performing at an average level.';
    else difficultyInstruction = 'Generate EASY difficulty questions. The candidate needs simpler questions to build confidence.';
  } else {
    difficultyInstruction = `Generate ${(difficulty || 'medium').toUpperCase()} difficulty questions.`;
  }

  const jobContext = jobDescription
    ? `\nJOB DESCRIPTION (Questions MUST specifically test whether the candidate can fulfill this role):\n${jobDescription.substring(0, 2000)}`
    : '';

  const prompt = `You are an expert interview coach. Based on the following candidate profile, generate exactly 6 interview questions for the role of "${role}".

CANDIDATE PROFILE:
- Skills: ${parsedResume.skills?.join(', ') || 'Not specified'}
- Experience: ${parsedResume.experience?.map(e => `${e.title} at ${e.company} (${e.duration})`).join('; ') || 'Not specified'}
- Education: ${parsedResume.education?.map(e => `${e.degree} from ${e.institution}`).join('; ') || 'Not specified'}
- Summary: ${parsedResume.summary || 'Not specified'}
${jobContext}

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
    let text = await generateText(prompt);
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
    console.error('OpenAI generateQuestions error:', error);
    // Fallback: return static generic questions so interview doesn't break
    console.warn('Using static fallback questions due to AI failure.');
    return [
      { text: `Describe your experience working as a ${role}. What have been your key responsibilities?`, type: 'behavioral', difficulty: 'medium' },
      { text: `What technical skills do you consider your strongest for this ${role} position?`, type: 'technical', difficulty: 'medium' },
      { text: 'Tell me about a challenging project you worked on. How did you overcome the obstacles?', type: 'behavioral', difficulty: 'medium' },
      { text: `If you were to start a new project as a ${role}, how would you approach the initial architecture and planning?`, type: 'situational', difficulty: 'medium' },
      { text: 'Where do you see yourself professionally in the next 3-5 years?', type: 'HR', difficulty: 'easy' },
      { text: 'How do you stay current with industry trends and new technologies in your field?', type: 'technical', difficulty: 'easy' }
    ];
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
    let text = await generateText(prompt);
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
    console.error('OpenAI evaluateAnswer error:', error);
    throw new Error('Failed to evaluate answer. Please try again.');
  }
}

/**
 * Parse resume raw text into structured data using AI
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
    let text = await generateText(prompt);
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
    console.error('OpenAI parseResume error:', error);
    throw new Error('Failed to parse resume with AI. Please try again.');
  }
}

/**
 * Analyze resume against ATS criteria and optional job description
 */
async function analyzeATSWithAI(resumeText, jobDescription = '') {
  const jobContext = jobDescription
    ? `\nTARGET JOB DESCRIPTION:\n"""\n${jobDescription.substring(0, 3000)}\n"""\n`
    : '';

  const prompt = `You are an expert Applicant Tracking System (ATS) and professional resume reviewer.
Analyze the following resume text and evaluate its ATS compatibility, formatting, and content strength.
If a Job Description is provided below, compare the resume to the job description and evaluate how well the candidate matches the requirements, highlighting key matching and missing keywords/skills.

RESUME TEXT:
"""
${resumeText.substring(0, 8000)}
"""
${jobContext}

Perform a rigorous ATS scan and evaluation. Return ONLY a valid JSON object with the following structure (do not include any markdown backticks, prefix text, or conversational text - it must parse directly as JSON):
{
  "score": 78,
  "breakdown": {
    "formatting": 85,
    "keywords": 70,
    "impact": 80
  },
  "improvements": [
    {
      "category": "Formatting & Structure",
      "issue": "Brief description of the problem",
      "suggestion": "Detailed, specific, actionable suggestion on how to fix this issue."
    }
  ],
  "matchedKeywords": ["react", "javascript"],
  "missingKeywords": ["aws", "typescript"]
}

Ensure the feedback is highly detailed, realistic, and specific to the provided text. If no Job Description is provided, evaluate the resume based on general best practices for technical roles. Each category of improvement must be one of: "Formatting & Structure", "Keywords & Optimization", "Experience Impact".`;

  try {
    let text = await generateText(prompt);
    const startIndex = text.indexOf('{');
    const endIndex = text.lastIndexOf('}');
    if (startIndex !== -1 && endIndex !== -1) {
      text = text.substring(startIndex, endIndex + 1);
    }

    const evaluation = JSON.parse(text);
    return evaluation;
  } catch (error) {
    if (error.status === 429) {
      throw new Error('API Quota Exceeded. Please try again soon.');
    }
    console.error('OpenAI analyzeATS error:', error);
    return {
      score: 65,
      breakdown: { formatting: 70, keywords: 60, impact: 65 },
      improvements: [
        {
          category: 'Formatting & Structure',
          issue: 'Resume lacks detail or structure due to parsing fallback.',
          suggestion: 'Ensure your resume uses standard section headings (Experience, Skills, Education) and clear bullet points.'
        },
        {
          category: 'Keywords & Optimization',
          issue: 'Unable to perform full keyword match with AI currently.',
          suggestion: 'Tailor your resume skills and experience bullets to match terms used in your target job description.'
        }
      ],
      matchedKeywords: [],
      missingKeywords: []
    };
  }
}

module.exports = { generateQuestions, evaluateAnswer, parseResumeWithAI, analyzeATSWithAI };
