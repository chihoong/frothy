import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-sky-50 to-white px-4">
      <div className="max-w-2xl text-center">
        <div className="mb-6 text-6xl">🌊</div>
        <h1 className="mb-4 text-5xl font-bold tracking-tight text-gray-900">
          Frothy
        </h1>
        <p className="mb-2 text-xl text-gray-600">
          Analyze your surf sessions with GPS precision.
        </p>
        <p className="mb-10 text-gray-500">
          Upload GPX files or sync from Strava to see your wave count, top
          speed, distance paddled, and an interactive map of every session.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button render={<Link href="/register" />} size="lg">
            Get started free
          </Button>
          <Button render={<Link href="/login" />} variant="outline" size="lg">
            Sign in
          </Button>
        </div>

        <div className="mt-16 grid grid-cols-3 gap-8 text-center">
          {[
            { icon: "📍", label: "Wave detection", desc: "Auto-detect waves from your GPS track" },
            { icon: "⚡", label: "Top speed", desc: "See your max speed on every wave" },
            { icon: "🏄", label: "Strava sync", desc: "Auto-import all your surf sessions" },
          ].map((f) => (
            <div key={f.label}>
              <div className="mb-2 text-3xl">{f.icon}</div>
              <div className="font-semibold text-gray-800">{f.label}</div>
              <div className="text-sm text-gray-500">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
