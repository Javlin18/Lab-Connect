"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

interface ComplianceDonutProps {
  percentage: number;
  label: string;
  colorYes?: string;
  colorNo?: string;
  size?: number;
}

export function ComplianceDonut({
  percentage,
  label,
  colorYes = "#22C55E",
  colorNo = "#FEE2E2",
  size = 140,
}: ComplianceDonutProps) {
  const data = [
    { name: "Compliant", value: percentage },
    { name: "Non-compliant", value: 100 - percentage },
  ];

  const textColor =
    percentage >= 90 ? "#16A34A" : percentage >= 70 ? "#D97706" : "#DC2626";

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius="60%"
              outerRadius="80%"
              startAngle={90}
              endAngle={-270}
              dataKey="value"
              strokeWidth={0}
            >
              <Cell fill={colorYes} />
              <Cell fill={colorNo} />
            </Pie>
            <Tooltip
              formatter={(v: any, n: any) => [
                `${typeof v === "number" ? v.toFixed(1) : v}%`,
                n,
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xl font-black" style={{ color: textColor }}>
            {percentage.toFixed(0)}%
          </span>
        </div>
      </div>
      <p className="text-xs font-semibold text-slate-600 text-center">{label}</p>
    </div>
  );
}
