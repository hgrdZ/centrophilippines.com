// ============================================
// FILE: frontend/src/services/emailService.js
// ============================================
import { API_ENDPOINTS } from '../config/api';

export const emailService = {
  async sendRejectEvent(data) {
    try {
      const response = await fetch(API_ENDPOINTS.SEND_REJECT_EVENT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error sending rejection email:', error);
      throw error;
    }
  },

  async sendRejectOrg(data) {
    try {
      const response = await fetch(API_ENDPOINTS.SEND_REJECT_ORG, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error sending org rejection email:', error);
      throw error;
    }
  },

  async sendRemovalNotification(data) {
    try {
      const response = await fetch(API_ENDPOINTS.SEND_REMOVAL_NOTIFICATION, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error sending removal notification:', error);
      throw error;
    }
  }
};