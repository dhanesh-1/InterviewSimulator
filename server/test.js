const { parseResumeWithAI } = require('./services/gemini');

async function test() {
  try {
    const res = await parseResumeWithAI("John Doe - Software Engineer with 5 years of React and Node.js experience.");
    console.log(res);
  } catch (err) {
    console.error("Test failed:", err);
  }
}

test();
