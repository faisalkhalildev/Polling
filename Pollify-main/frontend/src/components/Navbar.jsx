import { useState, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  HiOutlineHome,
  HiOutlineGlobeAlt,
  HiOutlinePlusCircle,
  HiOutlineBookmark,
  HiOutlineBell,
  HiOutlineUserCircle,
  HiOutlineLogout,
  HiOutlineMenu,
  HiOutlineX,
  HiOutlineHeart,
  HiOutlineChat,
  HiOutlineSparkles,
} from "react-icons/hi";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../api/axios.js";
import Avatar from "./Avatar.jsx";

const navLinkClass = ({ isActive }) =>
  `flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-colors ${
    isActive ? "bg-primary-600 text-white shadow-soft" : "text-gray-600 hover:bg-primary-100"
  }`;

const notificationIcons = {
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
  for (const [label, duration] of intervals) {
    const value = Math.floor(seconds / duration);
    if (value >= 1) return `${value}${label} ago`;
  }
  return "just now";
};

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchUnread = () => {
      api
        .get("/notifications")
        .then((res) => setUnread(res.data.unreadCount))
        .catch(() => {});
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 20000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (!notificationsOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") setNotificationsOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [notificationsOpen]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const openNotifications = async () => {
    setMenuOpen(false);
    setNotificationsOpen(true);
    setNotificationsLoading(true);
    try {
      const res = await api.get("/notifications");
      setNotifications(res.data.notifications);
      setUnread(res.data.unreadCount);
    } catch {
      setNotifications([]);
    } finally {
      setNotificationsLoading(false);
    }
  };

  const markAllRead = async () => {
    try {
      await api.put("/notifications/read-all");
      setNotifications((current) => current.map((notification) => ({ ...notification, read: true })));
      setUnread(0);
    } catch {
      // Keep the panel usable if the request fails.
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-primary-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <span className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-display font-bold text-lg shadow-soft">
              <img src="/logo.png" alt="Polify" className="h-full w-full rounded-xl object-contain" />
            </span>
            <span className="font-display font-bold text-xl text-primary-800 hidden sm:block">
              Polify
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <NavLink to="/" end className={navLinkClass}>
              <HiOutlineHome /> Home
            </NavLink>
            <NavLink to="/explore" className={navLinkClass}>
              <HiOutlineGlobeAlt /> Explore
            </NavLink>
            <NavLink to="/create" className={navLinkClass}>
              <HiOutlinePlusCircle /> Create Poll
            </NavLink>
            <NavLink to="/saved" className={navLinkClass}>
              <HiOutlineBookmark /> Saved
            </NavLink>
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={openNotifications}
              className="relative flex p-2 rounded-full text-gray-600 hover:bg-primary-100 transition-colors"
              aria-label="Open notifications"
              aria-expanded={notificationsOpen}
            >
              <HiOutlineBell className="text-xl" />
              {unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] px-1 rounded-full bg-red-500 text-white text-[10px] leading-4 text-center font-semibold">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </button>

            <NavLink
              to={`/profile/${user?._id}`}
              className="hidden md:flex items-center gap-2 pl-2 pr-3 py-1 rounded-full hover:bg-primary-100 transition-colors"
            >
              <Avatar src={user?.profileImage?.url} name={user?.name} className="h-8 w-8 rounded-full object-cover border border-primary-200 text-xs" />
              <span className="text-sm font-medium text-gray-700">{user?.name?.split(" ")[0]}</span>
            </NavLink>

            <button
              onClick={handleLogout}
              className="hidden md:flex p-2 rounded-full text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors"
              title="Logout"
            >
              <HiOutlineLogout className="text-xl" />
            </button>

            <button
              className="md:hidden p-2 rounded-full text-primary-700 hover:bg-primary-100"
              onClick={() => setMenuOpen((v) => !v)}
            >
              {menuOpen ? <HiOutlineX className="text-2xl" /> : <HiOutlineMenu className="text-2xl" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-primary-100 bg-white px-4 py-3 space-y-1 animate-pop">
            <NavLink to={`/profile/${user?._id}`} onClick={() => setMenuOpen(false)} className={navLinkClass}>
              <HiOutlineUserCircle /> Profile
            </NavLink>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 w-full text-left rounded-full text-sm font-medium text-red-500 hover:bg-red-50"
            >
              <HiOutlineLogout /> Logout
            </button>
          </div>
        )}
      </header>

      {notificationsOpen && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Notifications">
          <button
            className="absolute inset-0 bg-gray-900/25 backdrop-blur-[1px] animate-[fadeIn_150ms_ease-out]"
            onClick={() => setNotificationsOpen(false)}
            aria-label="Close notifications"
          />
          <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl animate-[slideIn_250ms_cubic-bezier(0.22,1,0.36,1)] sm:right-4 sm:top-4 sm:h-[calc(100%-2rem)] sm:rounded-3xl">
            <div className="flex items-center justify-between border-b border-primary-100 px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-100 text-primary-700">
                  <HiOutlineBell className="text-xl" />
                </span>
                <div>
                  <h2 className="font-display text-lg font-bold text-gray-900">Notifications</h2>
                  <p className="text-xs text-gray-500">Stay up to date with your polls</p>
                </div>
              </div>
              <button onClick={() => setNotificationsOpen(false)} className="rounded-full p-2 text-gray-500 transition-colors hover:bg-primary-100 hover:text-primary-700" aria-label="Close notifications">
                <HiOutlineX className="text-xl" />
              </button>
            </div>

            {notifications.some((notification) => !notification.read) && (
              <button onClick={markAllRead} className="mx-5 mt-3 self-start text-sm font-semibold text-primary-700 hover:text-primary-800 hover:underline">
                Mark all as read
              </button>
            )}

            <div className="flex-1 overflow-y-auto p-3 sm:p-4">
              {notificationsLoading ? (
                <div className="space-y-3">{Array.from({ length: 5 }).map((_, index) => <div key={index} className="skeleton h-20 rounded-2xl" />)}</div>
              ) : notifications.length ? (
                <div className="space-y-2">
                  {notifications.map((notification) => {
                    const meta = notificationIcons[notification.type] || notificationIcons.vote;
                    const Icon = meta.icon;
                    return (
                      <Link
                        key={notification._id}
                        to={notification.poll ? `/poll/${notification.poll._id}` : "/"}
                        onClick={() => setNotificationsOpen(false)}
                        className={`flex items-start gap-3 rounded-2xl border p-3 transition-all hover:-translate-y-0.5 hover:shadow-card ${notification.read ? "border-primary-50 bg-white" : "border-primary-100 bg-primary-50/70"}`}
                      >
                        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${meta.color}`}><Icon className="text-lg" /></span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm text-gray-800">{notification.message}</span>
                          <span className="mt-1 block text-xs text-gray-400">{timeAgo(notification.createdAt)}</span>
                        </span>
                        {!notification.read && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary-600" />}
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="flex h-full flex-col items-center justify-center px-8 text-center">
                  <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-100 text-primary-600"><HiOutlineBell className="text-2xl" /></span>
                  <p className="font-display font-semibold text-gray-800">No notifications yet</p>
                  <p className="mt-1 text-sm text-gray-500">We’ll let you know when something happens.</p>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-primary-100 flex items-center justify-around py-2 px-1 shadow-[0_-4px_20px_-8px_rgba(5,150,105,0.2)]">
        {[
          { to: "/", icon: HiOutlineHome, label: "Home", end: true },
          { to: "/explore", icon: HiOutlineGlobeAlt, label: "Explore" },
          { to: "/create", icon: HiOutlinePlusCircle, label: "Create" },
          { to: "/saved", icon: HiOutlineBookmark, label: "Saved" },
          { to: `/profile/${user?._id}`, icon: HiOutlineUserCircle, label: "Profile" },
        ].map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={label}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-[11px] font-medium ${
                isActive ? "text-primary-700" : "text-gray-400"
              }`
            }
          >
            <Icon className="text-xl" />
            {label}
          </NavLink>
        ))}
      </nav>
    </>
  );
};

export default Navbar;
