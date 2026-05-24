const User = require('../models/User');
const AppError = require('../utils/AppError');
const { generateAccessToken, generateRefreshToken, generateOTP } = require('../utils/jwt');
const { sendVerificationEmail, sendWelcomeEmail, sendPasswordResetEmail } = require('../utils/email');
const { createAuditLog } = require('../utils/auditLog');
const { createNotification } = require('../services/notificationService');
const jwt = require('jsonwebtoken');

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password, role]
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               password: { type: string }
 *               role: { type: string, enum: [user, organizer] }
 *     responses:
 *       201:
 *         description: Registration successful
 */
exports.register = async (req, res, next) => {
  const { name, email, password, phone, role = 'user' } = req.body;

  if (!['user', 'organizer'].includes(role)) {
    return next(new AppError('Invalid role. Must be user or organizer.', 400));
  }

  const existing = await User.findOne({ email }).setOptions({ includeDeleted: true });
  if (existing) return next(new AppError('Email already registered', 409));

  const otp = generateOTP();
  const otpExpire = new Date(Date.now() + 10 * 60 * 1000);

  const user = await User.create({
    name,
    email,
    password,
    phone,
    role,
    status: 'pending',
    otpCode: otp,
    otpExpire,
  });

  try {
    await sendVerificationEmail(user, otp);
  } catch (err) {
    await User.findByIdAndDelete(user._id);
    return next(new AppError('Failed to send verification email. Please try again.', 500));
  }

  await createAuditLog({
    actor: user._id,
    actorRole: user.role,
    action: 'USER_REGISTERED',
    resource: 'User',
    resourceId: user._id,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  res.status(201).json({
    success: true,
    message: 'Registration successful. Please verify your email with the OTP sent.',
    data: { userId: user._id, email: user.email },
  });
};

exports.verifyEmail = async (req, res, next) => {
  const { userId, otp } = req.body;

  const user = await User.findById(userId).select('+otpCode +otpExpire');
  if (!user) return next(new AppError('User not found', 404));
  if (user.emailVerified) return next(new AppError('Email already verified', 400));
  if (!user.otpCode || user.otpCode !== otp) return next(new AppError('Invalid OTP', 400));
  if (user.otpExpire < new Date()) return next(new AppError('OTP expired. Please request a new one.', 400));

  user.emailVerified = true;
  user.otpCode = undefined;
  user.otpExpire = undefined;
  await user.save();

  await sendWelcomeEmail(user);

  res.json({ success: true, message: 'Email verified successfully. Your account is pending admin approval.' });
};

exports.resendOTP = async (req, res, next) => {
  const { email } = req.body;
  const user = await User.findOne({ email }).select('+otpCode +otpExpire');
  if (!user) return next(new AppError('User not found', 404));
  if (user.emailVerified) return next(new AppError('Email already verified', 400));

  const otp = generateOTP();
  user.otpCode = otp;
  user.otpExpire = new Date(Date.now() + 10 * 60 * 1000);
  await user.save();

  await sendVerificationEmail(user, otp);

  res.json({ success: true, message: 'OTP resent successfully.' });
};

exports.login = async (req, res, next) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password +refreshTokens +loginAttempts +lockUntil');
  if (!user) return next(new AppError('Invalid email or password', 401));

  if (user.isLocked) return next(new AppError('Account temporarily locked due to multiple failed attempts. Try again in 2 hours.', 423));

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    await user.incrementLoginAttempts();
    return next(new AppError('Invalid email or password', 401));
  }

  if (!user.emailVerified) return next(new AppError('Please verify your email first', 403));
  if (user.status === 'pending') return next(new AppError('Your account is pending admin approval.', 403));
  if (user.status === 'suspended') return next(new AppError('Your account has been suspended. Contact support.', 403));

  // Reset login attempts
  user.loginAttempts = 0;
  user.lockUntil = undefined;
  user.lastLogin = new Date();

  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id, user.role);

  // Store refresh token (keep last 5)
  user.refreshTokens = [...(user.refreshTokens || []).slice(-4), refreshToken];
  await user.save();

  await createAuditLog({
    actor: user._id,
    actorRole: user.role,
    action: 'USER_LOGIN',
    resource: 'User',
    resourceId: user._id,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      accessToken,
      refreshToken,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        avatar: user.avatar,
        emailVerified: user.emailVerified,
      },
    },
  });
};

exports.refreshToken = async (req, res, next) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return next(new AppError('Refresh token required', 400));

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch {
    return next(new AppError('Invalid or expired refresh token', 401));
  }

  const user = await User.findById(decoded.id).select('+refreshTokens');
  if (!user) return next(new AppError('User not found', 404));

  if (!user.refreshTokens.includes(refreshToken)) {
    // Token reuse detected - invalidate all tokens
    user.refreshTokens = [];
    await user.save();
    return next(new AppError('Token reuse detected. Please login again.', 401));
  }

  const newAccessToken = generateAccessToken(user._id, user.role);
  const newRefreshToken = generateRefreshToken(user._id, user.role);

  user.refreshTokens = user.refreshTokens.filter(t => t !== refreshToken);
  user.refreshTokens.push(newRefreshToken);
  await user.save();

  res.json({
    success: true,
    data: { accessToken: newAccessToken, refreshToken: newRefreshToken },
  });
};

exports.logout = async (req, res, next) => {
  const { refreshToken } = req.body;
  const user = await User.findById(req.user._id).select('+refreshTokens');

  if (refreshToken && user) {
    user.refreshTokens = (user.refreshTokens || []).filter(t => t !== refreshToken);
    await user.save();
  }

  res.json({ success: true, message: 'Logged out successfully' });
};

exports.forgotPassword = async (req, res, next) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return next(new AppError('No account with that email', 404));

  const otp = generateOTP();
  user.otpCode = otp;
  user.otpExpire = new Date(Date.now() + 10 * 60 * 1000);
  await user.save();

  await sendPasswordResetEmail(user, otp);

  res.json({ success: true, message: 'Password reset OTP sent to your email.' });
};

exports.resetPassword = async (req, res, next) => {
  const { email, otp, newPassword } = req.body;

  const user = await User.findOne({ email }).select('+otpCode +otpExpire +refreshTokens');
  if (!user) return next(new AppError('User not found', 404));
  if (!user.otpCode || user.otpCode !== otp) return next(new AppError('Invalid OTP', 400));
  if (user.otpExpire < new Date()) return next(new AppError('OTP expired', 400));

  user.password = newPassword;
  user.otpCode = undefined;
  user.otpExpire = undefined;
  user.refreshTokens = []; // Invalidate all sessions
  await user.save();

  res.json({ success: true, message: 'Password reset successfully. Please login.' });
};

exports.getMe = async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json({ success: true, data: { user } });
};

exports.changePassword = async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) return next(new AppError('Current password is incorrect', 400));

  user.password = newPassword;
  await user.save();

  res.json({ success: true, message: 'Password changed successfully' });
};
