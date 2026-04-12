"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Polyline, CircleMarker, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

type Trackpoint = { lat: number; lng: number; speedMs: number | null };
type WaveMarker = { startLat: number; startLng: number; endLat: number; endLng: number };

type Props = {
  trackpoints: Trackpoint[];
  waves: WaveMarker[];
  centerLat: number;
  centerLng: number;
};

function FitBounds({ trackpoints }: { trackpoints: Trackpoint[] }) {
  const map = useMap();
  useEffect(() => {
    if (trackpoints.length === 0) return;
    const lats = trackpoints.map((t) => t.lat);
    const lngs = trackpoints.map((t) => t.lng);
    map.fitBounds([
      [Math.min(...lats), Math.min(...lngs)],
      [Math.max(...lats), Math.max(...lngs)],
    ], { padding: [20, 20] });
  }, [map, trackpoints]);
  return null;
}

export default function LeafletMap({ trackpoints, waves, centerLat, centerLng }: Props) {
  const positions = trackpoints.map((t) => [t.lat, t.lng] as [number, number]);

  return (
    <MapContainer
      center={[centerLat, centerLng]}
      zoom={14}
      style={{ height: 384, width: "100%" }}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {positions.length > 0 && (
        <Polyline positions={positions} color="#3b82f6" weight={2} opacity={0.7} />
      )}
      {waves.map((w, i) => (
        <CircleMarker
          key={i}
          center={[w.startLat, w.startLng]}
          radius={5}
          color="#22c55e"
          fillColor="#22c55e"
          fillOpacity={0.8}
        />
      ))}
      <FitBounds trackpoints={trackpoints} />
    </MapContainer>
  );
}
