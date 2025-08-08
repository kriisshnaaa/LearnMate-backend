// learnmate/server/routes/openai.js
const express = require('express');
const router = express.Router();
const { CohereClient } = require('cohere-ai');
require('dotenv').config();

// Initialize Cohere client with error handling
let cohere;
try {
  if (!process.env.COHERE_API_KEY) {
    console.warn('⚠️  COHERE_API_KEY not found in environment variables');
  } else {
    cohere = new CohereClient({ token: process.env.COHERE_API_KEY });
    console.log('✅ Cohere client initialized successfully');
  }
} catch (error) {
  console.error('❌ Failed to initialize Cohere client:', error);
}

router.post('/roadmap', async (req, res) => {
  const { topic, duration } = req.body;

  // Check if Cohere client is initialized
  if (!cohere) {
    return res.status(500).json({ 
      message: 'Cohere client not initialized. Check if COHERE_API_KEY is set in environment variables.' 
    });
  }

  try {
    const prompt = `Generate 3 different learning roadmaps to master "${topic}" within "${duration}" with proper time slots management. 
Each roadmap should be separated by a comma and the result should not contain something like "here are the roadmaps" the result should be straaight forward.`;

    const response = await cohere.generate({
      model: 'command-r-plus',
      prompt,
      maxTokens: 1200,
      temperature: 0.7,
    });

    const rawText = response.generations[0]?.text ?? '';
    console.log('✅ Raw Cohere Response:', rawText);

    // Now split roadmaps by top-level commas (only 3 expected items)
    const roadmaps = rawText
      .split(/(?<=\d\.)[^0-9]*,/g) // Try smart split by commas *after* steps
      .map((item) => item.trim())
      .filter(Boolean);
    console.log(roadmaps);
    
    res.json({ roadmaps });
  } catch (err) {
    console.error('❌ Cohere API error:', err);
    res.status(500).json({ message: 'Error generating roadmap.' });
  }
});

// New chat endpoint
router.post('/chat', async (req, res) => {
  const { question, roadmapContext } = req.body;

  // Check if Cohere client is initialized
  if (!cohere) {
    return res.status(500).json({ 
      message: 'Cohere client not initialized. Check if COHERE_API_KEY is set in environment variables.' 
    });
  }

  try {
    // Create context for the AI
    const context = roadmapContext && roadmapContext.length > 0 
      ? `Here is the learning roadmap context: ${roadmapContext.join('\n\n')}`
      : 'No specific roadmap context provided.';

    const prompt = `You are an AI learning assistant. ${context}
    
A user has asked: "${question}"

Please provide a helpful and detailed response based on the learning roadmap context if available. If the question is unrelated to the roadmap, still provide a helpful response about learning and education.`;

    const response = await cohere.generate({
      model: 'command-r-plus',
      prompt,
      maxTokens: 500,
      temperature: 0.7,
    });

    const answer = response.generations[0]?.text ?? 'Sorry, I could not generate a response.';

    res.json({ answer });
  } catch (err) {
    console.error('❌ Cohere API error:', err);
    res.status(500).json({ message: 'Error processing your question.' });
  }
});

module.exports = router;
