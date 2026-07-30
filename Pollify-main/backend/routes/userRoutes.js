const express = require("express");
const {
  getUserProfile,
  updateProfile,
  getVotingHistory,
  getSavedPolls,
  getParticipatedPolls,
} = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

router.get("/history", protect, getVotingHistory);
router.get("/saved", protect, getSavedPolls);
router.get("/participated", protect, getParticipatedPolls);
router.put("/profile", protect, upload.single("profileImage"), updateProfile);
router.get("/:id", getUserProfile);

module.exports = router;
