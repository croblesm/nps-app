"use client";

interface CategoryBreakdownProps {
  categories: { name: string; count: number; percentage: number }[];
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

export function CategoryBreakdown({
  categories,
  activeCategory,
  onCategoryChange,
}: CategoryBreakdownProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
      {categories.map((cat) => (
        <button
          key={cat.name}
          onClick={() =>
            onCategoryChange(activeCategory === cat.name ? "" : cat.name)
          }
          className={`p-3 rounded-lg text-left text-sm transition-colors ${
            activeCategory === cat.name
              ? "bg-blue-100 dark:bg-blue-900/30 border-blue-500 border"
              : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-blue-400"
          }`}
        >
          <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
            {cat.name}
          </div>
          <div className="text-gray-500 dark:text-gray-400 text-xs mt-1">
            {cat.count} ({cat.percentage}%)
          </div>
        </button>
      ))}
    </div>
  );
}
