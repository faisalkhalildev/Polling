const ResultBar = ({ text, percentage, votes, isSelected, isTop }) => {
  return (
    <div className="mb-2.5">
      <div className="flex items-center justify-between text-sm mb-1">
        <span className={`font-medium ${isSelected ? "text-primary-700" : "text-gray-700"}`}>
          {text} {isSelected && "✓"} {isTop && "👑"}
        </span>
        <span className="text-gray-500 text-xs font-semibold">
          {percentage}% · {votes} {votes === 1 ? "vote" : "votes"}
        </span>
      </div>
      <div className="h-3 w-full rounded-full bg-primary-50 border border-primary-100 overflow-hidden">
        <div
          className={`result-bar-fill h-full rounded-full ${
            isSelected
              ? "bg-gradient-to-r from-primary-500 to-primary-700"
              : "bg-gradient-to-r from-primary-300 to-primary-400"
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default ResultBar;
