// ============================================
// FILE 2: api/send-reject-event.js
// ============================================
const nodemailer = require('nodemailer');

// Create transporter (initialized per request in serverless)
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

  const { recipientEmail, volunteerName, eventTitle, ngoName, reason } = req.body;

  // Validate required fields
  if (!recipientEmail || !volunteerName || !eventTitle || !ngoName || !reason) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields',
      details: {
        recipientEmail: !!recipientEmail,
        volunteerName: !!volunteerName,
        eventTitle: !!eventTitle,
        ngoName: !!ngoName,
        reason: !!reason
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
    from: `"${ngoName} - Centro App" <centrophilippines.cpo@gmail.com>`,
    to: recipientEmail,
    subject: `Application Update - ${eventTitle}`,
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
            background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0 0 10px 0;
            font-size: 26px;
            font-weight: 600;
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
            color: #059669;
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
          @media only screen and (max-width: 600px) {
            .container { margin: 0; border-radius: 0; }
            .content, .header, .footer { padding: 25px 20px; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${ngoName}</h1>
            <p>Event Application Status</p>
          </div>

          <div class="content">
            <div class="greeting">
              Dear <strong>${volunteerName}</strong>,
            </div>

            <p class="message">
              Thank you for your interest in joining the event <strong>${eventTitle}</strong> organized by <strong>${ngoName}</strong>.
              After a careful review of your application, we regret to inform you that your participation request has been <strong>rejected</strong> at this time.
            </p>

            <div class="reason-box">
              <div class="reason-title">Reason for Rejection</div>
              <div class="reason-text">${reason}</div>
            </div>

            <p class="message">
              We appreciate your enthusiasm and your willingness to contribute as a volunteer.
              Please know that this decision does not reflect negatively on your abilities or potential.
              You are always welcome to apply for future events or opportunities within our organization.
            </p>

            <div class="signature">
              <p>Best regards,</p>
              <p class="ngo-name">${ngoName}</p>
              <p style="color: #6b7280; font-size: 14px;">Administration Team</p>
            </div>
          </div>

          <div class="footer">
            <p><strong>This is an automated message from Centro App.</strong></p>
            <p>Please do not reply directly to this email.</p>
            <p style="margin-top: 15px;">&copy; ${new Date().getFullYear()} Centro App. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    console.log(`📧 Attempting to send event rejection email to: ${recipientEmail}`);

    const info = await transporter.sendMail(mailOptions);

    console.log(`✓ Event rejection email sent successfully!`);
    console.log(`  → Recipient: ${recipientEmail}`);
    console.log(`  → Volunteer: ${volunteerName}`);
    console.log(`  → Event: ${eventTitle}`);
    console.log(`  → NGO: ${ngoName}`);

    res.json({
      success: true,
      message: 'Event rejection email sent successfully',
      messageId: info.messageId,
      recipient: recipientEmail
    });
  } catch (error) {
    console.error(`✗ Error sending email to ${recipientEmail}:`);
    console.error(`  → Error: ${error.message}`);

    res.status(500).json({
      success: false,
      error: 'Failed to send event rejection email',
      details: error.message
    });
  }
};