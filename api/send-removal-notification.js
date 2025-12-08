// ============================================
// FILE: api/send-removal-notification.js
// ============================================
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

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

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { recipientEmail, volunteerName, reason, ngoName } = req.body;

  if (!recipientEmail || !volunteerName || !reason || !ngoName) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  try {
    const data = await resend.emails.send({
      from: 'Centro App <notifications@centrophilippines.online>',
      to: [recipientEmail],
      subject: `Organization Registration Update - ${ngoName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f9; padding: 20px; line-height: 1.6; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; padding: 40px 30px; text-align: center; }
            .header h1 { margin: 0 0 10px 0; font-size: 28px; font-weight: 600; }
            .header p { margin: 0; font-size: 14px; opacity: 0.9; }
            .content { padding: 40px 30px; color: #1f2937; }
            .greeting { font-size: 16px; margin-bottom: 20px; }
            .message { font-size: 15px; margin-bottom: 20px; color: #4b5563; }
            .reason-box { background: #fef2f2; border-left: 5px solid #dc2626; padding: 20px; margin: 25px 0; border-radius: 6px; }
            .reason-title { color: #dc2626; font-weight: 600; font-size: 15px; margin-bottom: 12px; display: flex; align-items: center; }
            .reason-title::before { content: '⚠'; margin-right: 8px; font-size: 18px; }
            .reason-text { color: #374151; font-size: 14px; line-height: 1.6; padding: 12px; background: white; border-radius: 4px; white-space: pre-wrap; word-wrap: break-word; }
            .info-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 15px; margin: 20px 0; }
            .info-box p { font-size: 14px; color: #166534; margin: 0; }
            .signature { margin-top: 35px; padding-top: 25px; border-top: 2px solid #e5e7eb; }
            .signature p { margin: 5px 0; font-size: 15px; }
            .ngo-name { color: #059669; font-weight: 600; }
            .footer { background: #f9fafb; padding: 25px 30px; text-align: center; border-top: 1px solid #e5e7eb; }
            .footer p { font-size: 13px; color: #6b7280; margin: 8px 0; }
            .footer-icon { font-size: 20px; margin-bottom: 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Centro App</h1>
              <p>Volunteer Registration Update</p>
            </div>
            <div class="content">
              <div class="greeting">Dear <strong>${volunteerName}</strong>,</div>
              <p class="message">We hope this message finds you well. We are writing to inform you that your volunteer registration with <strong>${ngoName}</strong> has been removed in our system.</p>
              <div class="reason-box">
                <div class="reason-title">Reason for Removal Status</div>
                <div class="reason-text">${reason}</div>
              </div>
              <p class="message">We sincerely appreciate the time, dedication, and effort you have contributed to our organization.</p>
              <div class="info-box">
                <p><strong>Have questions or concerns?</strong><br>If you would like to discuss this decision, please feel free to reach out to the ${ngoName} administration team.</p>
              </div>
              <p class="message">Thank you for your understanding and cooperation.</p>
              <div class="signature">
                <p>Best regards,</p>
                <p class="ngo-name">${ngoName}</p>
                <p style="color: #6b7280; font-size: 14px;">Administration Team</p>
              </div>
            </div>
            <div class="footer">
              <div class="footer-icon">📧</div>
              <p><strong>This is an automated notification from Centro App</strong></p>
              <p>Please do not reply to this email.</p>
              <p style="margin-top: 15px;">&copy; ${new Date().getFullYear()} Centro App. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    });

    res.status(200).json({ success: true, message: 'Email sent successfully', id: data.id });
  } catch (error) {
    console.error('Resend Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};