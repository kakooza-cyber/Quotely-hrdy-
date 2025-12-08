// netlify/functions/send-newsletter.js
const nodemailer = require('nodemailer');
const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { email, name } = JSON.parse(event.body);
  
  // Initialize Supabase
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY // Use service role for admin operations
  );

  try {
    // 1. Store in database
    const { error: dbError } = await supabase
      .from('newsletter_subscribers')
      .insert({ email, name });
    
    if (dbError) throw dbError;

    // 2. Send welcome email
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Welcome to Quotely-hardy Newsletter!',
      html: `
        <h1>Welcome ${name}!</h1>
        <p>Thank you for subscribing to our daily quotes newsletter.</p>
        <p>You'll start receiving inspiring quotes tomorrow morning.</p>
      `
    };

    await transporter.sendMail(mailOptions);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
