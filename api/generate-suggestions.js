// ============================================
// FILE: api/generate-suggestions.js
// Updated with proximity-based scoring
// ============================================
const OpenAI = require('openai');

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

module.exports = async (req, res) => {
  // ✅ CORS HEADERS
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

    // Build the enhanced prompt for OpenAI with proximity-based scoring
    const prompt = `
      As an AI assistant for volunteer management, analyze the following volunteer and event information to provide PROXIMITY-BASED deployment suggestions with weighted scoring:

      VOLUNTEER INFORMATION:
      - Name: ${volunteerData.firstname} ${volunteerData.lastname}
      - Days Available: ${volunteerData.days_available || "Not specified"}
      - Time Availability: ${volunteerData.time_availability || "Not specified"}
      - Busy Hours: ${volunteerData.busy_hours || "Not specified"}
      - Preferred Volunteering Types: ${volunteerData.preferred_volunteering || "Not specified"}
      - Location: ${volunteerData.location || "Not specified"}

      EVENT INFORMATION:
      - Event ID: ${eventData.event_id}
      - Event Title: ${eventData.event_title}
      - Event Date: ${eventData.date}
      - Event Time: ${eventData.time_start} - ${eventData.time_end}
      - Call Time: ${eventData.call_time || "Not specified"}
      - Event Location: ${eventData.location}
      - Event Objectives: ${eventData.event_objectives}
      - Description: ${eventData.description}
      - Volunteer Limit: ${eventData.volunteers_limit}
      - Volunteering Opportunities: ${eventData.volunteer_opportunities}

      CRITICAL WEIGHTED SCORING SYSTEM (Total: 100%):
      
      1. TIME AVAILABILITY MATCH (50% weight - HIGHEST PRIORITY):
         - Calculate exact overlap between volunteer's time availability and event time (including call time)
         - If NO overlap: Score = 0% (AUTOMATICALLY DISQUALIFY)
         - If partial overlap: Score = (overlapping hours / total event hours) × 50%
         - If complete overlap: Score = 50%
         - If volunteer's busy hours conflict with event time: Reduce this score by 50%
         - If volunteer's available days do NOT include event date/day: Score = 0% (DISQUALIFY)

      2. PROXIMITY/LOCATION MATCH (30% weight - SECOND PRIORITY):
         - Compare volunteer location with event location
         - Same city/municipality: Score = 30%
         - Same province/region: Score = 20%
         - Nearby areas (adjacent cities): Score = 15%
         - Different regions: Score = 5%
         - Location not specified: Score = 10% (default neutral)

      3. VOLUNTEERING TYPE MATCH (15% weight - THIRD PRIORITY):
         - Compare preferred volunteering types with event's volunteering opportunities
         - Strong match (2+ matching types): Score = 15%
         - Moderate match (1 matching type): Score = 10%
         - Weak match (related but not exact): Score = 5%
         - No match: Score = 0%

      4. DAY/DATE AVAILABILITY (5% weight - FOURTH PRIORITY):
         - Volunteer's available days match event date: Score = 5%
         - Days not specified but no conflicts: Score = 3%
         - Days do NOT match event date: Score = 0% (DISQUALIFY ENTIRE APPLICATION)

      MATCHING RULES:
      - DAY/DATE compatibility is MANDATORY - if volunteer is not available on event date, TOTAL SCORE = 0%
      - TIME overlap is MANDATORY - if there's NO time overlap, TOTAL SCORE = 0-10%
      - Calculate TOTAL COMPATIBILITY SCORE by adding all weighted scores
      - Provide individual scores for transparency (timeOverlapScore, proximityScore, skillMatchScore, dayMatchScore)
      - FINAL SCORE must be realistic and strict - only recommend volunteers with 60%+ compatibility

      OUTPUT FORMAT (JSON):
      {
        "recommendedTimeSlot": "exact overlapping time range OR 'No suitable time overlap' if none",
        "duration": "actual overlapping hours in format 'X hours' OR '0 hours' if no overlap",
        "matchingVolunteerTypes": ["array of matching volunteering types from preferences"],
        "compatibilityScore": "0-100 total score as string",
        "timeOverlapScore": "0-50 score as string",
        "proximityScore": "0-30 score as string", 
        "skillMatchScore": "0-15 score as string",
        "dayMatchScore": "0-5 score as string",
        "reasoning": "detailed explanation including: time overlap calculation, distance/proximity analysis, skill matching rationale, and day availability confirmation. Include actual scores for each factor."
      }

      IMPORTANT NOTES:
      - Be STRICT with scoring - don't inflate compatibility scores
      - If time availability doesn't overlap with event time (including call time), set compatibilityScore to 0-10%
      - If location is far (different regions), reduce proximityScore significantly
      - If days available don't match event date, set all scores to 0
      - Reasoning should explain each scoring factor clearly
      - Only suggest deployment if compatibilityScore ≥ 60%
    `;

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an expert volunteer management AI that provides STRICT PROXIMITY-BASED deployment suggestions. You prioritize: (1) TIME AVAILABILITY - 50%, (2) LOCATION PROXIMITY - 30%, (3) SKILL MATCH - 15%, (4) DAY AVAILABILITY - 5%. You must be strict and realistic with scoring. Only recommend volunteers with high compatibility (60%+). Provide detailed breakdown of scores for transparency.",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 600,
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