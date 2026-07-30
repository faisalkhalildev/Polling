const crypto = require("crypto");

// Generates a secure 6-digit numeric OTP
const generateOTP = () => {
  const otp = crypto.randomInt(100000, 999999).toString();
  return otp;
};

module.exports = generateOTP;
