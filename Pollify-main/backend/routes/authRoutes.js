const express = require("express");
const rateLimit = require("express-rate-limit");
const {
  register,
  login,
  getMe,
  forgotPassword,
  verifyOTP,
  resetPassword,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: "Too many requests, please try again later." },
});

router.post("/register", upload.single("profileImage"), register);
router.post("/login", login);
router.get("/me", protect, getMe);
router.post("/forgot-password", otpLimiter, forgotPassword);
router.post("/verify-otp", otpLimiter, verifyOTP);
router.post("/reset-password", resetPassword);

module.exports = router;
