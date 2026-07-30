import { useEffect, useState, useCallback } from "react";
import { HiOutlineBookmark } from "react-icons/hi";
import api from "../api/axios.js";
import PollCard from "../components/PollCard.jsx";
import PollCardSkeleton from "../components/PollCardSkeleton.jsx";
import EmptyState from "../components/EmptyState.jsx";

const SavedPolls = () => {
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSaved = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/users/saved");
      setPolls(res.data.savedPolls);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSaved();
  }, [fetchSaved]);

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <HiOutlineBookmark className="text-2xl text-primary-600" />
        <h1 className="font-display font-bold text-2xl text-gray-900">Saved Polls</h1>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <PollCardSkeleton key={i} />)
        ) : polls.length ? (
          polls.map((poll) => <PollCard key={poll._id} poll={poll} onUpdate={fetchSaved} />)
        ) : (
          <div className="sm:col-span-2">
            <EmptyState
              icon={HiOutlineBookmark}
              title="No saved polls yet"
              description="Tap the bookmark icon on any poll to save it for later."
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedPolls;
