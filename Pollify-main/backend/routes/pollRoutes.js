const express = require("express");
const { getPolls, getPollById, createPoll, updatePoll, deletePoll } = require("../controllers/pollController");
const { castVote, getPollResults } = require("../controllers/voteController");
const { toggleLike, toggleSave, sharePoll } = require("../controllers/interactionController");
const { getComments, addComment } = require("../controllers/commentController");
const { protect, optionalAuth } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

router.get("/", optionalAuth, getPolls);
router.get("/:id", optionalAuth, getPollById);
router.post("/", protect, upload.single("image"), createPoll);
router.put("/:id", protect, upload.single("image"), updatePoll);
router.delete("/:id", protect, deletePoll);

router.post("/:id/vote", protect, castVote);
router.get("/:id/results", getPollResults);

router.post("/:id/like", protect, toggleLike);
router.post("/:id/save", protect, toggleSave);
router.post("/:id/share", sharePoll);

router.get("/:id/comments", getComments);
router.post("/:id/comments", protect, addComment);

module.exports = router;
