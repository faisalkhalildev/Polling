const User = require("../models/User");
const Poll = require("../models/Poll");
const Vote = require("../models/Vote");

// @route GET /api/users/:id
const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const [createdPolls, totalVotesReceived, votesCount] = await Promise.all([
      Poll.find({ creator: user._id }).sort({ createdAt: -1 }),
      Poll.aggregate([
        { $match: { creator: user._id } },
        { $group: { _id: null, total: { $sum: "$totalVotes" } } },
      ]),
      Vote.countDocuments({ user: user._id }),
    ]);

    const totalLikes = createdPolls.reduce((sum, p) => sum + p.likes.length, 0);

    res.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
        bio: user.bio,
        profileImage: user.profileImage,
        createdAt: user.createdAt,
      },
      stats: {
        totalPolls: createdPolls.length,
        totalVotesReceived: totalVotesReceived[0]?.total || 0,
        totalVotesCast: votesCount,
        totalLikes,
      },
      createdPolls,
    });
  } catch (error) {
    next(error);
  }
};

// @route PUT /api/users/profile
const updateProfile = async (req, res, next) => {
  try {
    const { name, username, bio } = req.body;
    const user = await User.findById(req.user._id);

    if (username && username.toLowerCase() !== user.username) {
      const taken = await User.findOne({ username: username.toLowerCase() });
      if (taken) return res.status(400).json({ success: false, message: "Username already taken" });
      user.username = username.toLowerCase();
    }

    if (name) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (req.file) {
      user.profileImage = {
        url: req.file.path.startsWith("http")
          ? req.file.path
          : `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`,
        publicId: req.file.filename,
      };
    }

    await user.save();

    res.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        bio: user.bio,
        profileImage: user.profileImage,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/users/history  (voting history of logged-in user)
const getVotingHistory = async (req, res, next) => {
  try {
    const votes = await Vote.find({ user: req.user._id })
      .populate({
        path: "poll",
        populate: { path: "creator", select: "name username profileImage" },
      })
      .sort({ createdAt: -1 });

    res.json({ success: true, history: votes });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/users/saved
const getSavedPolls = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: "savedPolls",
      populate: { path: "creator", select: "name username profileImage" },
      options: { sort: { createdAt: -1 } },
    });

    res.json({ success: true, savedPolls: user.savedPolls });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/users/participated (polls the logged-in user voted in)
const getParticipatedPolls = async (req, res, next) => {
  try {
    const votes = await Vote.find({ user: req.user._id }).select("poll");
    const pollIds = votes.map((v) => v.poll);
    const polls = await Poll.find({ _id: { $in: pollIds } })
      .populate("creator", "name username profileImage")
      .sort({ createdAt: -1 });

    res.json({ success: true, polls });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserProfile,
  updateProfile,
  getVotingHistory,
  getSavedPolls,
  getParticipatedPolls,
};
