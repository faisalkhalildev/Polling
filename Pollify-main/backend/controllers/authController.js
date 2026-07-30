const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const generateOTP = require("../utils/generateOTP");
const { sendEmail, otpEmailTemplate } = require("../utils/sendEmail");

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

const sanitizeUser = (user) => ({
  _id: user._id,
  name: user.name,
  username: user.username,
  email: user.email,
  bio: user.bio,
  profileImage: user.profileImage,
  createdAt: user.createdAt,
});

// @route POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { name, username, email, password, confirmPassword } = req.body;

    if (!name || !username || !email || !password || !confirmPassword) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: "Passwords do not match" });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
    }

    const existing = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }],
    });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: existing.email === email.toLowerCase() ? "Email already registered" : "Username already taken",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let profileImage = { url: "", publicId: "" };
    if (req.file) {
      profileImage = {
        url: req.file.path.startsWith("http")
          ? req.file.path
          : `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`,
        publicId: req.file.filename,
      };
    }

    const user = await User.create({
      name,
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password: hashedPassword,
      profileImage,
    });

    const token = generateToken(user._id);
    res.status(201).json({ success: true, token, user: sanitizeUser(user) });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const token = generateToken(user._id);
    res.json({ success: true, token, user: sanitizeUser(user) });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/auth/me
const getMe = async (req, res, next) => {
  try {
    res.json({ success: true, user: sanitizeUser(req.user) });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/auth/forgot-password
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase() }).select(
      "+resetOTP +resetOTPExpiry +lastOTPSentAt +otpRequestCount"
    );

    if (!user) {
      return res.status(404).json({ success: false, message: "No account found with this email" });
    }

    // Rate limiting: max 5 requests per hour, and 60s cooldown between sends
    const now = Date.now();
    if (user.lastOTPSentAt && now - user.lastOTPSentAt.getTime() < 60 * 1000) {
      return res.status(429).json({ success: false, message: "Please wait before requesting another OTP" });
    }

    const hourAgo = now - 60 * 60 * 1000;
    if (user.lastOTPSentAt && user.lastOTPSentAt.getTime() > hourAgo && user.otpRequestCount >= 5) {
      return res.status(429).json({ success: false, message: "Too many OTP requests. Try again later." });
    }

    const otp = generateOTP();
    const hashedOTP = await bcrypt.hash(otp, 10);

    user.resetOTP = hashedOTP;
    user.resetOTPExpiry = new Date(now + 10 * 60 * 1000); // 10 minutes
    user.resetOTPVerified = false;
    user.lastOTPSentAt = new Date(now);
    user.otpRequestCount =
      user.lastOTPSentAt && user.lastOTPSentAt.getTime() > hourAgo ? (user.otpRequestCount || 0) + 1 : 1;
    await user.save();

    try {
      await sendEmail({
        to: user.email,
        subject: "Your PollHub password reset OTP",
        html: otpEmailTemplate(user.name, otp),
      });
    } catch (emailErr) {
      console.error("Email send failed:", emailErr.message);
      if (process.env.NODE_ENV === "production") {
        return res.status(500).json({ success: false, message: "Failed to send OTP email. Try again later." });
      }

      // Local development may not have SMTP access. Keep the reset flow testable
      // without exposing an OTP in production responses.
      return res.json({
        success: true,
        message: "Email delivery is unavailable. Use the development OTP shown below.",
        developmentOTP: otp,
      });
    }

    res.json({ success: true, message: "OTP sent to your email" });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/auth/verify-otp
const verifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase() }).select(
      "+resetOTP +resetOTPExpiry"
    );

    if (!user || !user.resetOTP || !user.resetOTPExpiry) {
      return res.status(400).json({ success: false, message: "No OTP request found. Please request a new one." });
    }

    if (Date.now() > user.resetOTPExpiry.getTime()) {
      return res.status(400).json({ success: false, message: "OTP has expired. Please request a new one." });
    }

    const isMatch = await bcrypt.compare(otp, user.resetOTP);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    user.resetOTPVerified = true;
    await user.save();

    res.json({ success: true, message: "OTP verified successfully" });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/auth/reset-password
const resetPassword = async (req, res, next) => {
  try {
    const { email, password, confirmPassword } = req.body;

    if (!password || password !== confirmPassword) {
      return res.status(400).json({ success: false, message: "Passwords do not match" });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
    }

    const user = await User.findOne({ email: email?.toLowerCase() }).select(
      "+resetOTP +resetOTPExpiry +resetOTPVerified"
    );

    if (!user || !user.resetOTPVerified) {
      return res.status(400).json({ success: false, message: "OTP not verified. Please verify OTP first." });
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetOTP = undefined;
    user.resetOTPExpiry = undefined;
    user.resetOTPVerified = false;
    await user.save();

    res.json({ success: true, message: "Password reset successful. You can now log in." });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getMe, forgotPassword, verifyOTP, resetPassword };
