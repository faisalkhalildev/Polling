import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { HiOutlineUserCircle, HiOutlinePencil, HiOutlineCamera } from "react-icons/hi";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";
import PollCard from "../components/PollCard.jsx";
import PollCardSkeleton from "../components/PollCardSkeleton.jsx";
import EmptyState from "../components/EmptyState.jsx";
import Avatar from "../components/Avatar.jsx";

const TABS = ["Created", "Participated", "Saved", "History"];

const Profile = () => {
  const { id } = useParams();
  const { user: authUser, updateUser } = useAuth();
  const isOwnProfile = authUser?._id === id;

  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [tab, setTab] = useState("Created");
  const [tabData, setTabData] = useState([]);
  const [tabLoading, setTabLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", username: "", bio: "" });
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await api.get(`/users/${id}`);
      setProfile(res.data.user);
      setStats(res.data.stats);
      setEditForm({ name: res.data.user.name, username: res.data.user.username, bio: res.data.user.bio || "" });
    } catch {
      toast.error("Profile not found");
    }
  }, [id]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    const fetchTab = async () => {
      setTabLoading(true);
      try {
        if (tab === "Created") {
          const res = await api.get("/polls", { params: { creator: id, limit: 50 } });
          setTabData(res.data.polls);
        } else if (tab === "Participated" && isOwnProfile) {
          const res = await api.get("/users/participated");
          setTabData(res.data.polls);
        } else if (tab === "Saved" && isOwnProfile) {
          const res = await api.get("/users/saved");
          setTabData(res.data.savedPolls);
        } else if (tab === "History" && isOwnProfile) {
          const res = await api.get("/users/history");
          setTabData(res.data.history);
        } else {
          setTabData([]);
        }
      } catch {
        setTabData([]);
      } finally {
        setTabLoading(false);
      }
    };
    fetchTab();
  }, [tab, id, isOwnProfile]);

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      const data = new FormData();
      Object.entries(editForm).forEach(([k, v]) => data.append(k, v));
      if (imageFile) data.append("profileImage", imageFile);

      const res = await api.put("/users/profile", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      updateUser({ ...authUser, ...res.data.user });
      setProfile((p) => ({ ...p, ...res.data.user }));
      toast.success("Profile updated!");
      setEditOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile");
    }
  };

  if (!profile) {
    return <div className="skeleton h-48 rounded-2xl max-w-3xl mx-auto" />;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-2xl border border-primary-100 shadow-card p-6 sm:p-8 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Avatar src={profile.profileImage?.url} name={profile.name} className="h-24 w-24 rounded-full object-cover border-4 border-primary-100 text-2xl" />
          <div className="flex-1">
            <h1 className="font-display font-bold text-2xl text-gray-900">{profile.name}</h1>
            <p className="text-gray-400 text-sm">@{profile.username}</p>
            {profile.bio && <p className="text-gray-600 mt-2 text-sm">{profile.bio}</p>}
            <p className="text-xs text-gray-400 mt-2">Joined {new Date(profile.createdAt).toLocaleDateString()}</p>
          </div>
          {isOwnProfile && (
            <button
              onClick={() => setEditOpen(true)}
              className="flex items-center gap-1.5 h-fit px-4 py-2 rounded-full text-sm font-medium border border-primary-200 text-primary-700 hover:bg-primary-50 transition-colors"
            >
              <HiOutlinePencil /> Edit Profile
            </button>
          )}
        </div>

        <div className="grid grid-cols-4 gap-3 mt-6 pt-6 border-t border-primary-50 text-center">
          {[
            ["Polls", stats?.totalPolls],
            ["Votes Received", stats?.totalVotesReceived],
            ["Votes Cast", stats?.totalVotesCast],
            ["Likes", stats?.totalLikes],
          ].map(([label, value]) => (
            <div key={label}>
              <p className="font-display font-bold text-lg text-primary-700">{value ?? 0}</p>
              <p className="text-xs text-gray-400">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto mb-5">
        {TABS.filter((t) => t === "Created" || isOwnProfile).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              tab === t ? "bg-primary-600 text-white" : "bg-white text-gray-600 border border-gray-200 hover:border-primary-300"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {tabLoading ? (
          Array.from({ length: 4 }).map((_, i) => <PollCardSkeleton key={i} />)
        ) : tab === "History" ? (
          tabData.length ? (
            tabData.map((v) => (
              <div key={v._id} className="bg-white rounded-2xl border border-primary-100 shadow-card p-4">
                <p className="font-medium text-gray-800 mb-1">{v.poll?.question}</p>
                <p className="text-xs text-gray-400 mb-2">Voted on {new Date(v.createdAt).toLocaleDateString()}</p>
                <Link to={`/poll/${v.poll?._id}`} className="text-sm font-medium text-primary-600 hover:underline">
                  View poll →
                </Link>
              </div>
            ))
          ) : (
            <div className="sm:col-span-2">
              <EmptyState title="No voting history yet" description="Polls you vote on will show up here." />
            </div>
          )
        ) : tabData.length ? (
          tabData.map((poll) => <PollCard key={poll._id} poll={poll} />)
        ) : (
          <div className="sm:col-span-2">
            <EmptyState title={`No ${tab.toLowerCase()} polls`} description="Nothing to show here yet." />
          </div>
        )}
      </div>

      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <form
            onSubmit={handleSaveEdit}
            className="bg-white rounded-2xl shadow-soft max-w-md w-full p-6 animate-pop space-y-4"
          >
            <h3 className="font-display font-semibold text-lg text-gray-900">Edit Profile</h3>

            <div className="flex justify-center">
              <label className="relative cursor-pointer">
                <div className="h-20 w-20 rounded-full bg-primary-50 border-2 border-dashed border-primary-200 flex items-center justify-center overflow-hidden">
                  {preview ? (
                    <img src={preview} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <Avatar src={profile.profileImage?.url} name={profile.name} className="h-full w-full text-xl" />
                  )}
                </div>
                <span className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-primary-600 flex items-center justify-center text-white">
                  <HiOutlineCamera className="text-sm" />
                </span>
                <input type="file" accept="image/*" onChange={handleImage} className="hidden" />
              </label>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Name</label>
              <input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-primary-400 outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Username</label>
              <input
                value={editForm.username}
                onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-primary-400 outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Bio</label>
              <textarea
                value={editForm.bio}
                onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                rows={2}
                maxLength={200}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-primary-400 outline-none resize-none"
              />
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button type="button" onClick={() => setEditOpen(false)} className="px-4 py-2 rounded-full text-sm font-medium text-gray-600 hover:bg-gray-100">
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 rounded-full text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700">
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Profile;
