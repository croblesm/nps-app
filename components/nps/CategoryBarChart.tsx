"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface CategoryBarChartProps {
  categories: { name: string; count: number; percentage: number }[];
  onCategoryClick: (name: string) => void;
}

export function CategoryBarChart({
  categories,
  onCategoryClick,
}: CategoryBarChartProps) {
  if (categories.length === 0) return null;

  const data = categories.map((cat) => ({
    name: cat.name,
    count: cat.count,
    percentage: cat.percentage,
  }));

  const chartHeight = Math.max(200, data.length * 40);

  return (
    <div className="mt-4">
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 20, bottom: 0, left: 0 }}
        >
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="name"
            width={140}
            tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: "hsl(var(--muted) / 0.5)" }}
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(value: any, _name: any, props: any) => [
              `${value} comments (${props?.payload?.percentage ?? 0}%)`,
              "Count",
            ]}
          />
          <Bar
            dataKey="count"
            fill="hsl(217.2, 91.2%, 59.8%)"
            radius={[0, 4, 4, 0]}
            cursor="pointer"
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onClick={(data: any) => {
              if (data?.name) onCategoryClick(data.name);
            }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
