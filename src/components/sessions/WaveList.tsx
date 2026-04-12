"use client";

import { mpsToKnots } from "@/analysis/metrics";

type Wave = {
  id: string;
  waveNumber: number;
  durationSeconds: number;
  distanceMeters: number;
  maxSpeedMs: number;
  avgSpeedMs: number;
};

export function WaveList({ waves }: { waves: Wave[] }) {
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
                {mpsToKnots(w.maxSpeedMs).toFixed(1)} kts
              </td>
              <td className="py-2">{mpsToKnots(w.avgSpeedMs).toFixed(1)} kts</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
