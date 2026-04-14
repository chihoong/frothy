"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { speedUnitLabel, type SpeedUnit } from "@/lib/format";

type Props = {
  trackpoints: { recordedAt: string; speedMs: number | null }[];
  waves: { startTime: string; endTime: string }[];
  unit: SpeedUnit;
};

function convertSpeed(mps: number, unit: SpeedUnit): number {
  if (unit === "KMH") return mps * 3.6;
  if (unit === "MPH") return mps * 2.23694;
  return mps * 1.94384;
}

export function SpeedChart({ trackpoints, waves, unit }: Props) {
  const startMs = new Date(trackpoints[0]?.recordedAt ?? 0).getTime();

  const data = trackpoints.map((tp) => ({
    t: parseFloat(((new Date(tp.recordedAt).getTime() - startMs) / 60000).toFixed(2)),
    speed: tp.speedMs != null ? parseFloat(convertSpeed(tp.speedMs, unit).toFixed(2)) : undefined,
  }));

  const waveLines = waves.map((w) => ({
    t: parseFloat(((new Date(w.startTime).getTime() - startMs) / 60000).toFixed(2)),
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="speedGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="t"
          type="number"
          domain={["dataMin", "dataMax"]}
          tickFormatter={(v: number) => `${v.toFixed(0)}m`}
          tick={{ fontSize: 11 }}
        />
        <YAxis
          tickFormatter={(v: number) => `${v} ${speedUnitLabel(unit)}`}
          tick={{ fontSize: 11 }}
          width={55}
        />
        <Tooltip
          formatter={(value: unknown) => {
            if (typeof value === "number") return [`${value} ${speedUnitLabel(unit)}`, "Speed"];
            return ["—", "Speed"];
          }}
          labelFormatter={(label: unknown) => {
            if (typeof label === "number") return `${label.toFixed(1)} min`;
            return String(label);
          }}
        />
        {waveLines.map((w, i) => (
          <ReferenceLine key={i} x={w.t} stroke="#22c55e" strokeDasharray="3 3" strokeOpacity={0.8} />
        ))}
        <Area
          type="monotone"
          dataKey="speed"
          stroke="#3b82f6"
          strokeWidth={1.5}
          fill="url(#speedGradient)"
          connectNulls
          dot={false}
          activeDot={{ r: 3 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
