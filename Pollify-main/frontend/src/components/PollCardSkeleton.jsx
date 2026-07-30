const PollCardSkeleton = () => (
  <div className="bg-white rounded-2xl border border-primary-100 shadow-card p-5">
    <div className="flex items-center gap-3 mb-4">
      <div className="skeleton h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <div className="skeleton h-3 w-24" />
        <div className="skeleton h-2.5 w-16" />
      </div>
    </div>
    <div className="skeleton h-4 w-3/4 mb-2" />
    <div className="skeleton h-4 w-1/2 mb-4" />
    <div className="flex gap-2">
      <div className="skeleton h-6 w-16 rounded-full" />
      <div className="skeleton h-6 w-20 rounded-full" />
    </div>
  </div>
);

export default PollCardSkeleton;
