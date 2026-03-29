"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
      <Select
        value={actionableFilter}
        onValueChange={(val) => onActionableChange(val ?? "")}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All Comments</SelectItem>
          <SelectItem value="true">Actionable</SelectItem>
          <SelectItem value="false">Non-Actionable</SelectItem>
        </SelectContent>
      </Select>
      <Select
        value={String(limit)}
        onValueChange={(val) => onLimitChange(Number(val))}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {[10, 25, 50, 100].map((n) => (
            <SelectItem key={n} value={String(n)}>
              {n} per page
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="text-sm text-muted-foreground self-center">
        {totalResults} results
      </span>
    </div>
  );
}
