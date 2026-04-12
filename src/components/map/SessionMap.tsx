"use client";

import dynamic from "next/dynamic";

type Trackpoint = { lat: number; lng: number; speedMs: number | null };
type WaveMarker = { startLat: number; startLng: number; endLat: number; endLng: number };

type Props = {
  trackpoints: Trackpoint[];
  waves: WaveMarker[];
  centerLat: number;
  centerLng: number;
};

// Leaflet must only render on the client
const LeafletMap = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="h-96 w-full animate-pulse bg-gray-100" />
  ),
});

export function SessionMap(props: Props) {
  return <LeafletMap {...props} />;
}
