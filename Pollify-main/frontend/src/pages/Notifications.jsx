import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  HiOutlineBell, HiOutlineHeart, HiOutlineChat, HiOutlineSparkles, HiOutlineUserCircle,
} from "react-icons/hi";
import api from "../api/axios.js";
import EmptyState from "../components/EmptyState.jsx";

const ICONS = {
  like: { icon: HiOutlineHeart, color: "text-red-500 bg-red-50" },
  comment: { icon: HiOutlineChat, color: "text-blue-500 bg-blue-50" },
  reply: { icon: HiOutlineChat, color: "text-purple-500 bg-purple-50" },
  milestone: { icon: HiOutlineSparkles, color: "text-amber-500 bg-amber-50" },
  vote: { icon: HiOutlineBell, color: "text-primary-600 bg-primary-50" },
  follow: { icon: HiOutlineUserCircle, color: "text-purple-500 bg-purple-50" },
};

const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  const intervals = [["y", 31536000], ["mo", 2592000], ["d", 86400], ["h", 3600], ["m", 60]];
  for (const [label, secs] of intervals) {
    const val = Math.floor(seconds / secs);
    if (val >= 1) return `${val}${label} ago`;
  }
  return "just now";
};

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get("/notifications");
      setNotifications(res.data.notifications);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAllRead = async () => {
    await api.put("/notifications/read-all");
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <HiOutlineBell className="text-2xl text-primary-600" />
          <h1 className="font-display font-bold text-2xl text-gray-900">Notifications</h1>
        </div>
        {notifications.some((n) => !n.read) && (
          <button onClick={markAllRead} className="text-sm font-medium text-primary-600 hover:underline">
            Mark all as read
          </button>
        )}
      </div>

      <div className="space-y-2">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)
        ) : notifications.length ? (
          notifications.map((n) => {
            const meta = ICONS[n.type] || ICONS.vote;
            const Icon = meta.icon;
            return (
              <Link
                key={n._id}
                to={n.poll ? `/poll/${n.poll._id}` : "#"}
                className={`flex items-start gap-3 p-4 rounded-xl border transition-colors ${
                  n.read ? "bg-white border-primary-50" : "bg-primary-50/60 border-primary-100"
                } hover:border-primary-300`}
              >
                <span className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${meta.color}`}>
                  <Icon className="text-lg" />
                </span>
                <div className="flex-1">
                  <p className="text-sm text-gray-800">{n.message}</p>
                  {n.commentText && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">“{n.commentText}”</p>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5">{timeAgo(n.createdAt)}</p>
                </div>
                {!n.read && <span className="h-2 w-2 rounded-full bg-primary-600 mt-2" />}
              </Link>
            );
          })
        ) : (
          <EmptyState icon={HiOutlineBell} title="No notifications yet" description="We'll let you know when something happens." />
        )}
      </div>
    </div>
  );
};

export default Notifications;
