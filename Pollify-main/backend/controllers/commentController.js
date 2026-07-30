const Comment = require("../models/Comment");
const Poll = require("../models/Poll");
const Notification = require("../models/Notification");

// @route GET /api/polls/:id/comments
const getComments = async (req, res, next) => {
  try {
    const comments = await Comment.find({ poll: req.params.id })
      .populate("user", "name username profileImage")
      .sort({ createdAt: 1 });
    res.json({ success: true, comments });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/polls/:id/comments
const addComment = async (req, res, next) => {
  try {
    const { text, parentCommentId } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: "Comment cannot be empty" });
    }

    const poll = await Poll.findById(req.params.id);
    if (!poll) return res.status(404).json({ success: false, message: "Poll not found" });
    if (!poll.allowComments) {
      return res.status(403).json({ success: false, message: "Comments are disabled on this poll" });
    }

    let parentComment = null;
    if (parentCommentId) {
      parentComment = await Comment.findOne({ _id: parentCommentId, poll: poll._id });
      if (!parentComment) {
        return res.status(404).json({ success: false, message: "Comment you are replying to was not found" });
      }
    }

    const comment = await Comment.create({
      user: req.user._id,
      poll: poll._id,
      text: text.trim(),
      parentComment: parentComment?._id || null,
    });

    poll.commentsCount += 1;
    await poll.save();

    const recipient = parentComment ? parentComment.user : poll.creator;
    if (recipient.toString() !== req.user._id.toString()) {
      const isReply = Boolean(parentComment);
      await Notification.create({
        recipient,
        sender: req.user._id,
        type: isReply ? "reply" : "comment",
        poll: poll._id,
        commentText: text.trim(),
        message: isReply
          ? `${req.user.name} replied to your comment on "${poll.question}"`
          : `${req.user.name} commented on your poll "${poll.question}"`,
      });
    }

    const populated = await comment.populate("user", "name username profileImage");
    res.status(201).json({ success: true, comment: populated });
  } catch (error) {
    next(error);
  }
};

// @route DELETE /api/comments/:id
const deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ success: false, message: "Comment not found" });

    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "You can only delete your own comments" });
    }

    const deleted = await Comment.deleteMany({
      $or: [{ _id: comment._id }, { parentComment: comment._id }],
    });
    await Poll.findByIdAndUpdate(comment.poll, { $inc: { commentsCount: -deleted.deletedCount } });

    res.json({ success: true, message: "Comment deleted" });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/comments/:id/like (toggle)
const toggleCommentLike = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ success: false, message: "Comment not found" });

    const userId = req.user._id.toString();
    const alreadyLiked = comment.likes.some((id) => id.toString() === userId);

    if (alreadyLiked) {
      comment.likes = comment.likes.filter((id) => id.toString() !== userId);
    } else {
      comment.likes.push(req.user._id);
    }
    await comment.save();

    res.json({ success: true, liked: !alreadyLiked, likesCount: comment.likes.length });
  } catch (error) {
    next(error);
  }
};

module.exports = { getComments, addComment, deleteComment, toggleCommentLike };
