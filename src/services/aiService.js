// ============================================
// FILE: frontend/src/services/aiService.js
// ============================================
import { API_ENDPOINTS } from '../config/api';

export const aiService = {
  async generateSuggestions(volunteerData, eventData) {
    try {
      const response = await fetch(API_ENDPOINTS.GENERATE_SUGGESTIONS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          volunteerData,
          eventData
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      // Parse the JSON response from OpenAI
      if (result.success && result.suggestions) {
        try {
          // Remove markdown code blocks if present
          const cleanJson = result.suggestions
            .replace(/```json\n?/g, '')
            .replace(/```\n?/g, '')
            .trim();
          
          return JSON.parse(cleanJson);
        } catch (parseError) {
          console.error('Error parsing AI response:', parseError);
          return result.suggestions; // Return as string if parsing fails
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error generating AI suggestions:', error);
      throw error;
    }
  }
};