const express = require("express");
const { deleteComment, toggleCommentLike } = require("../controllers/commentController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.delete("/:id", protect, deleteComment);
router.post("/:id/like", protect, toggleCommentLike);

module.exports = router;
