import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line,
} from "recharts";
import {
  HiOutlineHeart, HiHeart, HiOutlineBookmark, HiBookmark,
  HiOutlineShare, HiOutlineTrash, HiOutlineUserCircle, HiOutlineUsers,
} from "react-icons/hi";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";
import ResultBar from "../components/ResultBar.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";

const COLORS = ["#059669", "#34d399", "#a7f3d0", "#6ee7b7", "#10b981", "#047857", "#d1fae5"];

const PollDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [poll, setPoll] = useState(null);
  const [userVote, setUserVote] = useState(null);
  const [selected, setSelected] = useState([]);
  const [results, setResults] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [justVoted, setJustVoted] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [saved, setSaved] = useState(false);

  const fetchPoll = useCallback(async () => {
    try {
      const res = await api.get(`/polls/${id}`);
      setPoll(res.data.poll);
      setUserVote(res.data.userVote);
      setLiked(res.data.poll.isLiked ?? res.data.poll.likes?.some((like) => String(like) === String(user?._id)));
      setLikesCount(res.data.poll.likesCount ?? res.data.poll.likes?.length ?? 0);
      setSaved(user?.savedPolls?.includes?.(id));
    } catch {
      toast.error("Poll not found");
      navigate("/");
    }
  }, [id, navigate, user]);

  const fetchResults = useCallback(async () => {
    try {
      const res = await api.get(`/polls/${id}/results`);
      setResults(res.data.results);
    } catch {
      // ignore
    }
  }, [id]);

  const fetchComments = useCallback(async () => {
    try {
      const res = await api.get(`/polls/${id}/comments`);
      setComments(res.data.comments);
    } catch {
      // ignore
    }
  }, [id]);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchPoll(), fetchResults(), fetchComments()]).finally(() => setLoading(false));
  }, [fetchPoll, fetchResults, fetchComments]);

  // Lightweight polling refresh to simulate near-real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      fetchResults();
    }, 8000);
    return () => clearInterval(interval);
  }, [fetchResults]);

  const toggleSelect = (optId) => {
    if (poll.type === "single") {
      setSelected([optId]);
    } else {
      setSelected((prev) => (prev.includes(optId) ? prev.filter((i) => i !== optId) : [...prev, optId]));
    }
  };

  const handleVote = async () => {
    if (selected.length === 0) return toast.error("Select an option to vote");
    setVoting(true);
    try {
      const res = await api.post(`/polls/${id}/vote`, { optionIds: selected });
      setPoll(res.data.poll);
      setUserVote({ selectedOptions: selected });
      setJustVoted(true);
      toast.success("Your vote has been counted! 🎉");
      fetchResults();
      setTimeout(() => setJustVoted(false), 2500);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to vote");
    } finally {
      setVoting(false);
    }
  };

  const handleLike = async () => {
    try {
      const res = await api.post(`/polls/${id}/like`);
      setLiked(res.data.liked);
      setLikesCount(res.data.likesCount);
    } catch {
      toast.error("Please log in to like polls");
    }
  };

  const handleSave = async () => {
    try {
      const res = await api.post(`/polls/${id}/save`);
      setSaved(res.data.saved);
      toast.success(res.data.saved ? "Poll saved" : "Removed from saved");
    } catch {
      toast.error("Please log in to save polls");
    }
  };

  const handleShare = async () => {
    try {
      const res = await api.post(`/polls/${id}/share`);
      if (navigator.share) {
        await navigator.share({ title: poll.question, url: res.data.link });
      } else {
        await navigator.clipboard.writeText(res.data.link);
        toast.success("Poll link copied! 📋");
      }
    } catch {
      toast.error("Could not share poll");
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      const res = await api.post(`/polls/${id}/comments`, {
        text: commentText,
        parentCommentId: replyingTo?._id,
      });
      setComments((current) => [...current, res.data.comment]);
      setPoll((current) => ({ ...current, commentsCount: (current.commentsCount || 0) + 1 }));
      setCommentText("");
      setReplyingTo(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add comment");
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await api.delete(`/comments/${commentId}`);
      await Promise.all([fetchComments(), fetchPoll()]);
      toast.success("Comment deleted");
    } catch {
      toast.error("Failed to delete comment");
    }
  };

  const handleDeletePoll = async () => {
    try {
      await api.delete(`/polls/${id}`);
      toast.success("Poll deleted");
      navigate("/");
    } catch {
      toast.error("Failed to delete poll");
    }
  };

  if (loading || !poll) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="skeleton h-64 rounded-2xl" />
        <div className="skeleton h-40 rounded-2xl" />
      </div>
    );
  }

  const isOwner = user?._id === poll.creator?._id;
  const expired = poll.expiresAt && new Date(poll.expiresAt) < new Date();
  const hasVoted = !!userVote;

  const pieData = results?.options.map((o) => ({ name: o.text, value: o.votes })) || [];
  const barData = results?.options.map((o) => ({ name: o.text, votes: o.votes })) || [];
  const rootComments = comments.filter((comment) => !comment.parentComment);
  const repliesFor = (commentId) => comments.filter((comment) => String(comment.parentComment) === String(commentId));

  return (
    <div className="max-w-3xl mx-auto">
      {/* Poll header */}
      <div className="bg-white rounded-2xl border border-primary-100 shadow-card p-5 sm:p-7 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Link to={`/profile/${poll.creator?._id}`}>
            {poll.creator?.profileImage?.url ? (
              <img src={poll.creator.profileImage.url} alt="" className="h-11 w-11 rounded-full object-cover border border-primary-100" />
            ) : (
              <HiOutlineUserCircle className="h-11 w-11 text-primary-300" />
            )}
          </Link>
          <div>
            <Link to={`/profile/${poll.creator?._id}`} className="font-semibold text-gray-800 hover:underline">
              {poll.creator?.name}
            </Link>
            <p className="text-xs text-gray-400">@{poll.creator?.username} · {new Date(poll.createdAt).toLocaleDateString()}</p>
          </div>
          <span className="ml-auto text-xs font-semibold px-2.5 py-1 rounded-full bg-primary-50 text-primary-700">
            {poll.category}
          </span>
        </div>

        <h1 className="font-display font-bold text-xl sm:text-2xl text-gray-900 mb-2">{poll.question}</h1>
        {poll.description && <p className="text-gray-600 mb-4">{poll.description}</p>}
        {poll.image?.url && <img src={poll.image.url} alt="" className="rounded-xl mb-4 max-h-80 w-full object-cover" />}

        {expired && (
          <div className="mb-4 text-sm font-medium text-red-500 bg-red-50 px-3 py-2 rounded-lg">
            This poll has ended. Results are final.
          </div>
        )}

        {/* Voting area */}
        {!hasVoted && !expired ? (
          <div className="space-y-2 mb-4">
            {poll.options.map((opt) => (
              <button
                key={opt._id}
                type="button"
                onClick={() => toggleSelect(opt._id)}
                className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                  selected.includes(opt._id)
                    ? "border-primary-500 bg-primary-50 ring-2 ring-primary-100"
                    : "border-gray-200 hover:border-primary-300"
                }`}
              >
                <span className="flex items-center gap-3">
                  <span
                    className={`h-4 w-4 shrink-0 border-2 ${
                      poll.type === "single" ? "rounded-full" : "rounded-md"
                    } ${selected.includes(opt._id) ? "bg-primary-600 border-primary-600" : "border-gray-300"}`}
                  />
                  {opt.text}
                </span>
              </button>
            ))}
            <button
              onClick={handleVote}
              disabled={voting}
              className="w-full mt-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors shadow-soft"
            >
              {voting ? "Submitting..." : "Submit Vote"}
            </button>
          </div>
        ) : (
          <div className={`mb-4 ${justVoted ? "animate-pop" : ""}`}>
            {justVoted && (
              <div className="mb-3 text-center text-primary-700 font-semibold bg-primary-50 py-2 rounded-xl">
                Your vote has been counted! 🎉
              </div>
            )}
            {results?.options.map((opt) => (
              <ResultBar
                key={opt._id}
                text={opt.text}
                percentage={opt.percentage}
                votes={opt.votes}
                isSelected={userVote?.selectedOptions?.includes(opt._id)}
                isTop={results.mostPopular?._id === opt._id && results.totalVotes > 0}
              />
            ))}
          </div>
        )}

        <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-4">
          <HiOutlineUsers /> {results?.totalParticipants || 0} participants · {poll.totalVotes || 0} total votes
        </div>

        {/* Actions */}
        <div className="flex items-center gap-5 pt-4 border-t border-primary-50">
          <button onClick={handleLike} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-500 transition-colors">
            {liked ? <HiHeart className="text-lg text-red-500" /> : <HiOutlineHeart className="text-lg" />}
            {likesCount}
          </button>
          <button onClick={handleSave} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-600 transition-colors">
            {saved ? <HiBookmark className="text-lg text-primary-600" /> : <HiOutlineBookmark className="text-lg" />}
            Save
          </button>
          <button onClick={handleShare} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-600 transition-colors">
            <HiOutlineShare className="text-lg" /> Share
          </button>
          {isOwner && (
            <button
              onClick={() => setConfirmDelete(true)}
              className="ml-auto flex items-center gap-1.5 text-sm text-gray-400 hover:text-red-500 transition-colors"
            >
              <HiOutlineTrash className="text-lg" /> Delete
            </button>
          )}
        </div>
      </div>

      {/* Analytics */}
      {results && results.totalVotes > 0 && (
        <div className="bg-white rounded-2xl border border-primary-100 shadow-card p-5 sm:p-7 mb-6">
          <h2 className="font-display font-semibold text-lg text-gray-800 mb-4">Live Analytics</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-2">Vote Distribution</p>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-2">Votes per Option</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d1fae5" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={50} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="votes" fill="#059669" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          {results.timeline?.length > 1 && (
            <div className="mt-6">
              <p className="text-sm font-medium text-gray-500 mb-2">Voting Activity Over Time</p>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={results.timeline}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d1fae5" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="votes" stroke="#059669" strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Comments */}
      {poll.allowComments && (
        <div className="bg-white rounded-2xl border border-primary-100 shadow-card p-5 sm:p-7">
          <h2 className="font-display font-semibold text-lg text-gray-800 mb-4">
            Comments ({poll.commentsCount || 0})
          </h2>
          <form onSubmit={handleAddComment} className="flex gap-2 mb-5">
            <div className="flex-1">
              {replyingTo && (
                <div className="flex items-center justify-between text-xs text-primary-700 bg-primary-50 px-3 py-1.5 rounded-t-xl border border-primary-100">
                  <span>Replying to {replyingTo.user?.name}</span>
                  <button type="button" onClick={() => setReplyingTo(null)} className="font-medium hover:underline">Cancel</button>
                </div>
              )}
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={replyingTo ? `Reply to ${replyingTo.user?.name}...` : "Share your thoughts..."}
                className={`w-full px-4 py-2.5 border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none ${replyingTo ? "rounded-b-xl" : "rounded-xl"}`}
              />
            </div>
            <button type="submit" className="px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold transition-colors">
              {replyingTo ? "Reply" : "Post"}
            </button>
          </form>

          <div className="space-y-4">
            {comments.length === 0 && <p className="text-sm text-gray-400">No comments yet. Start the conversation!</p>}
            {rootComments.map((c) => (
              <div key={c._id} className="flex items-start gap-3">
                {c.user?.profileImage?.url ? (
                  <img src={c.user.profileImage.url} alt="" className="h-9 w-9 rounded-full object-cover border border-primary-100" />
                ) : (
                  <HiOutlineUserCircle className="h-9 w-9 text-primary-300" />
                )}
                <div className="flex-1">
                  <div className="bg-primary-50 rounded-xl px-3.5 py-2.5">
                    <p className="text-sm font-semibold text-gray-800">{c.user?.name}</p>
                    <p className="text-sm text-gray-700">{c.text}</p>
                  </div>
                  <div className="flex items-center gap-3 mt-1 px-1 text-xs text-gray-400">
                    <span>{new Date(c.createdAt).toLocaleString()}</span>
                    <button onClick={() => setReplyingTo(c)} className="hover:text-primary-600">Reply</button>
                    {c.user?._id === user?._id && (
                      <button onClick={() => handleDeleteComment(c._id)} className="hover:text-red-500">
                        Delete
                      </button>
                    )}
                  </div>
                  {repliesFor(c._id).map((reply) => (
                    <div key={reply._id} className="flex items-start gap-2 mt-3 ml-2 sm:ml-5">
                      {reply.user?.profileImage?.url ? (
                        <img src={reply.user.profileImage.url} alt="" className="h-7 w-7 rounded-full object-cover border border-primary-100" />
                      ) : (
                        <HiOutlineUserCircle className="h-7 w-7 text-primary-300" />
                      )}
                      <div className="flex-1">
                        <div className="bg-white border border-primary-100 rounded-xl px-3 py-2">
                          <p className="text-sm font-semibold text-gray-800">{reply.user?.name}</p>
                          <p className="text-sm text-gray-700">{reply.text}</p>
                        </div>
                        <div className="flex items-center gap-3 mt-1 px-1 text-xs text-gray-400">
                          <span>{new Date(reply.createdAt).toLocaleString()}</span>
                          {reply.user?._id === user?._id && <button onClick={() => handleDeleteComment(reply._id)} className="hover:text-red-500">Delete</button>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this poll?"
        description="This action cannot be undone. All votes and comments will be permanently removed."
        confirmLabel="Delete"
        danger
        onCancel={() => setConfirmDelete(false)}
        onConfirm={handleDeletePoll}
      />
    </div>
  );
};

export default PollDetail;
