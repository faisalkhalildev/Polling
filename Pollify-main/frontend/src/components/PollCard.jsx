import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  HiOutlineHeart,
  HiHeart,
  HiOutlineBookmark,
  HiBookmark,
  HiOutlineChat,
  HiOutlineShare,
  HiOutlineUserCircle,
} from "react-icons/hi";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";
import Avatar from "./Avatar.jsx";

const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  const intervals = [
    ["y", 31536000],
    ["mo", 2592000],
    ["d", 86400],
    ["h", 3600],
    ["m", 60],
  ];
  for (const [label, secs] of intervals) {
    const val = Math.floor(seconds / secs);
    if (val >= 1) return `${val}${label} ago`;
  }
  return "just now";
};

const CATEGORY_COLORS = {
  Technology: "bg-blue-50 text-blue-600",
  Education: "bg-purple-50 text-purple-600",
  Entertainment: "bg-pink-50 text-pink-600",
  Sports: "bg-orange-50 text-orange-600",
  Politics: "bg-red-50 text-red-600",
  Business: "bg-amber-50 text-amber-700",
  Lifestyle: "bg-teal-50 text-teal-600",
  Gaming: "bg-indigo-50 text-indigo-600",
  Science: "bg-cyan-50 text-cyan-600",
  General: "bg-primary-50 text-primary-700",
};

const PollCard = ({ poll, onUpdate }) => {
  const { user } = useAuth();
  const hasLiked = (likes = []) => likes.some((id) => String(id) === String(user?._id));
  const [liked, setLiked] = useState(poll.isLiked ?? hasLiked(poll.likes));
  const [likesCount, setLikesCount] = useState(poll.likesCount ?? poll.likes?.length ?? 0);
  const [saved, setSaved] = useState(user?.savedPolls?.includes?.(poll._id));
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setLiked(poll.isLiked ?? hasLiked(poll.likes));
    setLikesCount(poll.likesCount ?? poll.likes?.length ?? 0);
  }, [poll, user?._id]);

  const handleLike = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const res = await api.post(`/polls/${poll._id}/like`);
      setLiked(res.data.liked);
      setLikesCount(res.data.likesCount);
    } catch {
      toast.error("Please log in to like polls");
    } finally {
      setBusy(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post(`/polls/${poll._id}/save`);
      setSaved(res.data.saved);
      toast.success(res.data.saved ? "Poll saved" : "Removed from saved");
      onUpdate?.();
    } catch {
      toast.error("Please log in to save polls");
    }
  };

  const handleShare = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post(`/polls/${poll._id}/share`);
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

  const expired = poll.expiresAt && new Date(poll.expiresAt) < new Date();

  return (
    <Link
      to={`/poll/${poll._id}`}
      className="card-hover block bg-white rounded-2xl border border-primary-100 shadow-card p-4 sm:p-5"
    >
      <div className="flex items-center gap-3 mb-3">
        <Avatar src={poll.creator?.profileImage?.url} name={poll.creator?.name} className="h-10 w-10 rounded-full object-cover border border-primary-100 text-sm" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-800 truncate">{poll.creator?.name}</p>
          <p className="text-xs text-gray-400">
            @{poll.creator?.username} · {timeAgo(poll.createdAt)}
          </p>
        </div>
        <span
          className={`ml-auto text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${
            CATEGORY_COLORS[poll.category] || CATEGORY_COLORS.General
          }`}
        >
          {poll.category}
        </span>
      </div>

      <h3 className="font-display font-semibold text-gray-900 text-base sm:text-lg leading-snug mb-1">
        {poll.question}
      </h3>
      {poll.description && (
        <p className="text-sm text-gray-500 mb-3 line-clamp-2">{poll.description}</p>
      )}

      {poll.image?.url && (
        <img src={poll.image.url} alt="" className="rounded-xl mb-3 max-h-56 w-full object-cover" loading="lazy" decoding="async" />
      )}

      <div className="flex flex-wrap gap-1.5 mb-3">
        {poll.options?.slice(0, 4).map((opt) => (
          <span
            key={opt._id}
            className="text-xs bg-primary-50 text-primary-700 px-2.5 py-1 rounded-full border border-primary-100"
          >
            {opt.text}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
        <span>
          {poll.totalVotes || 0} votes · {poll.type === "multiple" ? "Multiple choice" : "Single choice"}
        </span>
        {expired && <span className="text-red-400 font-medium">Ended</span>}
      </div>

      <div className="flex items-center gap-4 pt-3 border-t border-primary-50">
        <button onClick={handleLike} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-500 transition-colors">
          {liked ? <HiHeart className="text-lg text-red-500" /> : <HiOutlineHeart className="text-lg" />}
          {likesCount}
        </button>
        <span className="flex items-center gap-1.5 text-sm text-gray-500">
          <HiOutlineChat className="text-lg" />
          {poll.commentsCount || 0}
        </span>
        <button onClick={handleSave} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-600 transition-colors ml-auto">
          {saved ? <HiBookmark className="text-lg text-primary-600" /> : <HiOutlineBookmark className="text-lg" />}
        </button>
        <button onClick={handleShare} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-600 transition-colors">
          <HiOutlineShare className="text-lg" />
        </button>
      </div>
    </Link>
  );
};

export default PollCard;
