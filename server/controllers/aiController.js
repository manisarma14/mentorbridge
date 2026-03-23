const OpenAI  = require('openai');
const User    = require('../models/User');
const Roadmap = require('../models/Roadmap');

let openai;
const getOpenAI = () => {
  if (!openai) openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return openai;
};

// @desc  AI-powered "anything search" — detect intent, return mentors + roadmap + resources
// @route POST /api/ai/search
const aiSearch = async (req, res, next) => {
  try {
    const { query } = req.body;
    if (!query?.trim()) { res.status(400); throw new Error('Query is required'); }

    const client = getOpenAI();

    // 1. Analyze intent with GPT
    const analysisResponse = await client.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{
        role: 'system',
        content: `You are a career guidance AI. Analyze the user query and return ONLY valid JSON (no markdown) with this structure:
{
  "intent": "string (e.g. Career Transition, Skill Development, Job Search)",
  "skills": ["array", "of", "relevant", "skills"],
  "goals": ["array", "of", "career", "goals"],
  "roadmap": [
    { "step": "Step title", "description": "Brief description", "resources": [{"title":"Resource name","url":"https://example.com","type":"course|book|article"}] }
  ],
  "summary": "One sentence summary of the advice"
}`
      }, {
        role: 'user',
        content: query,
      }],
      max_tokens: 1000,
      temperature: 0.7,
    });

    let aiData;
    try {
      const raw = analysisResponse.choices[0].message.content;
      aiData = JSON.parse(raw.replace(/```json|```/g, '').trim());
    } catch {
      aiData = {
        intent: 'Career Development',
        skills: [],
        goals:  [],
        roadmap: [],
        summary: 'Here are some recommendations based on your query.',
      };
    }

    // 2. Find matching mentors from DB
    const skillQuery = aiData.skills.length
      ? { role: 'mentor', skills: { $in: aiData.skills } }
      : { role: 'mentor' };

    const mentors = await User.find(skillQuery)
      .select('-password -notifications')
      .sort('-rating')
      .limit(4);

    res.json({
      success: true,
      query,
      analysis: aiData,
      mentors,
    });
  } catch (err) {
    // Graceful fallback if OpenAI fails / key not set
    if (err.message?.includes('API key') || err.status === 401) {
      return res.json({
        success: true,
        query: req.body.query,
        analysis: {
          intent: 'Career Development',
          skills: ['System Design', 'DSA', 'React', 'Node.js'],
          goals:  ['Get a job at a top tech company'],
          roadmap: [
            { step: 'Master DSA', description: 'Study arrays, trees, graphs, dynamic programming', resources: [{ title: 'LeetCode', url: 'https://leetcode.com', type: 'platform' }] },
            { step: 'System Design', description: 'Learn scalable system architecture', resources: [{ title: 'System Design Primer', url: 'https://github.com/donnemartin/system-design-primer', type: 'article' }] },
            { step: 'Build Projects', description: 'Create 2-3 impressive portfolio projects', resources: [] },
            { step: 'Apply & Interview', description: 'Practice mock interviews and apply', resources: [] },
          ],
          summary: 'Focus on data structures, system design, and building strong projects.',
        },
        mentors: [],
        _demo: true,
      });
    }
    next(err);
  }
};

// @desc  Generate AI roadmap and save to DB
// @route POST /api/ai/roadmap
const generateRoadmap = async (req, res, next) => {
  try {
    const { goal } = req.body;
    if (!goal?.trim()) { res.status(400); throw new Error('Goal is required'); }

    const client = getOpenAI();

    const response = await client.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{
        role: 'system',
        content: `Create a detailed career roadmap. Return ONLY valid JSON:
{
  "title": "Roadmap title",
  "steps": [
    { "title": "Step title", "description": "What to do", "resources": [{"title":"Name","url":"https://example.com","type":"course|book|article|platform"}] }
  ]
}`
      }, {
        role: 'user',
        content: `Create a roadmap for: ${goal}`,
      }],
      max_tokens: 1200,
      temperature: 0.7,
    });

    let roadmapData;
    try {
      const raw = response.choices[0].message.content;
      roadmapData = JSON.parse(raw.replace(/```json|```/g, '').trim());
    } catch {
      throw new Error('Failed to parse AI response');
    }

    // Save to DB
    const roadmap = await Roadmap.create({
      user:         req.user._id,
      title:        roadmapData.title || goal,
      goal,
      aiGenerated:  true,
      steps:        roadmapData.steps.map((s, i) => ({ ...s, order: i, isCompleted: false })),
    });

    res.status(201).json({ success: true, roadmap });
  } catch (err) { next(err); }
};

// @desc  AI chat assistant
// @route POST /api/ai/chat
const aiChat = async (req, res, next) => {
  try {
    const { message, history = [] } = req.body;
    if (!message?.trim()) { res.status(400); throw new Error('Message is required'); }

    const client = getOpenAI();

    const messages = [
      {
        role: 'system',
        content: `You are MentorBridge AI, a helpful career guidance assistant. You help users with career advice, interview preparation, skill development, and connecting with mentors. Be concise, actionable, and encouraging. The user's name is ${req.user.name} and their role is ${req.user.role}.`,
      },
      ...history.slice(-10).map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: message },
    ];

    const response = await client.chat.completions.create({
      model:       'gpt-3.5-turbo',
      messages,
      max_tokens:  500,
      temperature: 0.7,
    });

    const reply = response.choices[0].message.content;
    res.json({ success: true, reply });
  } catch (err) {
    if (err.message?.includes('API key') || err.status === 401) {
      return res.json({
        success: true,
        reply: "I'm your AI career assistant! To use the AI chat feature, please configure your OpenAI API key in the server .env file. In the meantime, I recommend checking out the mentor discovery page to find experts who can help you directly.",
        _demo: true,
      });
    }
    next(err);
  }
};

// @desc  Get user roadmaps
// @route GET /api/ai/roadmaps
const getRoadmaps = async (req, res, next) => {
  try {
    const roadmaps = await Roadmap.find({ user: req.user._id }).sort('-createdAt');
    res.json({ success: true, roadmaps });
  } catch (err) { next(err); }
};

// @desc  Update roadmap step
// @route PUT /api/ai/roadmaps/:id/steps/:stepId
const updateStep = async (req, res, next) => {
  try {
    const roadmap = await Roadmap.findOne({ _id: req.params.id, user: req.user._id });
    if (!roadmap) { res.status(404); throw new Error('Roadmap not found'); }

    const step = roadmap.steps.id(req.params.stepId);
    if (!step) { res.status(404); throw new Error('Step not found'); }

    step.isCompleted = req.body.isCompleted;
    if (req.body.isCompleted) step.completedAt = new Date();

    roadmap.computeProgress();
    await roadmap.save();

    res.json({ success: true, roadmap });
  } catch (err) { next(err); }
};

module.exports = { aiSearch, generateRoadmap, aiChat, getRoadmaps, updateStep };
