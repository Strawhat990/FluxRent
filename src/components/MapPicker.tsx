"use client";

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapPin, Locate, Search, Loader2 } from "lucide-react";

// Fix default Leaflet marker icons (webpack breaks the default URL resolution)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface Props {
  lat?: number;
  lng?: number;
  onChange: (lat: number, lng: number, address?: string) => void;
}

export default function MapPicker({ lat, lng, onChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [locating, setLocating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");

  // Move marker + map view to a given coord and fire onChange
  const moveToCoord = (la: number, lo: number, resolvedAddress?: string) => {
    if (markerRef.current) markerRef.current.setLatLng([la, lo]);
    if (mapRef.current) mapRef.current.setView([la, lo], 15);
    onChange(la, lo, resolvedAddress);
  };

  // Reverse geocode helper
  const reverseGeocode = async (la: number, lo: number) => {
    try {
      const r = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${la}&lon=${lo}&format=json`,
        { headers: { "Accept-Language": "en" } }
      );
      const d = await r.json();
      return d.display_name as string | undefined;
    } catch {
      return undefined;
    }
  };

  // GPS auto-detect
  const detectLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const la = pos.coords.latitude;
        const lo = pos.coords.longitude;
        const addr = await reverseGeocode(la, lo);
        moveToCoord(la, lo, addr);
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Forward geocode – search by address text
  const searchAddress = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setSearchError("");
    try {
      const r = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1`,
        { headers: { "Accept-Language": "en" } }
      );
      const results = await r.json();
      if (results.length === 0) {
        setSearchError("Address not found. Try a more specific term.");
      } else {
        const la = parseFloat(results[0].lat);
        const lo = parseFloat(results[0].lon);
        moveToCoord(la, lo, results[0].display_name);
      }
    } catch {
      setSearchError("Search failed. Please try again.");
    } finally {
      setSearching(false);
    }
  };

  // Init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const defaultLat = lat ?? 20.5937; // India center
    const defaultLng = lng ?? 78.9629;

    const map = L.map(containerRef.current, {
      center: [defaultLat, defaultLng],
      zoom: lat != null ? 14 : 5,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);

    const marker = L.marker([defaultLat, defaultLng], { draggable: true }).addTo(map);
    marker.on("dragend", async () => {
      const pos = marker.getLatLng();
      const addr = await reverseGeocode(pos.lat, pos.lng);
      onChange(pos.lat, pos.lng, addr);
    });

    map.on("click", async (e) => {
      marker.setLatLng(e.latlng);
      const addr = await reverseGeocode(e.latlng.lat, e.latlng.lng);
      onChange(e.latlng.lat, e.latlng.lng, addr);
    });

    mapRef.current = map;
    markerRef.current = marker;

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync external lat/lng changes to marker
  useEffect(() => {
    if (lat != null && lng != null && markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
      mapRef.current?.setView([lat, lng], 15);
    }
  }, [lat, lng]);

  return (
    <div className="flex flex-col gap-2">
      {/* Address search bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
          <input
            className="input h-10 pl-8 pr-3 text-sm w-full"
            placeholder="Search by address or place name…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), searchAddress())}
          />
        </div>
        <button
          type="button"
          onClick={searchAddress}
          disabled={searching}
          className="btn-secondary h-10 px-3 text-sm"
          title="Search address"
        >
          {searching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
        </button>
        {/* GPS detect button */}
        <button
          type="button"
          onClick={detectLocation}
          disabled={locating}
          className="btn-secondary h-10 px-3 text-sm flex items-center gap-1"
          title="Use my current location"
        >
          {locating ? <Loader2 size={14} className="animate-spin" /> : <Locate size={14} />}
          {!locating && <span className="hidden sm:inline text-xs">GPS</span>}
        </button>
      </div>

      {searchError && (
        <p className="text-xs text-red-400">{searchError}</p>
      )}

      {/* Map */}
      <div
        ref={containerRef}
        className="h-56 w-full rounded-2xl overflow-hidden border border-[var(--border)]"
        style={{ zIndex: 0 }}
      />

      <p className="flex items-center gap-1 text-xs text-[var(--muted)]">
        <MapPin size={11} />
        Click on the map, drag the pin, search by address, or use GPS to set your location.
      </p>
    </div>
  );
}
