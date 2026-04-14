"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  START_SPEED_MS,
  SUSTAIN_SPEED_MS,
  PEAK_SPEED_MS,
  MAX_GAP_SECONDS,
  MIN_WAVE_DURATION_S,
  MIN_WAVE_DISTANCE_M,
} from "@/analysis/waveDetector";

// UI state stored in display units (km/h, s, m)
type Params = {
  startSpeedKmh: number;
  sustainSpeedKmh: number;
  peakSpeedKmh: number;
  minDurationS: number;
  minDistanceM: number;
  gapToleranceS: number;
};

const DEFAULTS: Params = {
  startSpeedKmh: Math.round(START_SPEED_MS * 3.6),
  sustainSpeedKmh: Math.round(SUSTAIN_SPEED_MS * 3.6),
  peakSpeedKmh: Math.round(PEAK_SPEED_MS * 3.6),
  minDurationS: MIN_WAVE_DURATION_S,
  minDistanceM: MIN_WAVE_DISTANCE_M,
  gapToleranceS: MAX_GAP_SECONDS,
};

type SliderField = {
  key: keyof Params;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
};

const FIELDS: SliderField[] = [
  { key: "startSpeedKmh",   label: "Min Start Speed",   unit: "km/h", min: 3,  max: 30,  step: 1 },
  { key: "sustainSpeedKmh", label: "Min Sustain Speed", unit: "km/h", min: 3,  max: 25,  step: 1 },
  { key: "peakSpeedKmh",    label: "Min Peak Speed",    unit: "km/h", min: 5,  max: 40,  step: 1 },
  { key: "minDurationS",    label: "Min Duration",      unit: "s",    min: 2,  max: 30,  step: 1 },
  { key: "minDistanceM",    label: "Min Distance",      unit: "m",    min: 5,  max: 100, step: 5 },
  { key: "gapToleranceS",   label: "Gap Tolerance",     unit: "s",    min: 1,  max: 10,  step: 1 },
];

function formatValue(value: number, unit: string): string {
  if (unit === "km/h") return `${value}km/h`;
  if (unit === "s") return `${value}s`;
  if (unit === "m") return `${value}m`;
  return String(value);
}

function sliderBg(value: number, min: number, max: number): string {
  const pct = ((value - min) / (max - min)) * 100;
  return `linear-gradient(to right, #4ade80 0%, #4ade80 ${pct}%, rgba(255,255,255,0.08) ${pct}%, rgba(255,255,255,0.08) 100%)`;
}

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

  function reanalyse() {
    setResult(null);
    startTransition(async () => {
      const res = await fetch(`/api/sessions/${sessionId}/reprocess`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startSpeedMs: params.startSpeedKmh / 3.6,
          sustainSpeedMs: params.sustainSpeedKmh / 3.6,
          peakSpeedMs: params.peakSpeedKmh / 3.6,
          minWaveDurationS: params.minDurationS,
          minWaveDistanceM: params.minDistanceM,
          maxGapSeconds: params.gapToleranceS,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setResult(`${data.waveCount} wave${data.waveCount === 1 ? "" : "s"} detected`);
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setResult(data.error ?? "Error");
      }
    });
  }

  return (
    <>
      <style>{`
        .wave-slider {
          -webkit-appearance: none;
          appearance: none;
          height: 2px;
          border-radius: 0;
          outline: none;
          cursor: pointer;
          width: 100%;
        }
        .wave-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #4ade80;
          cursor: pointer;
        }
        .wave-slider::-moz-range-thumb {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #4ade80;
          border: none;
          cursor: pointer;
        }
      `}</style>

      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full border-b border-border px-6 py-2 flex items-center justify-between hover:bg-muted/20 transition-colors"
      >
        <p className="text-[10px] tracking-widest uppercase text-muted-foreground">
          Wave Detection
        </p>
        <span className="text-[9px] tracking-widest uppercase text-muted-foreground/50">
          {open ? "Hide" : "Tune"}
        </span>
      </button>

      {open && <div className="border-b border-border px-6 py-3 flex items-center gap-4">
        {FIELDS.map(({ key, label, unit, min, max, step }, i) => (
          <div key={key} className={`flex items-center gap-3 min-w-0 flex-1 ${i > 0 ? "border-l border-border pl-4" : ""}`}>
            <div className="min-w-0 flex-1">
              <p className="text-[8px] tracking-widest uppercase text-muted-foreground mb-1.5 whitespace-nowrap">
                {label}
              </p>
              <input
                type="range"
                className="wave-slider"
                min={min}
                max={max}
                step={step}
                value={params[key]}
                style={{ background: sliderBg(params[key], min, max) }}
                onChange={(e) =>
                  setParams((prev) => ({ ...prev, [key]: parseFloat(e.target.value) }))
                }
                disabled={isPending}
              />
            </div>
            <span className="text-[9px] tracking-widest uppercase text-muted-foreground whitespace-nowrap tabular-nums shrink-0">
              {formatValue(params[key], unit)}
            </span>
          </div>
        ))}

        <div className="flex items-center gap-2 shrink-0 border-l border-border pl-4">
          {result && (
            <span className="text-[8px] tracking-widest uppercase text-muted-foreground whitespace-nowrap mr-2">
              {result}
            </span>
          )}
          <button
            onClick={reset}
            disabled={isPending}
            className="text-[8px] tracking-widest uppercase px-3 py-1.5 border border-border hover:border-foreground/40 transition-colors disabled:opacity-40 whitespace-nowrap"
          >
            Reset Defaults
          </button>
          <button
            onClick={reanalyse}
            disabled={isPending}
            className="text-[8px] tracking-widest uppercase px-3 py-1.5 border border-border hover:border-foreground/40 transition-colors disabled:opacity-40 whitespace-nowrap"
          >
            {isPending ? "Analysing…" : "Re-Analyse"}
          </button>
        </div>
      </div>}
    </>
  );
}
