"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { MapPin, Upload, X, Phone, Shield, ImagePlus, Loader2 } from "lucide-react";
import type { Listing, UserProfile } from "@/lib/types";
import { categories } from "@/lib/demo-data";
import { uid } from "@/lib/utils";
import { createListing } from "@/lib/supabase";
import dynamic from "next/dynamic";

// Dynamically import Map (SSR disabled — Leaflet is browser-only)
const MapPicker = dynamic(() => import("./MapPicker"), { ssr: false, loading: () => (
  <div className="flex h-56 items-center justify-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--bg2)] text-sm text-[var(--muted)]">
    <Loader2 className="animate-spin mr-2" size={16} /> Loading map…
  </div>
) });

interface Props {
  currentUser: UserProfile;
  onClose: () => void;
  onCreate: (listing: Listing, files?: File[]) => void;
}

export default function ListingFormModal({ currentUser, onClose, onCreate }: Props) {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [lat, setLat] = useState<number | undefined>();
  const [lng, setLng] = useState<number | undefined>();
  const [address, setAddress] = useState("");
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reverse geocode when lat/lng changes
  useEffect(() => {
    if (lat == null || lng == null) return;
    fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`)
      .then((r) => r.json())
      .then((d) => { if (d.display_name) setAddress(d.display_name); })
      .catch(() => {});
  }, [lat, lng]);

  const addFiles = useCallback((incoming: File[]) => {
    const valid = incoming.filter((f) => f.type.startsWith("image/")).slice(0, 5 - files.length);
    setFiles((prev) => [...prev, ...valid]);
    valid.forEach((f) => {
      const reader = new FileReader();
      reader.onload = (e) => setPreviews((prev) => [...prev, e.target?.result as string]);
      reader.readAsDataURL(f);
    });
  }, [files.length]);

  const removeFile = (index: number) => {
    setFiles((f) => f.filter((_, i) => i !== index));
    setPreviews((p) => p.filter((_, i) => i !== index));
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const data = new FormData(e.currentTarget);
    const listing: Listing = {
      id: uid("lst"),
      ownerId: currentUser.id,
      ownerName: currentUser.name,
      ownerAvatar: currentUser.avatar,
      ownerRating: currentUser.rating,
      title: String(data.get("title") ?? ""),
      description: String(data.get("description") ?? ""),
      category: String(data.get("category") ?? "Electronics"),
      city: String(data.get("city") ?? ""),
      area: String(data.get("area") ?? ""),
      address,
      lat,
      lng,
      phone: String(data.get("phone") ?? ""),
      securityRemarks: String(data.get("securityRemarks") ?? ""),
      pricePerDay: Number(data.get("price") ?? 0),
      securityDeposit: Number(data.get("deposit") ?? 0),
      delivery: data.get("delivery") as Listing["delivery"],
      availability: "available",
      availableFrom: String(data.get("from") ?? ""),
      availableTo: String(data.get("to") ?? ""),
      images: previews.length > 0 ? previews : ["https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80"],
      rating: 5,
      reviewCount: 0,
      badge: "New",
      featured: false,
      createdAt: new Date().toISOString(),
      reports: 0,
    };
    onCreate(listing, files.length > 0 ? files : undefined);
    setBusy(false);
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <form
        className="modal-card w-full max-w-4xl max-h-[92vh] overflow-y-auto"
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" onClick={onClose} className="absolute right-5 top-5 icon-btn z-10">
          <X size={18} />
        </button>

        <div className="section-eyebrow">List an item</div>
        <h2 className="mt-2 text-3xl font-black mb-6">What are you renting out?</h2>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* LEFT — Photos + Map */}
          <div className="flex flex-col gap-4">
            {/* Drag-drop zone */}
            <div
              className={`relative rounded-2xl border-2 border-dashed transition-colors cursor-pointer ${dragOver ? "border-orange-500 bg-orange-500/5" : "border-[var(--border)] bg-[var(--bg2)]"}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(Array.from(e.dataTransfer.files)); }}
              onClick={() => fileInputRef.current?.click()}
            >
              <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => addFiles(Array.from(e.target.files ?? []))} />
              {previews.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-10 text-[var(--muted)]">
                  <ImagePlus size={32} className="text-orange-500" />
                  <p className="text-sm font-bold">Drag photos here or click to upload</p>
                  <p className="text-xs">Up to 5 images · JPG, PNG, WebP</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 p-3">
                  {previews.map((src, i) => (
                    <div key={i} className="relative aspect-square overflow-hidden rounded-xl">
                      <img src={src} className="h-full w-full object-cover" alt="" />
                      <button type="button" onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                        className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white hover:bg-red-500">
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  {previews.length < 5 && (
                    <div className="flex aspect-square items-center justify-center rounded-xl border-2 border-dashed border-[var(--border)] text-[var(--muted)]">
                      <Upload size={20} />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Map picker */}
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-bold">
                <MapPin size={16} className="text-orange-500" />
                Pin your location
              </div>
              <MapPicker lat={lat} lng={lng} onChange={(la, lo) => { setLat(la); setLng(lo); }} />
              {address && (
                <p className="mt-2 text-xs text-[var(--muted)] leading-5">📍 {address}</p>
              )}
            </div>

            {/* Address override */}
            <label className="label">
              Full address (auto-filled from map, edit if needed)
              <input className="input" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street, Area, City, PIN" />
            </label>
          </div>

          {/* RIGHT — Details */}
          <div className="flex flex-col gap-3">
            <label className="label">Item title <input className="input" name="title" placeholder="e.g. Sony A7 IV Camera Kit" required /></label>
            <label className="label">Description <textarea className="input min-h-[80px]" name="description" placeholder="What's included, condition, pickup instructions…" required /></label>

            <div className="grid grid-cols-2 gap-3">
              <label className="label">Category
                <select className="input" name="category">
                  {categories.filter((c) => c !== "All").map((c) => <option key={c}>{c}</option>)}
                </select>
              </label>
              <label className="label">City <input className="input" name="city" placeholder="Bangalore" required /></label>
              <label className="label">Area / Locality <input className="input" name="area" placeholder="Koramangala" required /></label>
              <label className="label">Delivery
                <select className="input" name="delivery">
                  <option value="pickup">Pickup only</option>
                  <option value="delivery">Delivery available</option>
                  <option value="both">Both</option>
                </select>
              </label>
              <label className="label">Price per day (₹) <input className="input" name="price" type="number" min={1} placeholder="500" required /></label>
              <label className="label">Security deposit (₹) <input className="input" name="deposit" type="number" min={0} placeholder="2000" required /></label>
              <label className="label">Available from <input className="input" name="from" type="date" required /></label>
              <label className="label">Available to <input className="input" name="to" type="date" required /></label>
            </div>

            {/* Phone */}
            <label className="label">
              <span className="flex items-center gap-2"><Phone size={14} className="text-orange-500" />Your contact number</span>
              <input className="input" name="phone" type="tel" placeholder="+91 9876543210" required />
            </label>

            {/* Security remarks */}
            <label className="label">
              <span className="flex items-center gap-2"><Shield size={14} className="text-orange-500" />Security / renter requirements</span>
              <textarea className="input min-h-[72px]" name="securityRemarks"
                placeholder="e.g. ID proof required, cash deposit on pickup, no pets, 2-day minimum rental…" />
            </label>

            <button type="submit" disabled={busy} className="btn-primary mt-2 h-12 w-full">
              {busy ? <><Loader2 size={16} className="animate-spin" /> Publishing…</> : <><Upload size={16} />Publish listing</>}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
