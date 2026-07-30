import { useCallback, useEffect, useRef, useState } from "react";
import { HiOutlineSparkles } from "react-icons/hi";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";
import PollCard from "../components/PollCard.jsx";
import PollCardSkeleton from "../components/PollCardSkeleton.jsx";
import EmptyState from "../components/EmptyState.jsx";

const PAGE_SIZE = 10;

const Dashboard = () => {
  const { user } = useAuth();
  const [polls, setPolls] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const loadMoreRef = useRef(null);

  const fetchFeed = useCallback(async (pageToLoad = 1, replace = false) => {
    if (pageToLoad === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const res = await api.get("/polls", { params: { sort: "latest", page: pageToLoad, limit: PAGE_SIZE } });
      setPolls((current) => (replace ? res.data.polls : [...current, ...res.data.polls]));
      setPage(pageToLoad);
      setHasMore(pageToLoad < res.data.pages);
    } catch {
      if (replace) setPolls([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchFeed(1, true);
  }, [fetchFeed]);

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target || !hasMore || loading || loadingMore) return undefined;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) fetchFeed(page + 1);
    }, { rootMargin: "240px" });
    observer.observe(target);
    return () => observer.disconnect();
  }, [fetchFeed, hasMore, loading, loadingMore, page]);

  return (
    <div className="max-w-2xl mx-auto">
      <section className="relative hidden overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white px-6 py-8 mb-6 shadow-soft sm:block sm:px-8">
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-primary-400/30 blur-3xl" />
        <div className="relative">
          <div>
            <p className="text-sm text-primary-50/90">Welcome back, {user?.name?.split(" ")[0]}!</p>
            <h1 className="font-display font-bold text-2xl mt-1">Your poll feed</h1>
            <p className="text-sm text-primary-50/90 mt-1">Fresh conversations first, then older posts as you scroll.</p>
          </div>
        </div>
      </section>

      <div className="flex items-center gap-2 mb-4">
        <HiOutlineSparkles className="text-xl text-primary-600" />
        <h2 className="font-display font-semibold text-lg text-gray-800">Latest posts</h2>
      </div>

      <div className="space-y-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <PollCardSkeleton key={i} />)
        ) : polls.length ? (
          polls.map((poll) => <PollCard key={poll._id} poll={poll} />)
        ) : (
          <EmptyState icon={HiOutlineSparkles} title="Your feed is waiting" description="Create the first poll to start a conversation." />
        )}
      </div>

      {hasMore && <div ref={loadMoreRef} className="py-6">{loadingMore && <PollCardSkeleton />}</div>}
      {!loading && polls.length > 0 && !hasMore && <p className="text-center text-sm text-gray-400 py-8">You've reached the end of the feed.</p>}
    </div>
  );
};

export default Dashboard;
