const Poll = require("../models/Poll");
const User = require("../models/User");
const Notification = require("../models/Notification");

// @route POST /api/polls/:id/like  (toggles)
const toggleLike = async (req, res, next) => {
  try {
    const poll = await Poll.findById(req.params.id);
    if (!poll) return res.status(404).json({ success: false, message: "Poll not found" });

    const userId = req.user._id.toString();
    const alreadyLiked = poll.likes.some((id) => id.toString() === userId);

    if (alreadyLiked) {
      poll.likes = poll.likes.filter((id) => id.toString() !== userId);
      await User.findByIdAndUpdate(req.user._id, { $pull: { likedPolls: poll._id } });
    } else {
      poll.likes.push(req.user._id);
      await User.findByIdAndUpdate(req.user._id, { $addToSet: { likedPolls: poll._id } });

      if (poll.creator.toString() !== userId) {
        await Notification.create({
          recipient: poll.creator,
          sender: req.user._id,
          type: "like",
          poll: poll._id,
          message: `${req.user.name} liked your poll "${poll.question}"`,
        });
      }
    }

    await poll.save();
    res.json({ success: true, liked: !alreadyLiked, likesCount: poll.likes.length });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/polls/:id/save (toggles)
const toggleSave = async (req, res, next) => {
  try {
    const poll = await Poll.findById(req.params.id);
    if (!poll) return res.status(404).json({ success: false, message: "Poll not found" });

    const user = await User.findById(req.user._id);
    const alreadySaved = user.savedPolls.some((id) => id.toString() === poll._id.toString());

    if (alreadySaved) {
      user.savedPolls = user.savedPolls.filter((id) => id.toString() !== poll._id.toString());
    } else {
      user.savedPolls.push(poll._id);
    }
    await user.save();

    res.json({ success: true, saved: !alreadySaved });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/polls/:id/share  (logs a share "event" - returns shareable link)
const sharePoll = async (req, res, next) => {
  try {
    const poll = await Poll.findById(req.params.id);
    if (!poll) return res.status(404).json({ success: false, message: "Poll not found" });

    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const link = `${clientUrl}/poll/${poll._id}`;

    res.json({ success: true, link });
  } catch (error) {
    next(error);
  }
};

module.exports = { toggleLike, toggleSave, sharePoll };
