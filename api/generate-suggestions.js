// ============================================
// FILE 1: api/generate-suggestions.js
// ============================================
const OpenAI = require('openai');

// Initialize OpenAI (Vercel automatically loads env vars)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

module.exports = async (req, res) => {
  // ✅ CORS HEADERS - VERY IMPORTANT!
  const allowedOrigins = [
    'https://centrophilippines.online',
    'https://www.centrophilippines.online',
    'http://localhost:3000',
    'http://localhost:5000'
  ];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT,DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  // ✅ Handle OPTIONS request (preflight)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // ✅ Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false,
      error: 'Method not allowed' 
    });
  }

  try {
    const { volunteerData, eventData } = req.body;

    // Validate input
    if (!volunteerData || !eventData) {
      return res.status(400).json({ 
        error: 'Missing required data: volunteerData and eventData are required' 
      });
    }

    // Build the prompt for OpenAI
    const prompt = `
      As an AI assistant for volunteer management, analyze the following volunteer and event information to provide STRICT time-based deployment suggestions:

      VOLUNTEER INFORMATION:
      - Name: ${volunteerData.firstname} ${volunteerData.lastname}
      - Days Available: ${volunteerData.days_available || "Not specified"}
      - Time Availability: ${volunteerData.time_availability || "Not specified"}
      - Busy Hours: ${volunteerData.busy_hours || "Not specified"}
      - Preferred Volunteering Types: ${volunteerData.preferred_volunteering || "Not specified"}

      EVENT INFORMATION:
      - Event ID: ${eventData.event_id}
      - Event: ${eventData.event_title}
      - Date: ${eventData.date}
      - Event Time: ${eventData.time_start} - ${eventData.time_end}
      - Volunteer Limit: ${eventData.volunteers_limit}
      - Objectives: ${eventData.event_objectives}
      - Description: ${eventData.description}
      - Location: ${eventData.location}
      - Volunteer Opportunities: ${eventData.volunteer_opportunities}

      CRITICAL MATCHING RULES:
      1. TIME COMPATIBILITY IS MANDATORY - The volunteer's "Time Availability" MUST overlap with the event time
      2. If there's NO time overlap between volunteer availability and event schedule, set compatibilityScore to 0-20%
      3. If there's partial overlap, calculate the exact overlapping hours and recommend only that timeframe
      4. If volunteer's busy hours conflict with the overlapping time, reduce compatibility significantly
      5. Day availability must match the event date
      6. If there's NO match in volunteering opportunities and preferred volunteering, reduce compatibilityScore by 35%

      Please provide suggestions in the following JSON format:
      {
        "recommendedTimeSlot": "exact overlapping time range OR 'No suitable time overlap' if none",
        "duration": "actual overlapping hours OR '0 hours' if no overlap",
        "matchingVolunteerTypes": ["matching types from preferences"],
        "compatibilityScore": "0-100 based on ACTUAL time overlap and skill match",
        "reasoning": "explain time overlap calculation and why this score was given"
      }

      Be STRICT - no recommendations for volunteers with zero time overlap.
    `;

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an expert volunteer management AI that provides STRICT time-based deployment suggestions. Prioritize TIME COMPATIBILITY above all else. Only recommend volunteers whose availability actually overlaps with event times.",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 500,
      temperature: 0.3,
    });

    // Extract the AI response
    const suggestionText = response.choices[0].message.content;

    // Return the suggestions
    res.status(200).json({
      success: true,
      suggestions: suggestionText
    });

  } catch (error) {
    console.error('Error generating AI suggestions:', error);
    
    // Handle specific OpenAI errors
    if (error.response) {
      return res.status(error.response.status).json({
        error: 'OpenAI API error',
        message: error.response.data?.error?.message || 'Failed to generate suggestions'
      });
    }

    // Handle other errors
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to generate AI suggestions. Please try again later.'
    });
  }
};
