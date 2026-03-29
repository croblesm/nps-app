"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";

const NPS_COLORS = {
  promoter: "#22c55e",
  passive: "#eab308",
  detractor: "#ef4444",
};

interface NpsDonutChartProps {
  npsScore: number;
  promoters: number;
  passives: number;
  detractors: number;
  promoterPct: number;
  passivePct: number;
  detractorPct: number;
}

export function NpsDonutChart({
  npsScore,
  promoters,
  passives,
  detractors,
  promoterPct,
  passivePct,
  detractorPct,
}: NpsDonutChartProps) {
  const chartData = [
    { name: "Promoters", value: promoters, color: NPS_COLORS.promoter },
    { name: "Passives", value: passives, color: NPS_COLORS.passive },
    { name: "Detractors", value: detractors, color: NPS_COLORS.detractor },
  ];

  const legendItems = [
    { label: "Promoters", pct: promoterPct, color: NPS_COLORS.promoter },
    { label: "Passives", pct: passivePct, color: NPS_COLORS.passive },
    { label: "Detractors", pct: detractorPct, color: NPS_COLORS.detractor },
  ];

  return (
    <div className="flex items-center gap-6">
      {/* Donut chart */}
      <div className="relative w-32 h-32 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={38}
              outerRadius={58}
              dataKey="value"
              strokeWidth={0}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        {/* Center NPS score */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-bold">{npsScore}</span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wide">NPS</span>
        </div>
      </div>

      {/* Compact legend */}
      <div className="flex flex-col gap-1.5">
        {legendItems.map((item) => (
          <div key={item.label} className="flex items-center gap-2 text-sm">
            <div
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-muted-foreground">{item.label}</span>
            <span className="font-medium">{item.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
