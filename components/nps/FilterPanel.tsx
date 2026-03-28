"use client";

interface FilterPanelProps {
  actionableFilter: string;
  onActionableChange: (value: string) => void;
  limit: number;
  onLimitChange: (value: number) => void;
  totalResults: number;
}

export function FilterPanel({
  actionableFilter,
  onActionableChange,
  limit,
  onLimitChange,
  totalResults,
}: FilterPanelProps) {
  return (
    <div className="flex gap-3 mb-4 flex-wrap">
      <select
        value={actionableFilter}
        onChange={(e) => onActionableChange(e.target.value)}
        className="p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
      >
        <option value="">All Comments</option>
        <option value="true">Actionable</option>
        <option value="false">Non-Actionable</option>
      </select>
      <select
        value={limit}
        onChange={(e) => onLimitChange(Number(e.target.value))}
        className="p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
      >
        {[10, 25, 50, 100].map((n) => (
          <option key={n} value={n}>
            {n} per page
          </option>
        ))}
      </select>
      <span className="text-sm text-gray-400 self-center">
        {totalResults} results
      </span>
    </div>
  );
}
