const mongoose = require("mongoose");
const Poll = require("../models/Poll");
const Vote = require("../models/Vote");
const Notification = require("../models/Notification");

// @route POST /api/polls/:id/vote
const castVote = async (req, res, next) => {
  try {
    const { optionIds } = req.body; // array of option _ids selected
    const poll = await Poll.findById(req.params.id);

    if (!poll) return res.status(404).json({ success: false, message: "Poll not found" });
    if (poll.isExpired || (poll.expiresAt && new Date() > poll.expiresAt)) {
      return res.status(400).json({ success: false, message: "This poll has expired" });
    }
    if (!Array.isArray(optionIds) || optionIds.length === 0) {
      return res.status(400).json({ success: false, message: "Select at least one option" });
    }
    if (poll.type === "single" && optionIds.length > 1) {
      return res.status(400).json({ success: false, message: "This poll only allows a single choice" });
    }

    const existingVote = await Vote.findOne({ poll: poll._id, user: req.user._id });
    if (existingVote) {
      return res.status(400).json({ success: false, message: "You have already voted on this poll" });
    }

    const validIds = poll.options.map((o) => o._id.toString());
    const allValid = optionIds.every((id) => validIds.includes(id));
    if (!allValid) {
      return res.status(400).json({ success: false, message: "Invalid option selected" });
    }

    await Vote.create({
      user: req.user._id,
      poll: poll._id,
      selectedOptions: optionIds,
    });

    optionIds.forEach((id) => {
      const opt = poll.options.id(id);
      if (opt) opt.votes += 1;
    });
    poll.totalVotes += 1;
    await poll.save();

    // Notify poll creator (skip self-votes) + milestone check
    if (poll.creator.toString() !== req.user._id.toString()) {
      await Notification.create({
        recipient: poll.creator,
        sender: req.user._id,
        type: "vote",
        poll: poll._id,
        message: `${req.user.name} voted on your poll "${poll.question}"`,
      });
    }
    const milestones = [10, 50, 100, 500, 1000];
    if (milestones.includes(poll.totalVotes)) {
      await Notification.create({
        recipient: poll.creator,
        type: "milestone",
        poll: poll._id,
        message: `Your poll "${poll.question}" just reached ${poll.totalVotes} votes! 🎉`,
      });
    }

    res.json({ success: true, message: "Your vote has been counted!", poll });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: "You have already voted on this poll" });
    }
    next(error);
  }
};

// @route GET /api/polls/:id/results
const getPollResults = async (req, res, next) => {
  try {
    const poll = await Poll.findById(req.params.id);
    if (!poll) return res.status(404).json({ success: false, message: "Poll not found" });

    const totalVotes = poll.totalVotes || 0;
    const options = poll.options.map((opt) => ({
      _id: opt._id,
      text: opt.text,
      votes: opt.votes,
      percentage: totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 1000) / 10 : 0,
    }));

    const mostPopular = options.reduce(
      (max, opt) => (opt.votes > (max?.votes || -1) ? opt : max),
      null
    );

    // Voting activity over time (votes grouped by day)
    const timeline = await Vote.aggregate([
      { $match: { poll: new mongoose.Types.ObjectId(poll._id) } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const participants = await Vote.countDocuments({ poll: poll._id });

    res.json({
      success: true,
      results: {
        totalVotes,
        totalParticipants: participants,
        options,
        mostPopular,
        timeline: timeline.map((t) => ({ date: t._id, votes: t.count })),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { castVote, getPollResults };
