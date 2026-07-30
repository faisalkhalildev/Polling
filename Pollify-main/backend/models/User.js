const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: { type: String, required: true, minlength: 6, select: false },
    profileImage: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
    },
    bio: { type: String, default: "", maxlength: 200 },

    savedPolls: [{ type: mongoose.Schema.Types.ObjectId, ref: "Poll" }],
    likedPolls: [{ type: mongoose.Schema.Types.ObjectId, ref: "Poll" }],

    // OTP based password reset
    resetOTP: { type: String, select: false },
    resetOTPExpiry: { type: Date, select: false },
    resetOTPVerified: { type: Boolean, default: false, select: false },
    lastOTPSentAt: { type: Date, select: false },
    otpRequestCount: { type: Number, default: 0, select: false },
  },
  { timestamps: true }
);

userSchema.virtual("createdPollsCount", {
  ref: "Poll",
  localField: "_id",
  foreignField: "creator",
  count: true,
});

userSchema.set("toJSON", { virtuals: true });
userSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("User", userSchema);
