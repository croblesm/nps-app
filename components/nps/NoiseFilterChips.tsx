"use client";

import { Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface NoiseFilterChip {
  id: string;
  name: string;
  active: boolean;
}

interface NoiseFilterChipsProps {
  filters: NoiseFilterChip[];
  onToggle: (id: string) => void;
  excludedCount: number;
}

export function NoiseFilterChips({ filters, onToggle, excludedCount }: NoiseFilterChipsProps) {
  if (filters.length === 0) return null;

  const activeCount = filters.filter((f) => f.active).length;

  return (
    <div className="flex items-center gap-2 flex-wrap px-3 py-2 rounded-lg bg-muted border border-border text-sm text-muted-foreground">
      <Filter className="size-4 shrink-0" />
      {filters.map((f) => (
        <button
          key={f.id}
          onClick={() => onToggle(f.id)}
          className="transition-all"
          title={f.active ? `Click to disable "${f.name}" filter` : `Click to re-enable "${f.name}" filter`}
        >
          <Badge
            variant={f.active ? "default" : "outline"}
            className={`cursor-pointer select-none ${!f.active ? "line-through opacity-50" : ""}`}
          >
            {f.name}
          </Badge>
        </button>
      ))}
      <span>
        {activeCount === 0
          ? "No filters active — showing all comments"
          : `${excludedCount} comment${excludedCount !== 1 ? "s" : ""} excluded from NPS score`}
      </span>
    </div>
  );
}
