const mongoose = require("mongoose");

const optionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true },
    votes: { type: Number, default: 0 },
  },
  { _id: true }
);

const pollSchema = new mongoose.Schema(
  {
    creator: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    question: { type: String, required: true, trim: true, maxlength: 300 },
    description: { type: String, default: "", maxlength: 1000 },
    type: {
      type: String,
      enum: ["single", "multiple"],
      default: "single",
    },
    options: {
      type: [optionSchema],
      validate: {
        validator: (arr) => arr.length >= 2,
        message: "A poll must have at least 2 options",
      },
    },
    category: {
      type: String,
      enum: [
        "Technology",
        "Education",
        "Entertainment",
        "Sports",
        "Politics",
        "Business",
        "Lifestyle",
        "Gaming",
        "Science",
        "General",
      ],
      default: "General",
    },
    tags: [{ type: String, trim: true, lowercase: true }],
    image: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
    },
    expiresAt: { type: Date, default: null },
    allowComments: { type: Boolean, default: true },
    allowAnonymous: { type: Boolean, default: true },

    totalVotes: { type: Number, default: 0 },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    commentsCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

pollSchema.index({ question: "text", description: "text", tags: "text" });

pollSchema.virtual("isExpired").get(function () {
  return this.expiresAt ? new Date() > this.expiresAt : false;
});

// Return a stable count with every poll response. This avoids relying on the
// client to calculate a count from an ObjectId array.
pollSchema.virtual("likesCount").get(function () {
  return this.likes?.length || 0;
});

pollSchema.set("toJSON", { virtuals: true });
pollSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Poll", pollSchema);
