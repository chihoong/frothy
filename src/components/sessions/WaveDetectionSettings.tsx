"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  WAVE_SPEED_THRESHOLD_MS,
  BEARING_TOLERANCE_DEG,
  MAX_GAP_SECONDS,
  MIN_WAVE_DURATION_S,
  MAX_WAVE_DURATION_S,
  MIN_WAVE_DISTANCE_M,
  MIN_WAVE_GAP_S,
} from "@/analysis/waveDetector";

type Params = {
  speedThresholdMs: number;
  bearingToleranceDeg: number;
  maxGapSeconds: number;
  minWaveDurationS: number;
  maxWaveDurationS: number;
  minWaveDistanceM: number;
  minWaveGapS: number;
};

const DEFAULTS: Params = {
  speedThresholdMs: WAVE_SPEED_THRESHOLD_MS,
  bearingToleranceDeg: BEARING_TOLERANCE_DEG,
  maxGapSeconds: MAX_GAP_SECONDS,
  minWaveDurationS: MIN_WAVE_DURATION_S,
  maxWaveDurationS: MAX_WAVE_DURATION_S,
  minWaveDistanceM: MIN_WAVE_DISTANCE_M,
  minWaveGapS: MIN_WAVE_GAP_S,
};

const FIELDS: {
  key: keyof Params;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
}[] = [
  { key: "speedThresholdMs", label: "Speed Threshold", unit: "m/s", min: 0.5, max: 6, step: 0.1 },
  { key: "minWaveDurationS", label: "Min Duration", unit: "s", min: 1, max: 30, step: 1 },
  { key: "maxWaveDurationS", label: "Max Duration", unit: "s", min: 20, max: 180, step: 5 },
  { key: "minWaveDistanceM", label: "Min Distance", unit: "m", min: 5, max: 100, step: 5 },
  { key: "bearingToleranceDeg", label: "Bearing Tolerance", unit: "°", min: 15, max: 180, step: 5 },
  { key: "minWaveGapS", label: "Min Wave Gap", unit: "s", min: 5, max: 60, step: 5 },
  { key: "maxGapSeconds", label: "Max In-Wave Gap", unit: "s", min: 1, max: 15, step: 1 },
];

export function WaveDetectionSettings({ sessionId }: { sessionId: string }) {
  const [open, setOpen] = useState(false);
  const [params, setParams] = useState<Params>(DEFAULTS);
  const [result, setResult] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function reset() {
    setParams(DEFAULTS);
    setResult(null);
  }

  function apply() {
    setResult(null);
    startTransition(async () => {
      const res = await fetch(`/api/sessions/${sessionId}/reprocess`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      if (res.ok) {
        const data = await res.json();
        setResult(`${data.waveCount} wave${data.waveCount === 1 ? "" : "s"} detected`);
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setResult(data.error ?? "Error applying settings");
      }
    });
  }

  return (
    <div className="border-t border-border">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full px-6 py-2 flex items-center justify-between text-left hover:bg-muted/30 transition-colors"
      >
        <p className="text-[10px] tracking-widest uppercase text-muted-foreground">
          Wave Detection Settings
        </p>
        <span className="text-[9px] tracking-widest uppercase text-muted-foreground/60">
          {open ? "Close" : "Adjust"}
        </span>
      </button>

      {open && (
        <div className="border-t border-border px-6 py-5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {FIELDS.map(({ key, label, unit, min, max, step }) => (
              <div key={key}>
                <div className="flex items-baseline justify-between mb-2">
                  <label className="text-[9px] tracking-widest uppercase text-muted-foreground">
                    {label}
                  </label>
                  <span className="text-xs font-light tabular-nums">
                    {params[key].toFixed(step < 1 ? 1 : 0)}{" "}
                    <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">
                      {unit}
                    </span>
                  </span>
                </div>
                <input
                  type="range"
                  min={min}
                  max={max}
                  step={step}
                  value={params[key]}
                  onChange={(e) =>
                    setParams((prev) => ({ ...prev, [key]: parseFloat(e.target.value) }))
                  }
                  className="w-full h-px appearance-none bg-border cursor-pointer accent-foreground"
                />
                <div className="flex justify-between mt-1">
                  <span className="text-[9px] text-muted-foreground/40 tabular-nums">{min}{unit}</span>
                  <span className="text-[9px] text-muted-foreground/40 tabular-nums">{max}{unit}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-4 mt-6">
            <button
              onClick={apply}
              disabled={isPending}
              className="text-[10px] tracking-widest uppercase px-4 py-2 border border-foreground bg-foreground text-background hover:bg-foreground/90 transition-colors disabled:opacity-40"
            >
              {isPending ? "Applying…" : "Apply"}
            </button>
            <button
              onClick={reset}
              disabled={isPending}
              className="text-[10px] tracking-widest uppercase px-4 py-2 border border-border hover:border-foreground/40 transition-colors disabled:opacity-40"
            >
              Reset
            </button>
            {result && (
              <p className="text-[10px] tracking-widest uppercase text-muted-foreground ml-auto">
                {result}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
