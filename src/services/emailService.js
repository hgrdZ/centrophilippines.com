// api/send-reject-event.js
import { Resend } from 'resend';

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  // 1. Handle CORS (Keep your existing CORS logic here)
  const allowedOrigins = [
    'https://centrophilippines.online',
    'https://www.centrophilippines.online',
    'http://localhost:3000'
  ];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { recipientEmail, volunteerName, eventTitle, ngoName, reason } = req.body;

  try {
    const data = await resend.emails.send({
      // IMPORTANT: You must verify your domain on Resend to use a custom email.
      // For testing, use: 'onboarding@resend.dev'
      from: 'Centro App <notifications@centrophilippines.online>', 
      to: [recipientEmail],
      subject: `Application Update - ${eventTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
          <body>
            <p>Dear ${volunteerName},</p>
            <p>Regarding ${eventTitle}...</p>
            </body>
        </html>
      `,
    });

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Resend Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}