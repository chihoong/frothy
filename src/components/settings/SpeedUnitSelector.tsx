"use client";

import { useEffect, useState, useTransition } from "react";
import type { SpeedUnit } from "@/lib/format";

const OPTIONS: { value: SpeedUnit; label: string; description: string }[] = [
  { value: "KNOTS", label: "Knots", description: "kts — nautical standard" },
  { value: "KMH", label: "Kilometres/h", description: "km/h — metric" },
  { value: "MPH", label: "Miles/h", description: "mph — imperial" },
];

export function SpeedUnitSelector() {
  const [current, setCurrent] = useState<SpeedUnit>("KMH");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    fetch("/api/user/preferences")
      .then((r) => r.json())
      .then((d) => setCurrent(d.speedUnit));
  }, []);

  function select(unit: SpeedUnit) {
    setCurrent(unit);
    startTransition(async () => {
      await fetch("/api/user/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ speedUnit: unit }),
      });
    });
  }

  return (
    <div className="border border-border">
      <div className="px-5 py-3 border-b border-border bg-muted/40">
        <p className="text-[9px] tracking-widest uppercase text-muted-foreground">Speed Units</p>
      </div>
      <div className="divide-y divide-border">
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => select(opt.value)}
            disabled={isPending}
            className={`w-full flex items-center justify-between px-5 py-4 text-left transition-colors ${
              current === opt.value ? "bg-muted/40" : "hover:bg-muted/20"
            }`}
          >
            <div>
              <p className="text-xs tracking-wide uppercase font-medium mb-0.5">{opt.label}</p>
              <p className="text-[10px] tracking-widest text-muted-foreground uppercase">{opt.description}</p>
            </div>
            {current === opt.value && (
              <span className="text-[9px] tracking-widest uppercase text-muted-foreground">● Active</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
