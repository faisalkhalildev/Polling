import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { HiOutlineSearch, HiOutlineGlobeAlt } from "react-icons/hi";
import api from "../api/axios.js";
import PollCard from "../components/PollCard.jsx";
import PollCardSkeleton from "../components/PollCardSkeleton.jsx";
import EmptyState from "../components/EmptyState.jsx";

const CATEGORIES = [
  "All", "Technology", "Education", "Entertainment", "Sports", "Politics",
  "Business", "Lifestyle", "Gaming", "Science", "General",
];

const SORTS = [
  { value: "latest", label: "Latest" },
  { value: "trending", label: "Trending" },
  { value: "most-votes", label: "Most Votes" },
  { value: "most-liked", label: "Most Liked" },
  { value: "ending-soon", label: "Ending Soon" },
];

const Explore = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "All");
  const [sort, setSort] = useState(searchParams.get("sort") || "latest");

  const fetchPolls = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/polls", {
        params: { search: search || undefined, category, sort, limit: 20 },
      });
      setPolls(res.data.polls);
    } catch {
      // handled by empty state
    } finally {
      setLoading(false);
    }
  }, [search, category, sort]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchPolls();
      const params = {};
      if (search) params.q = search;
      if (category !== "All") params.category = category;
      if (sort !== "latest") params.sort = sort;
      setSearchParams(params, { replace: true });
    }, 350);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, category, sort]);

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <HiOutlineGlobeAlt className="text-2xl text-primary-600" />
        <h1 className="font-display font-bold text-2xl text-gray-900">Explore Polls</h1>
      </div>

      <div className="relative mb-4">
        <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by question, category, tags, or username..."
          className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-200 bg-white focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none shadow-card"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-1 px-1">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
              category === c
                ? "bg-primary-600 text-white border-primary-600"
                : "bg-white text-gray-600 border-gray-200 hover:border-primary-300"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 mb-6 -mx-1 px-1">
        {SORTS.map((s) => (
          <button
            key={s.value}
            onClick={() => setSort(s.value)}
            className={`shrink-0 px-3.5 py-1 rounded-full text-xs font-semibold transition-colors ${
              sort === s.value ? "bg-primary-100 text-primary-700" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <PollCardSkeleton key={i} />)
        ) : polls.length ? (
          polls.map((poll) => <PollCard key={poll._id} poll={poll} onUpdate={fetchPolls} />)
        ) : (
          <div className="sm:col-span-2">
            <EmptyState
              icon={HiOutlineSearch}
              title="No polls found"
              description="Try a different search term, category, or filter."
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Explore;
