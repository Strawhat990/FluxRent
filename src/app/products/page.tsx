"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Filter, MapPin, SlidersHorizontal, Star, Heart, Phone,
  MessageCircle, Clock, ShieldCheck, Package, ChevronDown,
  X, Moon, Sun, ArrowLeft, ChevronLeft, ChevronRight,
} from "lucide-react";
import { categories } from "@/lib/demo-data";
import { cn, formatInr, getDistanceInKm, getFreshnessLabel } from "@/lib/utils";
import {
  fetchListings, isSupabaseConfigured, addFavorite, removeFavorite,
  fetchFavorites, getSupabaseBrowserClient,
} from "@/lib/supabase";
import type { Listing } from "@/lib/types";

function usePersistedState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  useEffect(() => {
    try { const s = window.localStorage.getItem(key); if (s) setValue(JSON.parse(s) as T); } catch { setValue(initial); }
  }, [initial, key]);
  useEffect(() => { window.localStorage.setItem(key, JSON.stringify(value)); }, [key, value]);
  return [value, setValue] as const;
}

export default function ProductsPage() {
  const [theme, setTheme] = usePersistedState<"light" | "dark">("leasify-theme", "light");
  const [listings, setListings] = useState<Listing[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  // Filters
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [city, setCity] = useState("All");
  const [maxPrice, setMaxPrice] = useState(5000);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"relevance" | "priceAsc" | "priceDesc" | "newest" | "rating">("relevance");
  const [delivery, setDelivery] = useState<"all" | "pickup" | "delivery" | "both">("all");
  const [showFilters, setShowFilters] = useState(false);

  // Selected listing detail
  const [selected, setSelected] = useState<Listing | null>(null);
  const [activeImg, setActiveImg] = useState(0);

  useEffect(() => { document.documentElement.classList.toggle("dark", theme === "dark"); }, [theme]);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    fetchListings().then((d) => { if (d.length > 0) setListings(d); });
    const sb = getSupabaseBrowserClient();
    if (!sb) return;
    sb.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserId(data.user.id);
        fetchFavorites(data.user.id).then(setFavorites);
      }
    });
  }, []);

  const cities = ["All", ...Array.from(new Set(listings.map((l) => l.city)))];

  const filtered = useMemo(() => {
    const text = query.trim().toLowerCase();
    const result = listings.filter((l) => {
      const mt = !text || [l.title, l.description, l.category, l.city, l.area, l.ownerName].join(" ").toLowerCase().includes(text);
      const mc = category === "All" || l.category === category;
      const mci = city === "All" || l.city === city;
      const mp = l.pricePerDay <= maxPrice;
      const ma = !availableOnly || l.availability === "available";
      const md = delivery === "all" || l.delivery === delivery;
      return mt && mc && mci && mp && ma && md;
    });
    if (sortBy === "priceAsc") result.sort((a, b) => a.pricePerDay - b.pricePerDay);
    else if (sortBy === "priceDesc") result.sort((a, b) => b.pricePerDay - a.pricePerDay);
    else if (sortBy === "newest") result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    else if (sortBy === "rating") result.sort((a, b) => b.rating - a.rating);
    return result;
  }, [query, category, city, maxPrice, availableOnly, sortBy, delivery, listings]);

  function toggleFav(listing: Listing) {
    if (!userId) return;
    const isFav = favorites.includes(listing.id);
    setFavorites((c) => isFav ? c.filter((id) => id !== listing.id) : [...c, listing.id]);
    if (isFav) removeFavorite(userId, listing.id); else addFavorite(userId, listing.id);
  }

  const activeFilters = [category !== "All", city !== "All", maxPrice < 5000, availableOnly, delivery !== "all"].filter(Boolean).length;

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--bg)]/90 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 md:px-8">
          <a href="/" className="flex items-center gap-2 text-sm font-bold text-[var(--muted)] hover:text-[var(--text)] transition">
            <ArrowLeft size={16} /> Home
          </a>
          <div className="brand text-lg ml-1">Leas<span style={{ color: 'var(--accent)' }}>ify</span></div>
          <div className="flex-1" />
          <button className="icon-btn" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 md:px-8">
        {/* Search bar */}
        <div className="flex gap-2">
          <label className="field flex-1">
            <Search size={18} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products, categories, locations..." className="bg-transparent border-0 outline-0 w-full font-bold text-[var(--text)]" />
            {query && <button onClick={() => setQuery("")} className="text-[var(--muted)]"><X size={16} /></button>}
          </label>
          <button className="btn-primary h-14 px-5 relative" onClick={() => setShowFilters(!showFilters)}>
            <SlidersHorizontal size={16} />
            <span className="hidden sm:inline">Filters</span>
            {activeFilters > 0 && <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs font-black rounded-full h-5 w-5 flex items-center justify-center">{activeFilters}</span>}
          </button>
        </div>

        {/* Category pills */}
        <div className="mt-4 flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
          {categories.map((cat) => (
            <button key={cat} className={cn("pill shrink-0", category === cat && "pill-active")} onClick={() => setCategory(cat)}>{cat}</button>
          ))}
        </div>

        {/* Advanced filters panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              className="mt-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 sm:p-5 shadow-lg"
              initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              style={{ overflow: "hidden" }}
            >
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* City */}
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-[var(--muted)] mb-1.5">City</div>
                  <select className="input h-10 text-sm" value={city} onChange={(e) => setCity(e.target.value)}>
                    {cities.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                {/* Price */}
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-[var(--muted)] mb-1.5">
                    Max price: {maxPrice >= 5000 ? "Any" : formatInr(maxPrice)}
                  </div>
                  <input type="range" className="range-input" min={100} max={5000} step={100} value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} />
                </div>
                {/* Delivery */}
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-[var(--muted)] mb-1.5">Delivery</div>
                  <select className="input h-10 text-sm" value={delivery} onChange={(e) => setDelivery(e.target.value as any)}>
                    <option value="all">Any</option>
                    <option value="pickup">Pickup only</option>
                    <option value="delivery">Delivery available</option>
                    <option value="both">Both</option>
                  </select>
                </div>
                {/* Sort */}
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-[var(--muted)] mb-1.5">Sort by</div>
                  <select className="input h-10 text-sm" value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
                    <option value="relevance">Relevance</option>
                    <option value="priceAsc">Price: Low → High</option>
                    <option value="priceDesc">Price: High → Low</option>
                    <option value="newest">Newest first</option>
                    <option value="rating">Highest rated</option>
                  </select>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-4">
                <label className="toggle-label text-sm">
                  <input type="checkbox" checked={availableOnly} onChange={(e) => setAvailableOnly(e.target.checked)} />
                  <span>Available now only</span>
                </label>
                <button className="text-xs font-bold text-[var(--accent)] hover:underline" onClick={() => { setCategory("All"); setCity("All"); setMaxPrice(5000); setAvailableOnly(false); setDelivery("all"); setSortBy("relevance"); }}>
                  Clear all filters
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results header */}
        <div className="mt-5 flex items-center justify-between text-sm text-[var(--muted)]">
          <span className="font-bold">{filtered.length} product{filtered.length !== 1 ? "s" : ""} found</span>
          <select className="bg-transparent border-0 outline-0 font-bold text-[var(--text)] text-sm cursor-pointer" value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
            <option value="relevance">Relevance</option>
            <option value="priceAsc">Price ↑</option>
            <option value="priceDesc">Price ↓</option>
            <option value="newest">Newest</option>
            <option value="rating">Rating</option>
          </select>
        </div>

        {/* Product grid */}
        <div className="mt-4 grid gap-4 grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filtered.map((listing) => {
            const freshness = getFreshnessLabel(listing.createdAt);
            const isFav = favorites.includes(listing.id);
            return (
              <article key={listing.id} className="listing-card group" onClick={() => { setSelected(listing); setActiveImg(0); }}>
                <div className="relative overflow-hidden">
                  <img className="h-36 sm:h-40 w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110" src={listing.images[0]} alt={listing.title} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  {listing.badge && <div className="absolute left-2.5 top-2.5 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider backdrop-blur-md shadow-sm">{listing.badge}</div>}
                  {listing.images.length > 1 && <div className="absolute left-2.5 bottom-2 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">{listing.images.length} photos</div>}
                  <div className={`freshness-chip absolute bottom-2 right-10 ${freshness.cls}`}><Clock size={8} />{freshness.label}</div>
                  <button className={cn("heart-btn !h-7 !w-7 transition-transform duration-200 hover:scale-110", isFav && "heart-active")} onClick={(e) => { e.stopPropagation(); toggleFav(listing); }}>
                    <Heart size={12} fill={isFav ? "currentColor" : "none"} />
                  </button>
                  {/* Hover action overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-2.5 flex gap-1.5 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out z-10">
                    {listing.phone && (
                      <button className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-emerald-500/90 backdrop-blur-sm py-1.5 text-[10px] font-black text-white hover:bg-emerald-500 transition" onClick={(e) => { e.stopPropagation(); alert(`Phone: ${listing.phone}`); }}>
                        <Phone size={10} /> Call
                      </button>
                    )}
                    <button className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-white/90 backdrop-blur-sm py-1.5 text-[10px] font-black text-stone-900 hover:bg-white transition" onClick={(e) => { e.stopPropagation(); /* would open chat */ }}>
                      <MessageCircle size={10} /> Chat
                    </button>
                  </div>
                </div>
                <div className="p-3 sm:p-3.5">
                  <div className="flex items-center justify-between text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                    <span>{listing.category}</span>
                    <span className="flex items-center gap-0.5"><Star size={10} className="fill-amber-400 text-amber-400" />{listing.rating}</span>
                  </div>
                  <h3 className="mt-1 line-clamp-1 text-sm sm:text-base font-black group-hover:text-[var(--accent)] transition-colors duration-200">{listing.title}</h3>
                  <div className="mt-1 flex items-center gap-1 text-xs text-[var(--muted)]">
                    <MapPin size={11} /><span className="line-clamp-1">{listing.area}, {listing.city}</span>
                  </div>
                  <div className="mt-2.5 flex items-end justify-between border-t border-[var(--border)] pt-2">
                    <div>
                      <div className="text-base sm:text-lg font-black">{formatInr(listing.pricePerDay)}</div>
                      <div className="text-[10px] font-bold text-[var(--muted)]">per day</div>
                    </div>
                    <div className="text-right text-[10px] text-[var(--muted)]">
                      <div className="flex items-center gap-1 font-black text-[var(--text)]">
                        {listing.ownerName}
                        {listing.ownerRating >= 4.5 && listing.reviewCount >= 5 && <ShieldCheck size={10} className="text-emerald-500" />}
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="mt-12 rounded-[24px] border border-dashed border-[var(--border)] bg-[var(--card)] p-8 text-center">
            <Package className="mx-auto text-orange-500" size={28} />
            <h3 className="mt-3 text-xl font-black">No products match your filters</h3>
            <p className="mt-2 text-sm text-[var(--muted)]">Try different keywords, categories, or widen your price range.</p>
          </div>
        )}
      </div>

      {/* Listing detail modal */}
      <AnimatePresence>
        {selected && (
          <motion.div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center overflow-y-auto bg-black/45 p-2 sm:p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelected(null)}>
            <motion.div className="w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh]" initial={{ opacity: 0, y: 26, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.97 }} onClick={(e) => e.stopPropagation()}>
              <div className="modal-card w-full overflow-y-auto max-h-[95vh] sm:max-h-[90vh]">
                <button className="absolute right-4 top-4 z-10 rounded-full bg-[var(--bg2)] p-2 text-[var(--text)]" onClick={() => setSelected(null)}><X size={18} /></button>
                <div className="grid gap-4 sm:gap-5 lg:grid-cols-[1fr_0.8fr]">
                  {/* Gallery */}
                  <div>
                    <div className="relative overflow-hidden rounded-[18px] sm:rounded-[22px]">
                      <img src={selected.images[activeImg]} alt={selected.title} className="w-full h-[200px] sm:h-[280px] lg:h-[350px] object-cover" />
                      {selected.images.length > 1 && (
                        <>
                          <button className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-1.5 text-white backdrop-blur" onClick={() => setActiveImg((i) => (i - 1 + selected.images.length) % selected.images.length)}><ChevronLeft size={16} /></button>
                          <button className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-1.5 text-white backdrop-blur" onClick={() => setActiveImg((i) => (i + 1) % selected.images.length)}><ChevronRight size={16} /></button>
                          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-2 py-0.5 text-xs font-bold text-white">{activeImg + 1}/{selected.images.length}</div>
                        </>
                      )}
                    </div>
                    {selected.images.length > 1 && (
                      <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                        {selected.images.map((img, i) => (
                          <button key={i} onClick={() => setActiveImg(i)} className={`shrink-0 h-12 w-12 sm:h-14 sm:w-14 rounded-lg overflow-hidden border-2 transition ${i === activeImg ? 'border-[var(--accent)]' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                            <img src={img} alt="" className="h-full w-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {/* Details */}
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="mini-chip">{selected.category}</span>
                      <span className="mini-chip">{selected.availability}</span>
                      <span className="mini-chip">{selected.area}</span>
                    </div>
                    <h2 className="mt-3 text-xl sm:text-2xl font-black">{selected.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{selected.description}</p>

                    {selected.phone && (
                      <div className="mt-3 flex items-center gap-2 text-sm rounded-xl bg-[var(--bg2)] p-3">
                        <span className="font-bold text-[var(--muted)] text-xs uppercase">Phone:</span>
                        <span className="font-black">{selected.phone}</span>
                      </div>
                    )}

                    <div className="mt-3 rounded-xl border border-[var(--border)] p-3">
                      <div className="flex items-center gap-2">
                        <div className="avatar-mini text-sm">{selected.ownerAvatar}</div>
                        <div>
                          <div className="font-black text-sm">{selected.ownerName}</div>
                          <div className="text-xs text-[var(--muted)] flex items-center gap-1">
                            <Star size={10} className="text-amber-400" fill="currentColor" /> {selected.ownerRating} · {selected.reviewCount} reviews
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex items-end justify-between">
                      <div>
                        <div className="text-2xl font-black">{formatInr(selected.pricePerDay)}<span className="text-sm font-bold text-[var(--muted)] ml-1">/day</span></div>
                        {selected.securityDeposit > 0 && <div className="text-xs text-[var(--muted)]">{formatInr(selected.securityDeposit)} deposit</div>}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-[var(--muted)]">
                        <MapPin size={12} /> {selected.city}
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      {selected.phone && (
                        <button className="btn-primary col-span-2 h-11 justify-center gap-2" onClick={() => alert(`Owner's Phone: ${selected.phone}`)}>
                          <Phone size={15} /> {selected.phone}
                        </button>
                      )}
                      <button className="btn-secondary h-10 justify-center" onClick={(e) => { e.stopPropagation(); }}>
                        <MessageCircle size={14} /> Chat
                      </button>
                      <button className="btn-secondary h-10 justify-center" onClick={() => { toggleFav(selected); }}>
                        <Heart size={14} fill={favorites.includes(selected.id) ? "currentColor" : "none"} /> {favorites.includes(selected.id) ? "Saved" : "Wishlist"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
