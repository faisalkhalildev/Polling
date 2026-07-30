const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");
const fs = require("fs");
const path = require("path");

const hasCloudinaryCredentials = [
  process.env.CLOUDINARY_CLOUD_NAME,
  process.env.CLOUDINARY_API_KEY,
  process.env.CLOUDINARY_API_SECRET,
].every((value) => value && !value.startsWith("your_"));

const storage = hasCloudinaryCredentials
  ? new CloudinaryStorage({
      cloudinary,
      params: {
        folder: "poll-app",
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
        transformation: [{ width: 1000, crop: "limit" }],
      },
    })
  : multer.diskStorage({
      destination: (req, file, cb) => {
        const uploadDirectory = path.join(__dirname, "..", "uploads");
        fs.mkdirSync(uploadDirectory, { recursive: true });
        cb(null, uploadDirectory);
      },
      filename: (req, file, cb) => {
        const extension = path.extname(file.originalname).toLowerCase();
        cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`);
      },
    });

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) return cb(null, true);
    cb(new Error("Only JPG, PNG, and WebP images are allowed"));
  },
});

module.exports = upload;
