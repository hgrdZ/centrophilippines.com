// api/send-reject-org.js (at lahat ng iba pang api files)
const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER || 'centrophilippines.cpo@gmail.com',
      pass: process.env.EMAIL_PASSWORD
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
          .footer { 
            background: #f9fafb; 
            padding: 25px 30px; 
            text-align: center; 
            border-top: 1px solid #e5e7eb;
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
              We are writing to inform you that your volunteer application with <strong>${ngoName}</strong> has been rejected.
            </p>
            
            <div class="reason-box">
              <div class="reason-title">Reason for Rejection</div>
              <div class="reason-text">${reason}</div>
            </div>
            
            <p class="message">
              We encourage you to apply again in the future.
            </p>
            
            <div class="signature">
              <p>Best regards,</p>
              <p><strong>${ngoName}</strong></p>
            </div>
          </div>
          
          <div class="footer">
            <p><strong>This is an automated message from Centro App</strong></p>
            <p>&copy; ${new Date().getFullYear()} Centro App. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    console.log(`📧 Sending email to: ${recipientEmail}`);
    
    const info = await transporter.sendMail(mailOptions);
    
    console.log(`✓ Email sent! Message ID: ${info.messageId}`);
    
    res.status(200).json({ 
      success: true, 
      message: 'Email sent successfully',
      messageId: info.messageId,
      recipient: recipientEmail
    });
  } catch (error) {
    console.error(`✗ Email error:`, error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to send email',
      details: error.message 
    });
  }
};