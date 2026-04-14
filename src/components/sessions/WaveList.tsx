"use client";

import { formatSpeed, type SpeedUnit } from "@/lib/format";

type Wave = {
  id: string;
  waveNumber: number;
  durationSeconds: number;
  distanceMeters: number;
  maxSpeedMs: number;
  avgSpeedMs: number;
};

export function WaveList({ waves, unit }: { waves: Wave[]; unit: SpeedUnit }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-gray-500">
            <th className="py-2 pr-4 font-medium">#</th>
            <th className="py-2 pr-4 font-medium">Duration</th>
            <th className="py-2 pr-4 font-medium">Distance</th>
            <th className="py-2 pr-4 font-medium">Top speed</th>
            <th className="py-2 font-medium">Avg speed</th>
          </tr>
        </thead>
        <tbody>
          {waves.map((w) => (
            <tr key={w.id} className="border-b last:border-0 hover:bg-gray-50">
              <td className="py-2 pr-4 font-medium">{w.waveNumber}</td>
              <td className="py-2 pr-4">{w.durationSeconds.toFixed(0)}s</td>
              <td className="py-2 pr-4">{w.distanceMeters.toFixed(0)} m</td>
              <td className="py-2 pr-4 font-medium text-blue-600">
                {formatSpeed(w.maxSpeedMs, unit)}
              </td>
              <td className="py-2">{formatSpeed(w.avgSpeedMs, unit)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
