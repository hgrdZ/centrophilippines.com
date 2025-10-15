// ============================================
// FILE 3: api/send-reject-org.js
// ============================================
const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER || 'centrophilippines.cpo@gmail.com',
      pass: process.env.EMAIL_PASSWORD || 'kzwv bwsq lgku hauw'
    }
  });
};

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { recipientEmail, volunteerName, reason, ngoName } = req.body;

  // Validate required fields
  if (!recipientEmail || !volunteerName || !reason || !ngoName) {
    return res.status(400).json({ 
      success: false, 
      error: 'Missing required fields',
      details: {
        recipientEmail: !!recipientEmail,
        volunteerName: !!volunteerName,
        reason: !!reason,
        ngoName: !!ngoName
      }
    });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(recipientEmail)) {
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid email format' 
    });
  }

  const transporter = createTransporter();

  const mailOptions = {
    from: '"Centro App" <centrophilippines.cpo@gmail.com>',
    to: recipientEmail,
    subject: `Volunteer Application Update - ${ngoName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            background-color: #f4f7f9; 
            padding: 20px; 
            line-height: 1.6;
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background: white; 
            border-radius: 12px; 
            overflow: hidden; 
            box-shadow: 0 4px 12px rgba(0,0,0,0.1); 
          }
          .header { 
            background: linear-gradient(135deg, #b91c1c 0%, #991b1b 100%); 
            color: white; 
            padding: 40px 30px; 
            text-align: center; 
          }
          .header h1 { 
            margin: 0 0 10px 0; 
            font-size: 28px; 
            font-weight: 600; 
          }
          .header p { 
            margin: 0; 
            font-size: 14px; 
            opacity: 0.9; 
          }
          .content { 
            padding: 40px 30px; 
            color: #1f2937; 
          }
          .greeting { 
            font-size: 16px; 
            margin-bottom: 20px; 
          }
          .message { 
            font-size: 15px; 
            margin-bottom: 20px; 
            color: #4b5563; 
          }
          .reason-box { 
            background: #fef2f2; 
            border-left: 5px solid #dc2626; 
            padding: 20px; 
            margin: 25px 0; 
            border-radius: 6px; 
          }
          .reason-title { 
            color: #dc2626; 
            font-weight: 600; 
            font-size: 15px; 
            margin-bottom: 12px; 
            display: flex;
            align-items: center;
          }
          .reason-title::before {
            content: '⚠';
            margin-right: 8px;
            font-size: 18px;
          }
          .reason-text { 
            color: #374151; 
            font-size: 14px; 
            line-height: 1.6; 
            padding: 12px; 
            background: white; 
            border-radius: 4px;
            white-space: pre-wrap;
            word-wrap: break-word;
          }
          .signature { 
            margin-top: 35px; 
            padding-top: 25px; 
            border-top: 2px solid #e5e7eb; 
          }
          .signature p { 
            margin: 5px 0; 
            font-size: 15px; 
          }
          .ngo-name { 
            color: #b91c1c; 
            font-weight: 600; 
          }
          .footer { 
            background: #f9fafb; 
            padding: 25px 30px; 
            text-align: center; 
            border-top: 1px solid #e5e7eb;
          }
          .footer p { 
            font-size: 13px; 
            color: #6b7280; 
            margin: 8px 0; 
          }
          .footer-icon {
            font-size: 20px;
            margin-bottom: 10px;
          }
          @media only screen and (max-width: 600px) {
            .container { margin: 0; border-radius: 0; }
            .content, .header, .footer { padding: 25px 20px; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Centro App</h1>
            <p>Volunteer Application Update</p>
          </div>
          
          <div class="content">
            <div class="greeting">
              Dear <strong>${volunteerName}</strong>,
            </div>
            
            <p class="message">
              We hope this message finds you well. We are writing to inform you that your volunteer application with <strong>${ngoName}</strong> has been rejected.
            </p>
            
            <div class="reason-box">
              <div class="reason-title">Reason for Rejection</div>
              <div class="reason-text">${reason}</div>
            </div>
            
            <p class="message">
              We sincerely appreciate your interest in joining our organization. After careful consideration, we regret to inform you that we will not be moving forward with your application at this time. 
              We encourage you to apply again in the future and wish you the best in your endeavors.
            </p>
            
            <div class="signature">
              <p>Best regards,</p>
              <p class="ngo-name">${ngoName}</p>
              <p style="color: #6b7280; font-size: 14px;">Administration Team</p>
            </div>
          </div>
          
          <div class="footer">
            <div class="footer-icon">📧</div>
            <p><strong>This is an automated message from Centro App</strong></p>
            <p>Please do not reply to this email.</p>
            <p style="margin-top: 15px;">&copy; ${new Date().getFullYear()} Centro App. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    console.log(`📧 Attempting to send organization rejection email to: ${recipientEmail}`);
    
    const info = await transporter.sendMail(mailOptions);
    
    console.log(`✓ Rejection email sent successfully!`);
    console.log(`  → Recipient: ${recipientEmail}`);
    console.log(`  → Message ID: ${info.messageId}`);
    console.log(`  → NGO: ${ngoName}`);
    
    res.json({ 
      success: true, 
      message: 'Email sent successfully',
      messageId: info.messageId,
      recipient: recipientEmail
    });
  } catch (error) {
    console.error(`✗ Error sending email to ${recipientEmail}:`, error.message);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to send email',
      details: error.message 
    });
  }
};
