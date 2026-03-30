const { Resend } = require('resend');

// ── Resend client — uses HTTPS, works on Render free tier ──
const resend = new Resend(process.env.RESEND_API_KEY);

if (!process.env.RESEND_API_KEY) {
  console.warn('⚠️  RESEND_API_KEY not set — emails will only be logged to console');
} else {
  console.log('✅ Resend email service ready');
}

// ─────────────────────────────────────
// Generate 6-digit OTP
// ─────────────────────────────────────
const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

// ─────────────────────────────────────
// Send OTP email
// ─────────────────────────────────────
const sendOTPEmail = async ({ to, name, otp, type = 'verify' }) => {
  const subjects = {
    verify: 'Verify your MentorBridge account',
    reset:  'Reset your MentorBridge password',
  };

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8"/>
      <style>
        body { font-family: 'Segoe UI', sans-serif; background: #0a0a0f; color: #f0f0f5; margin: 0; padding: 0; }
        .wrapper { max-width: 520px; margin: 40px auto; background: #161622; border: 1px solid #2a2a38; border-radius: 16px; overflow: hidden; }
        .header  { background: linear-gradient(135deg, #6c63ff, #00d4aa); padding: 32px; text-align: center; }
        .header h1 { color: white; font-size: 24px; margin: 0; letter-spacing: -0.5px; }
        .header p  { color: rgba(255,255,255,0.8); margin: 6px 0 0; font-size: 14px; }
        .body    { padding: 32px; }
        .body p  { color: #8888a0; font-size: 15px; line-height: 1.7; margin: 0 0 20px; }
        .otp-box { background: #1c1c2a; border: 2px solid #6c63ff; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0; }
        .otp     { font-size: 42px; font-weight: 800; letter-spacing: 12px; color: #6c63ff; font-family: monospace; }
        .otp-sub { font-size: 13px; color: #555568; margin-top: 8px; }
        .warning { background: rgba(255,184,48,0.1); border: 1px solid rgba(255,184,48,0.3); border-radius: 8px; padding: 12px 16px; font-size: 13px; color: #ffb830; margin-top: 20px; }
        .footer  { padding: 20px 32px; border-top: 1px solid #2a2a38; text-align: center; font-size: 12px; color: #555568; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="header">
          <h1>⬡ MentorBridge</h1>
          <p>${type === 'verify' ? 'Email Verification' : 'Password Reset'}</p>
        </div>
        <div class="body">
          <p>Hi <strong style="color:#f0f0f5">${name}</strong>,</p>
          <p>${type === 'verify'
            ? 'Thanks for signing up! Use the code below to verify your email address and activate your account.'
            : 'You requested a password reset. Use the code below to proceed.'
          }</p>
          <div class="otp-box">
            <div class="otp">${otp}</div>
            <div class="otp-sub">Enter this code on the verification page</div>
          </div>
          <div class="warning">
            ⏱ This code expires in <strong>10 minutes</strong>. Do not share it with anyone.
          </div>
        </div>
        <div class="footer">
          © 2025 MentorBridge · If you didn't request this, ignore this email.
        </div>
      </div>
    </body>
    </html>
  `;

  // No API key — log to console for local dev
  if (!process.env.RESEND_API_KEY) {
    console.log('\n─────────────────────────────────────');
    console.log(`📧 OTP for ${to}: ${otp}`);
    console.log('─────────────────────────────────────\n');
    return { success: true };
  }

  try {
    const { data, error } = await resend.emails.send({
      from:    'MentorBridge <onboarding@resend.dev>', // use this until you add your domain
      to,
      subject: subjects[type] || subjects.verify,
      html,
    });

    if (error) {
      console.error(`❌ Resend error:`, error);
      throw new Error(error.message || 'Failed to send email');
    }

    console.log(`✅ OTP email sent to ${to} — id: ${data.id}`);
    return { success: true, id: data.id };

  } catch (err) {
    console.error(`❌ Failed to send OTP email to ${to}:`, err.message);
    throw new Error('Failed to send verification email. Please try again.');
  }
};

// ─────────────────────────────────────
// Send mentor verification result email
// ─────────────────────────────────────
const sendVerificationResultEmail = async ({ to, name, approved }) => {
  if (!process.env.RESEND_API_KEY) {
    console.log(`📧 Verification ${approved ? 'APPROVED' : 'REJECTED'} email → ${to}`);
    return { success: true };
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', sans-serif; background: #0a0a0f; color: #f0f0f5; margin: 0; padding: 0; }
        .wrapper { max-width: 520px; margin: 40px auto; background: #161622; border: 1px solid #2a2a38; border-radius: 16px; overflow: hidden; }
        .header  { background: ${approved ? 'linear-gradient(135deg,#00d4aa,#6c63ff)' : 'linear-gradient(135deg,#ff6b6b,#ffb830)'}; padding: 32px; text-align: center; }
        .header h1 { color: white; font-size: 22px; margin: 0; }
        .body    { padding: 32px; }
        .body p  { color: #8888a0; font-size: 15px; line-height: 1.7; }
        .badge   { display: inline-block; background: ${approved ? 'rgba(0,212,170,.15)' : 'rgba(255,107,107,.15)'}; color: ${approved ? '#00d4aa' : '#ff6b6b'}; border: 1px solid ${approved ? 'rgba(0,212,170,.4)' : 'rgba(255,107,107,.4)'}; padding: 8px 20px; border-radius: 99px; font-weight: 700; font-size: 15px; margin: 16px 0; }
        .footer  { padding: 20px 32px; border-top: 1px solid #2a2a38; text-align: center; font-size: 12px; color: #555568; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="header"><h1>⬡ MentorBridge · Verification Update</h1></div>
        <div class="body">
          <p>Hi <strong style="color:#f0f0f5">${name}</strong>,</p>
          ${approved
            ? `<p>Great news! Your mentor profile has been <strong style="color:#00d4aa">verified</strong>.</p>
               <div class="badge">✓ Verified Mentor</div>
               <p>Your profile will now appear with a verified badge and rank higher in search results.</p>`
            : `<p>After reviewing your submission, we were unable to verify your mentor profile at this time.</p>
               <div class="badge">✗ Not Approved</div>
               <p>Please update your LinkedIn URL, company details, and bio, then resubmit.</p>`
          }
        </div>
        <div class="footer">© 2025 MentorBridge</div>
      </div>
    </body>
    </html>
  `;

  await resend.emails.send({
    from:    'MentorBridge <onboarding@resend.dev>',
    to,
    subject: approved ? '🎉 Your MentorBridge profile is verified!' : 'MentorBridge verification update',
    html,
  });

  return { success: true };
};

module.exports = { generateOTP, sendOTPEmail, sendVerificationResultEmail };