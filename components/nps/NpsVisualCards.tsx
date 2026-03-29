"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const NPS_COLORS = {
  promoter: "#22c55e",
  passive: "#eab308",
  detractor: "#ef4444",
};

interface NpsVisualCardsProps {
  npsScore: number;
  promoters: number;
  passives: number;
  detractors: number;
  promoterPct: number;
  passivePct: number;
  detractorPct: number;
  promoterQuotes?: { text: string; nps: number }[];
  detractorQuotes?: { text: string; nps: number }[];
}

export function NpsVisualCards({
  npsScore,
  promoters,
  passives,
  detractors,
  promoterPct,
  passivePct,
  detractorPct,
  promoterQuotes,
  detractorQuotes,
}: NpsVisualCardsProps) {
  const chartData = [
    { name: "Promoters", value: promoters, color: NPS_COLORS.promoter },
    { name: "Passives", value: passives, color: NPS_COLORS.passive },
    { name: "Detractors", value: detractors, color: NPS_COLORS.detractor },
  ];

  const legendItems = [
    { label: "Promoters", count: promoters, pct: promoterPct, color: NPS_COLORS.promoter },
    { label: "Passives", count: passives, pct: passivePct, color: NPS_COLORS.passive },
    { label: "Detractors", count: detractors, pct: detractorPct, color: NPS_COLORS.detractor },
  ];

  return (
    <Card>
      <CardContent className="py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left column: Donut chart + legend */}
          <div className="flex items-center gap-6">
            {/* Donut chart with center NPS score */}
            <div className="relative w-40 h-40 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              {/* Center NPS score overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xs text-muted-foreground uppercase tracking-wide">NPS</span>
                <span className="text-3xl font-bold">{npsScore}</span>
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-col gap-3">
              {legendItems.map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{item.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {item.count} ({item.pct}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Middle column: Promoter quotes */}
          <div className="space-y-3 min-w-0">
            <h4 className="text-sm font-medium text-[var(--nps-promoter,#22c55e)]">What promoters say</h4>
            {promoterQuotes && promoterQuotes.length > 0 ? (
              <div className="space-y-2">
                {promoterQuotes.slice(0, 3).map((q, i) => (
                  <blockquote key={i} className="border-l-2 border-[var(--nps-promoter,#22c55e)] pl-3 text-sm text-muted-foreground max-w-full">
                    <p className="line-clamp-2 break-words">{q.text}</p>
                    <Badge variant="outline" className="mt-1 text-xs">NPS {q.nps}</Badge>
                  </blockquote>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No promoter quotes available</p>
            )}
          </div>

          {/* Right column: Detractor quotes */}
          <div className="space-y-3 min-w-0">
            <h4 className="text-sm font-medium text-[var(--nps-detractor,#ef4444)]">What detractors say</h4>
            {detractorQuotes && detractorQuotes.length > 0 ? (
              <div className="space-y-2">
                {detractorQuotes.slice(0, 3).map((q, i) => (
                  <blockquote key={i} className="border-l-2 border-[var(--nps-detractor,#ef4444)] pl-3 text-sm text-muted-foreground max-w-full">
                    <p className="line-clamp-2 break-words">{q.text}</p>
                    <Badge variant="outline" className="mt-1 text-xs">NPS {q.nps}</Badge>
                  </blockquote>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No detractor quotes available</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
