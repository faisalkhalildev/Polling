const nodemailer = require("nodemailer");

const sendEmail = async ({ to, subject, html }) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });

  await transporter.sendMail({
    from: `"PollHub" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
};

const otpEmailTemplate = (name, otp) => `
  <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; border: 1px solid #d1fae5; border-radius: 12px; overflow: hidden;">
    <div style="background: #059669; padding: 24px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0;">PollHub</h1>
    </div>
    <div style="padding: 24px; background: #ffffff;">
      <p>Hi ${name},</p>
      <p>Use the OTP below to reset your password. This code expires in 10 minutes.</p>
      <div style="text-align: center; margin: 24px 0;">
        <span style="font-size: 32px; letter-spacing: 8px; font-weight: bold; color: #059669;">${otp}</span>
      </div>
      <p style="color: #6b7280; font-size: 13px;">If you didn't request this, you can safely ignore this email.</p>
    </div>
  </div>
`;

module.exports = { sendEmail, otpEmailTemplate };
