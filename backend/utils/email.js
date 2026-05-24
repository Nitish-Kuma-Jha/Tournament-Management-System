const nodemailer = require('nodemailer');
const logger = require('../config/logger');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const emailTemplates = {
  verification: (name, otp) => ({
    subject: 'Verify Your Email - Tournament System',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #e2e8f0; padding: 40px; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #f59e0b; font-size: 28px; margin: 0;">🏆 Tournament System</h1>
        </div>
        <h2 style="color: #f1f5f9; font-size: 22px;">Hello ${name}!</h2>
        <p style="color: #94a3b8; line-height: 1.6;">Your email verification OTP is:</p>
        <div style="background: #1e293b; border: 2px solid #f59e0b; border-radius: 8px; padding: 24px; text-align: center; margin: 24px 0;">
          <span style="font-size: 48px; font-weight: bold; color: #f59e0b; letter-spacing: 12px;">${otp}</span>
        </div>
        <p style="color: #94a3b8;">This OTP expires in <strong style="color: #f59e0b;">10 minutes</strong>.</p>
        <p style="color: #64748b; font-size: 12px; margin-top: 32px;">If you didn't request this, please ignore this email.</p>
      </div>
    `,
  }),

  welcome: (name) => ({
    subject: 'Welcome to Tournament System!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #e2e8f0; padding: 40px; border-radius: 12px;">
        <h1 style="color: #f59e0b;">🎉 Welcome, ${name}!</h1>
        <p style="color: #94a3b8; line-height: 1.6;">Your account has been verified and approved. You can now participate in tournaments!</p>
        <a href="${process.env.CLIENT_URL}/dashboard" style="background: #f59e0b; color: #000; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block; margin-top: 16px;">Go to Dashboard</a>
      </div>
    `,
  }),

  passwordReset: (name, otp) => ({
    subject: 'Password Reset OTP - Tournament System',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #e2e8f0; padding: 40px; border-radius: 12px;">
        <h1 style="color: #f59e0b;">🔐 Password Reset</h1>
        <p style="color: #94a3b8;">Hello ${name}, your password reset OTP is:</p>
        <div style="background: #1e293b; border: 2px solid #ef4444; border-radius: 8px; padding: 24px; text-align: center; margin: 24px 0;">
          <span style="font-size: 48px; font-weight: bold; color: #ef4444; letter-spacing: 12px;">${otp}</span>
        </div>
        <p style="color: #94a3b8;">Expires in <strong style="color: #ef4444;">10 minutes</strong>.</p>
      </div>
    `,
  }),

  registrationApproved: (name, tournamentTitle) => ({
    subject: `Registration Approved - ${tournamentTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #e2e8f0; padding: 40px; border-radius: 12px;">
        <h1 style="color: #22c55e;">✅ Registration Approved!</h1>
        <p style="color: #94a3b8;">Hi ${name}, your team's registration for <strong style="color: #f59e0b;">${tournamentTitle}</strong> has been approved!</p>
        <a href="${process.env.CLIENT_URL}/dashboard" style="background: #22c55e; color: #000; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block; margin-top: 16px;">View Tournament</a>
      </div>
    `,
  }),
};

exports.sendEmail = async ({ to, subject, html }) => {
  try {
    const transporter = createTransporter();
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
    });
    logger.info(`Email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    logger.error(`Email send failed: ${error.message}`);
    throw error;
  }
};

exports.sendVerificationEmail = async (user, otp) => {
  const { subject, html } = emailTemplates.verification(user.name, otp);
  return exports.sendEmail({ to: user.email, subject, html });
};

exports.sendWelcomeEmail = async (user) => {
  const { subject, html } = emailTemplates.welcome(user.name);
  return exports.sendEmail({ to: user.email, subject, html });
};

exports.sendPasswordResetEmail = async (user, otp) => {
  const { subject, html } = emailTemplates.passwordReset(user.name, otp);
  return exports.sendEmail({ to: user.email, subject, html });
};

exports.sendRegistrationApprovedEmail = async (user, tournamentTitle) => {
  const { subject, html } = emailTemplates.registrationApproved(user.name, tournamentTitle);
  return exports.sendEmail({ to: user.email, subject, html });
};
