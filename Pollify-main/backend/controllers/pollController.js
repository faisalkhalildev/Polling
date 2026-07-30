const Poll = require("../models/Poll");
const Vote = require("../models/Vote");
const Comment = require("../models/Comment");

// A feed does not need to download every account that liked every poll.
// Keep only the count and the signed-in viewer's own like status.
const formatPollForViewer = (poll, viewerId) => {
  const formatted = poll.toObject ? poll.toObject() : { ...poll };
  const likes = formatted.likes || [];
  formatted.likesCount = likes.length;
  formatted.isLiked = Boolean(viewerId && likes.some((id) => id.toString() === viewerId.toString()));
  delete formatted.likes;
  return formatted;
};

// @route GET /api/polls
// Supports: search, category, sort (latest|trending|most-votes|most-liked|ending-soon), page, limit
const getPolls = async (req, res, next) => {
  try {
    const { search, category, sort = "latest", page = 1, limit = 10, creator } = req.query;

    const query = {};
    if (category && category !== "All") query.category = category;
    if (creator) query.creator = creator;
    if (search) {
      query.$or = [
        { question: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $regex: search, $options: "i" } },
      ];
    }

    let sortOption = { createdAt: -1 };
    if (sort === "trending" || sort === "most-votes") sortOption = { totalVotes: -1 };
    if (sort === "most-liked") sortOption = { likesCount: -1 };
    if (sort === "ending-soon") sortOption = { expiresAt: 1 };

    const skip = (Number(page) - 1) * Number(limit);

    let pollsQuery = Poll.find(query)
      .populate("creator", "name username profileImage")
      .skip(skip)
      .limit(Number(limit));

    if (sort === "most-liked") {
      // likes is an array; sort by array length via aggregation-friendly approach
      const polls = await Poll.aggregate([
        { $match: query },
        { $addFields: { likesCount: { $size: "$likes" } } },
        { $sort: { likesCount: -1 } },
        { $skip: skip },
        { $limit: Number(limit) },
      ]);
      await Poll.populate(polls, { path: "creator", select: "name username profileImage" });
      const total = await Poll.countDocuments(query);
      return res.json({
        success: true,
        polls: polls.map((poll) => formatPollForViewer(poll, req.user?._id)),
        total,
        page: Number(page),
        pages: Math.ceil(total / limit),
      });
    }

    pollsQuery = pollsQuery.sort(sortOption);
    const polls = await pollsQuery.lean().exec();
    const total = await Poll.countDocuments(query);

    res.json({
      success: true,
      polls: polls.map((poll) => formatPollForViewer(poll, req.user?._id)),
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/polls/:id
const getPollById = async (req, res, next) => {
  try {
    const poll = await Poll.findById(req.params.id).populate("creator", "name username profileImage bio").lean();
    if (!poll) return res.status(404).json({ success: false, message: "Poll not found" });

    let userVote = null;
    if (req.user) {
      userVote = await Vote.findOne({ poll: poll._id, user: req.user._id });
    }

    res.json({ success: true, poll: formatPollForViewer(poll, req.user?._id), userVote });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/polls
const createPoll = async (req, res, next) => {
  try {
    const {
      question,
      description,
      type,
      options,
      category,
      tags,
      expiresAt,
      allowComments,
      allowAnonymous,
    } = req.body;

    if (!question || !options) {
      return res.status(400).json({ success: false, message: "Question and options are required" });
    }

    let parsedOptions = options;
    if (typeof options === "string") parsedOptions = JSON.parse(options);
    if (!Array.isArray(parsedOptions) || parsedOptions.length < 2) {
      return res.status(400).json({ success: false, message: "Provide at least 2 options" });
    }

    let parsedTags = tags;
    if (typeof tags === "string") {
      try {
        parsedTags = JSON.parse(tags);
      } catch {
        parsedTags = tags.split(",").map((t) => t.trim()).filter(Boolean);
      }
    }

    let image = { url: "", publicId: "" };
    if (req.file) {
      image = {
        url: req.file.path.startsWith("http")
          ? req.file.path
          : `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`,
        publicId: req.file.filename,
      };
    }

    const poll = await Poll.create({
      creator: req.user._id,
      question,
      description,
      type: type === "multiple" ? "multiple" : "single",
      options: parsedOptions.map((opt) => ({ text: typeof opt === "string" ? opt : opt.text, votes: 0 })),
      category: category || "General",
      tags: parsedTags || [],
      image,
      expiresAt: expiresAt || null,
      allowComments: allowComments === undefined ? true : allowComments === "true" || allowComments === true,
      allowAnonymous: allowAnonymous === undefined ? true : allowAnonymous === "true" || allowAnonymous === true,
    });

    res.status(201).json({ success: true, poll });
  } catch (error) {
    next(error);
  }
};

// @route PUT /api/polls/:id
const updatePoll = async (req, res, next) => {
  try {
    const poll = await Poll.findById(req.params.id);
    if (!poll) return res.status(404).json({ success: false, message: "Poll not found" });

    if (poll.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized to edit this poll" });
    }

    const editableFields = ["question", "description", "category", "expiresAt", "allowComments", "allowAnonymous"];
    editableFields.forEach((field) => {
      if (req.body[field] !== undefined) poll[field] = req.body[field];
    });

    if (req.body.tags) {
      poll.tags = typeof req.body.tags === "string" ? JSON.parse(req.body.tags) : req.body.tags;
    }

    if (req.file) {
      poll.image = {
        url: req.file.path.startsWith("http")
          ? req.file.path
          : `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`,
        publicId: req.file.filename,
      };
    }

    await poll.save();
    res.json({ success: true, poll });
  } catch (error) {
    next(error);
  }
};

// @route DELETE /api/polls/:id
const deletePoll = async (req, res, next) => {
  try {
    const poll = await Poll.findById(req.params.id);
    if (!poll) return res.status(404).json({ success: false, message: "Poll not found" });

    if (poll.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized to delete this poll" });
    }

    await Vote.deleteMany({ poll: poll._id });
    await Comment.deleteMany({ poll: poll._id });
    await poll.deleteOne();

    res.json({ success: true, message: "Poll deleted successfully" });
  } catch (error) {
    next(error);
  }
};

module.exports = { getPolls, getPollById, createPoll, updatePoll, deletePoll };
