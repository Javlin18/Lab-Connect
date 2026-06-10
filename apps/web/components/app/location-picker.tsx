"use client";

import { Loader2, MapPin, Navigation, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface LocationData {
  address: string;
  city: string;
  pincode: string;
  landmark: string;
  latitude: number | null;
  longitude: number | null;
}

interface LocationPickerProps {
  value: LocationData;
  onChange: (loc: LocationData) => void;
}

// ── Reverse geocode using OpenStreetMap Nominatim (free, no API key) ─────────
async function reverseGeocode(lat: number, lon: number): Promise<Partial<LocationData>> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`,
      { headers: { "Accept-Language": "en" } }
    );
    const data = await res.json();
    const addr = data.address ?? {};

    const road      = addr.road ?? addr.pedestrian ?? addr.street ?? "";
    const suburb    = addr.suburb ?? addr.neighbourhood ?? addr.hamlet ?? "";
    const city      = addr.city ?? addr.town ?? addr.village ?? addr.county ?? "";
    const state     = addr.state ?? "";
    const pincode   = addr.postcode ?? "";
    const country   = addr.country ?? "";

    const addressLine = [road, suburb, city, state, country].filter(Boolean).join(", ");

    return { address: addressLine, city, pincode, latitude: lat, longitude: lon };
  } catch {
    return { latitude: lat, longitude: lon };
  }
}

// ── Geocode an address string ─────────────────────────────────────────────────
async function geocodeAddress(query: string): Promise<{ lat: number; lon: number; display: string } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1&countrycodes=in`,
      { headers: { "Accept-Language": "en" } }
    );
    const results = await res.json();
    if (!results?.length) return null;
    const r = results[0];
    return { lat: parseFloat(r.lat), lon: parseFloat(r.lon), display: r.display_name };
  } catch {
    return null;
  }
}

// ── Search suggestions ────────────────────────────────────────────────────────
async function searchPlaces(query: string): Promise<{ display_name: string; lat: string; lon: string; address: any }[]> {
  if (query.length < 3) return [];
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&countrycodes=in&addressdetails=1`,
      { headers: { "Accept-Language": "en" } }
    );
    return await res.json();
  } catch {
    return [];
  }
}

export function LocationPicker({ value, onChange }: LocationPickerProps) {
  const [detecting, setDetecting]     = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [searchTimer, setSearchTimer] = useState<NodeJS.Timeout | null>(null);
  const [showSug, setShowSug]         = useState(false);
  const sugRef = useRef<HTMLDivElement>(null);

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sugRef.current && !sugRef.current.contains(e.target as Node)) {
        setShowSug(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const detectLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const geoData = await reverseGeocode(latitude, longitude);
        onChange({ ...value, ...geoData, latitude, longitude });
        setDetecting(false);
      },
      (err) => {
        setDetecting(false);
        const msgs: Record<number, string> = {
          1: "Location access denied. Please allow location permission.",
          2: "Unable to determine location. Try entering manually.",
          3: "Location request timed out.",
        };
        alert(msgs[err.code] ?? "Location error.");
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  };

  const handleAddressChange = (val: string) => {
    onChange({ ...value, address: val });
    if (searchTimer) clearTimeout(searchTimer);
    const t = setTimeout(async () => {
      const results = await searchPlaces(val);
      setSuggestions(results);
      setShowSug(results.length > 0);
    }, 400);
    setSearchTimer(t);
  };

  const selectSuggestion = (sug: any) => {
    const addr    = sug.address ?? {};
    const city    = addr.city ?? addr.town ?? addr.village ?? addr.county ?? "";
    const pincode = addr.postcode ?? "";
    onChange({
      ...value,
      address:   sug.display_name,
      city,
      pincode,
      latitude:  parseFloat(sug.lat),
      longitude: parseFloat(sug.lon),
    });
    setSuggestions([]);
    setShowSug(false);
  };

  return (
    <div className="space-y-4">

      {/* Address autocomplete */}
      <div className="space-y-1.5" ref={sugRef}>
        <Label htmlFor="loc-address">
          Collection Address *
        </Label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <Input
            autoComplete="off"
            className="pl-9 pr-10 rounded-xl h-11 border-slate-200 focus:border-red-400"
            id="loc-address"
            onChange={(e) => handleAddressChange(e.target.value)}
            placeholder="Start typing your address…"
            value={value.address}
          />
          {value.address && (
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition"
              onClick={() => { onChange({ ...value, address: "" }); setSuggestions([]); }}
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          {/* Suggestions dropdown */}
          {showSug && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden">
              {suggestions.slice(0, 5).map((sug, i) => (
                <button
                  className="flex items-start gap-3 w-full px-4 py-3 text-left hover:bg-red-50 transition border-b border-slate-50 last:border-0"
                  key={i}
                  onClick={() => selectSuggestion(sug)}
                  type="button"
                >
                  <MapPin className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <span className="text-xs text-slate-700 line-clamp-2">{sug.display_name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Detect location button */}
        <button
          className={`flex items-center gap-2 text-xs font-semibold transition px-3 py-2 rounded-xl border w-full justify-center ${
            detecting
              ? "border-slate-200 text-slate-400 bg-slate-50"
              : "border-red-200 text-red-600 bg-red-50 hover:bg-red-100"
          }`}
          disabled={detecting}
          onClick={detectLocation}
          type="button"
        >
          {detecting ? (
            <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Detecting location…</>
          ) : (
            <><Navigation className="h-3.5 w-3.5" /> Use My Current Location</>
          )}
        </button>

        {/* Coords indicator */}
        {value.latitude && value.longitude && (
          <div className="flex items-center gap-2 text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
            <Navigation className="h-3 w-3" />
            <span>Location pinned: {value.latitude.toFixed(4)}, {value.longitude.toFixed(4)}</span>
          </div>
        )}
      </div>

      {/* City + Pincode row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="loc-city">City *</Label>
          <Input
            className="rounded-xl h-10 border-slate-200"
            id="loc-city"
            onChange={(e) => onChange({ ...value, city: e.target.value })}
            placeholder="New Delhi"
            value={value.city}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="loc-pincode">Pincode *</Label>
          <Input
            className="rounded-xl h-10 border-slate-200"
            id="loc-pincode"
            maxLength={6}
            onChange={(e) => onChange({ ...value, pincode: e.target.value })}
            placeholder="110001"
            value={value.pincode}
          />
        </div>
      </div>

      {/* Landmark */}
      <div className="space-y-1.5">
        <Label htmlFor="loc-landmark">Landmark (Optional)</Label>
        <Input
          className="rounded-xl h-10 border-slate-200"
          id="loc-landmark"
          onChange={(e) => onChange({ ...value, landmark: e.target.value })}
          placeholder="Near Metro Station, Opposite Park…"
          value={value.landmark}
        />
      </div>
    </div>
  );
}
