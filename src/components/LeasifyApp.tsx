"use client";

import { AnimatePresence, motion, type Variants } from "framer-motion";
import {
  Flag,
  Flame,
  Home,
  ShoppingBag,
  Bell,
  Menu,
  CalendarDays,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
  Heart,
  ImagePlus,
  LayoutDashboard,
  Lock,
  LogIn,
  MapPin,
  MessageCircle,
  Moon,
  Package,
  Phone,
  Plus,
  Search,
  Shield,
  Send,
  Share2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Star,
  Sun,
  Trash2,
  Upload,
  User,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  categories,
  demoListings,
  demoReviews,
  demoUsers,
} from "@/lib/demo-data";
import { cn, daysBetween, formatInr, uid, getDistanceInKm, getFreshnessLabel } from "@/lib/utils";
import {
  addFavorite,
  createBooking,
  createListing,
  createNotification,
  createReview,
  createThread,
  deleteListing as sbDeleteListing,
  fetchFavorites,
  fetchListings,
  fetchMyBookings,
  fetchMyThreads,
  fetchNotifications,
  fetchProfile,
  createProfile,
  getSupabaseBrowserClient,
  isSupabaseConfigured,
  removeFavorite,
  resetPassword,
  sendMessage as sbSendMessage,
  signInWithEmail,
  signInWithGoogle,
  signOut,
  signUpWithEmail,
  updateBookingStatus as sbUpdateBookingStatus,
  updateProfile,
  triggerEmailNotification,
  fetchProfiles,
  fetchReviews,
  updateProfileBannedStatus,
} from "@/lib/supabase";
import ListingFormModal from "./ListingFormModal";
import dynamic from "next/dynamic";

const MapDisplay = dynamic(() => import("./MapDisplay"), {
  ssr: false,
  loading: () => (
    <div className="flex h-44 items-center justify-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--bg2)] text-sm text-[var(--muted)]">
      Loading map…
    </div>
  ),
});
import type {
  Booking,
  BookingStatus,
  Listing,
  Notification,
  Review,
  Thread,
  UserProfile,
} from "@/lib/types";

type AuthMode = "login" | "signup" | "forgot";
type DashboardTab = "overview" | "listings" | "bookings" | "saved" | "messages" | "profile" | "admin";

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] as const } },
};

function usePersistedState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(key);
      if (stored) setValue(JSON.parse(stored) as T);
    } catch {
      setValue(initial);
    }
  }, [initial, key]);

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue] as const;
}

export default function LeasifyApp() {
  const [theme, setTheme] = usePersistedState<"light" | "dark">("leasify-theme", "light");
  const [listings, setListings] = useState<Listing[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [currentUser, setCurrentUser] = usePersistedState<UserProfile | null>("leasify-current-user", null);
  const [isLoggedIn, setIsLoggedIn] = usePersistedState("leasify-logged-in", false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [city, setCity] = useState("All");
  const [maxPrice, setMaxPrice] = useState(3100);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [maxDistance, setMaxDistance] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<"relevance" | "priceAsc" | "priceDesc" | "distance">("relevance");
  const [locatingUser, setLocatingUser] = useState(false);

  const requestUserLocation = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      notify("Geolocation is not supported by your browser");
      return;
    }
    setLocatingUser(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocatingUser(false);
        notify("Location updated successfully!");
        setSortBy("distance");
      },
      (error) => {
        console.error("Geolocation error:", error);
        setLocatingUser(false);
        notify("Could not retrieve your location. Make sure GPS is enabled and location permission is granted.");
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [bookingListing, setBookingListing] = useState<Listing | null>(null);
  const [chatListing, setChatListing] = useState<Listing | null>(null);
  const [showListingForm, setShowListingForm] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode | null>(null);
  const [dashboardTab, setDashboardTab] = useState<DashboardTab>("overview");
  const [toast, setToast] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  // Fetch public listings & reviews on mount
  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    fetchListings().then((data) => { if (data.length > 0) setListings(data); });
    fetchReviews().then((data) => { if (data.length > 0) setReviews(data); });
  }, []);

  // Fetch all profiles for admin view
  useEffect(() => {
    if (!isSupabaseConfigured() || currentUser?.role !== "admin") return;
    fetchProfiles().then(setUsers);
  }, [currentUser?.role]);

  // Auth state listener – load personal data on sign in
  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const sb = getSupabaseBrowserClient();
    if (!sb) return;
    const { data: { subscription } } = sb.auth.onAuthStateChange(async (event, session) => {
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
        const userId = session.user.id;
        let profile = await fetchProfile(userId);
        if (!profile) {
          const newProfile = {
            id: userId,
            name: (session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || "New User") as string,
            email: session.user.email || "",
            avatar: (session.user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.user.email}`) as string,
            role: "user" as any,
          };
          profile = await createProfile(newProfile);
        }
        if (profile) { setCurrentUser(profile); setIsLoggedIn(true); }
        const [favs, myBookings, myThreads, myNotifs] = await Promise.all([
          fetchFavorites(userId),
          fetchMyBookings(userId),
          fetchMyThreads(userId),
          fetchNotifications(userId),
        ]);
        setFavorites(favs);
        setBookings(myBookings);
        setThreads(myThreads);
        setNotifications(myNotifs);
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        setIsLoggedIn(false);
        setFavorites([]);
        setBookings([]);
        setThreads([]);
        setNotifications([]);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Realtime messages and threads listener
  useEffect(() => {
    if (!isLoggedIn || !isSupabaseConfigured() || !currentUser) return;
    const sb = getSupabaseBrowserClient();
    if (!sb) return;

    const messagesChannel = sb
      .channel("realtime_messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const newMsg = payload.new;
          setThreads((cur) =>
            cur.map((t) => {
              if (t.id === newMsg.thread_id) {
                if (t.messages.some((m) => m.id === newMsg.id)) return t;
                return {
                  ...t,
                  messages: [
                    ...t.messages,
                    {
                      id: newMsg.id,
                      senderId: newMsg.sender_id,
                      body: newMsg.body,
                      createdAt: newMsg.created_at,
                    },
                  ],
                };
              }
              return t;
            })
          );
        }
      )
      .subscribe();

    const threadsChannel = sb
      .channel("realtime_threads")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "threads" },
        (payload) => {
          const newThread = payload.new;
          if (newThread.renter_id === currentUser.id || newThread.owner_id === currentUser.id) {
            setThreads((cur) => {
              if (cur.some((t) => t.id === newThread.id)) return cur;
              return [
                {
                  id: newThread.id,
                  listingId: newThread.listing_id,
                  renterId: newThread.renter_id,
                  ownerId: newThread.owner_id,
                  messages: [],
                },
                ...cur,
              ];
            });
          }
        }
      )
      .subscribe();

    return () => {
      sb.removeChannel(messagesChannel);
      sb.removeChannel(threadsChannel);
    };
  }, [isLoggedIn, currentUser?.id]);

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 2800);
  }

  const filteredListings = useMemo(() => {
    const text = query.trim().toLowerCase();
    const filtered = listings.filter((listing) => {
      const matchesText =
        !text ||
        [listing.title, listing.description, listing.category, listing.city, listing.area, listing.ownerName]
          .join(" ")
          .toLowerCase()
          .includes(text);
      const matchesCategory = category === "All" || listing.category === category;
      const matchesCity = city === "All" || listing.city === city;
      const matchesPrice = maxPrice === 3100 || listing.pricePerDay <= maxPrice;
      const matchesAvailability = !availableOnly || listing.availability === "available";

      let matchesDistance = true;
      if (userCoords && maxDistance !== null) {
        if (listing.lat !== undefined && listing.lng !== undefined) {
          const dist = getDistanceInKm(userCoords.lat, userCoords.lng, Number(listing.lat), Number(listing.lng));
          matchesDistance = dist <= maxDistance;
        } else {
          matchesDistance = false;
        }
      }

      return matchesText && matchesCategory && matchesCity && matchesPrice && matchesAvailability && matchesDistance;
    });

    if (sortBy === "priceAsc") {
      filtered.sort((a, b) => a.pricePerDay - b.pricePerDay);
    } else if (sortBy === "priceDesc") {
      filtered.sort((a, b) => b.pricePerDay - a.pricePerDay);
    } else if (sortBy === "distance" && userCoords) {
      filtered.sort((a, b) => {
        const distA = a.lat !== undefined && a.lng !== undefined
          ? getDistanceInKm(userCoords.lat, userCoords.lng, Number(a.lat), Number(a.lng))
          : Infinity;
        const distB = b.lat !== undefined && b.lng !== undefined
          ? getDistanceInKm(userCoords.lat, userCoords.lng, Number(b.lat), Number(b.lng))
          : Infinity;
        return distA - distB;
      });
    }

    return filtered;
  }, [availableOnly, category, city, listings, maxPrice, query, userCoords, maxDistance, sortBy]);

  const currentUserListings = currentUser ? listings.filter((listing) => listing.ownerId === currentUser.id) : [];
  const currentUserBookings = currentUser ? bookings.filter(
    (booking) => booking.ownerId === currentUser.id || booking.renterId === currentUser.id,
  ) : [];
  const unreadCount = notifications.filter((notification) => !notification.read).length;
  const cities = ["All", ...Array.from(new Set(listings.map((listing) => listing.city)))];

  function toggleFavorite(listing: Listing) {
    if (!currentUser) return setAuthMode("login");
    const isFav = favorites.includes(listing.id);
    setFavorites((cur) => isFav ? cur.filter((id) => id !== listing.id) : [...cur, listing.id]);
    if (isLoggedIn) {
      if (isFav) removeFavorite(currentUser.id, listing.id);
      else addFavorite(currentUser.id, listing.id);
    }
  }

  async function addListing(listing: Listing, imageFiles?: File[]) {
    if (!currentUser) return;
    // Optimistic update
    setListings((cur) => [listing, ...cur]);
    const updated = { ...currentUser, role: "owner" as const, listedItems: currentUser.listedItems + 1 };
    setCurrentUser(updated);
    setShowListingForm(false);
    setDashboardTab("listings");
    notify("Listing published. It is live in the marketplace.");
    if (isLoggedIn) {
      const saved = await createListing({ ...listing, ownerId: currentUser.id, ownerName: currentUser.name, ownerAvatar: currentUser.avatar, ownerRating: currentUser.rating }, imageFiles);
      if (saved) setListings((cur) => cur.map((l) => l.id === listing.id ? saved : l));
      await updateProfile(currentUser.id, { role: "owner", listedItems: updated.listedItems });
    }
  }

  async function requestBooking(listing: Listing, startDate: string, endDate: string, note: string) {
    if (!currentUser) return;
    const booking: Booking = {
      id: uid("book"),
      listingId: listing.id,
      renterId: currentUser.id,
      ownerId: listing.ownerId,
      startDate,
      endDate,
      status: "pending",
      note,
      createdAt: new Date().toISOString(),
    };
    setBookings((cur) => [booking, ...cur]);
    setBookingListing(null);
    setDashboardTab("bookings");
    notify("Booking request sent. The owner can accept or reject it.");
    if (isLoggedIn) {
      await createBooking(booking);
      fetchProfile(listing.ownerId).then((owner) => {
        if (owner && owner.email) {
          triggerEmailNotification({
            type: "new_booking",
            toEmail: owner.email,
            ownerName: owner.name,
            itemTitle: listing.title,
            senderName: currentUser.name,
            message: note || "No message included.",
          }).catch(console.error);
        }
      });
    }
  }

  async function updateBooking(id: string, status: BookingStatus) {
    setBookings((cur) => cur.map((b) => (b.id === id ? { ...b, status } : b)));
    notify(`Booking marked ${status}.`);
    if (isLoggedIn) await sbUpdateBookingStatus(id, status);
  }

  async function createOrOpenThread(listing: Listing) {
    if (!isLoggedIn || !currentUser) { setAuthMode("login"); notify("Please log in to contact the owner."); return; }
    let thread = threads.find(
      (t) => t.listingId === listing.id &&
        ((t.renterId === currentUser.id && t.ownerId === listing.ownerId) ||
          (t.ownerId === currentUser.id && t.renterId === listing.ownerId)),
    );
    if (!thread) {
      const firstMsgId = uid("msg");
      thread = {
        id: uid("thread"),
        listingId: listing.id,
        renterId: currentUser.id,
        ownerId: listing.ownerId,
        messages: [{ id: firstMsgId, senderId: currentUser.id, body: `Hi ${listing.ownerName}, I am interested in ${listing.title}. Is it available?`, createdAt: new Date().toISOString() }],
      };
      setThreads((cur) => [thread!, ...cur]);
      if (isLoggedIn) {
        await createThread({ id: thread.id, listingId: thread.listingId, renterId: thread.renterId, ownerId: thread.ownerId });
        await sbSendMessage(thread.id, currentUser.id, thread.messages[0].body, firstMsgId);
        fetchProfile(listing.ownerId).then((owner) => {
          if (owner && owner.email) {
            triggerEmailNotification({
              type: "new_message",
              toEmail: owner.email,
              ownerName: owner.name,
              itemTitle: listing.title,
              senderName: currentUser.name,
              message: thread!.messages[0].body,
            }).catch(console.error);
          }
        });
      }
    }
    setChatListing(listing);
    setDashboardTab("messages");
  }

  async function sendMessage(threadId: string, body: string) {
    if (!body.trim() || !currentUser) return;
    const msgId = uid("msg");
    const msg = { id: msgId, senderId: currentUser.id, body, createdAt: new Date().toISOString() };
    setThreads((cur) => cur.map((t) => t.id === threadId ? { ...t, messages: [...t.messages, msg] } : t));
    if (isLoggedIn) {
      await sbSendMessage(threadId, currentUser.id, body, msgId);
      const thread = threads.find((t) => t.id === threadId);
      if (thread) {
        const recipientId = thread.renterId === currentUser.id ? thread.ownerId : thread.renterId;
        const listing = listings.find((l) => l.id === thread.listingId);
        if (listing) {
          fetchProfile(recipientId).then((recipient) => {
            if (recipient && recipient.email) {
              triggerEmailNotification({
                type: "new_message",
                toEmail: recipient.email,
                ownerName: recipient.name,
                itemTitle: listing.title,
                senderName: currentUser.name,
                message: body,
              }).catch(console.error);
            }
          });
        }
      }
    }
  }

  async function addReview(listingId: string, toUserId: string, body: string, rating: number) {
    if (!currentUser) return;
    const rev = { id: uid("rev"), listingId, fromUserId: currentUser.id, toUserId, body, rating, createdAt: new Date().toISOString() };
    setReviews((cur) => [rev, ...cur]);
    notify("Review posted.");
    if (isLoggedIn) await createReview(rev);
  }

  async function deleteListing(id: string) {
    setListings((cur) => cur.filter((l) => l.id !== id));
    notify("Listing removed.");
    if (isLoggedIn) await sbDeleteListing(id);
  }

  async function banUser(id: string) {
    const userToToggle = users.find((u) => u.id === id);
    if (!userToToggle) return;
    const nextBanned = !userToToggle.banned;
    setUsers((current) => current.map((user) => (user.id === id ? { ...user, banned: nextBanned } : user)));
    notify("User moderation status updated.");
    if (isLoggedIn) await updateProfileBannedStatus(id, nextBanned);
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[var(--bg)] text-[var(--text)]">
      <CursorGlow />
      <AnimatedBackdrop />
      <Header
        currentUser={currentUser}
        unreadCount={unreadCount}
        theme={theme}
        onTheme={() => setTheme(theme === "dark" ? "light" : "dark")}
        isLoggedIn={isLoggedIn}
        mobileMenuOpen={mobileMenuOpen}
        onMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
        onAuth={setAuthMode}
        onSignOut={async () => { await signOut(); notify("Signed out."); setMobileMenuOpen(false); }}
        onList={() => { setShowListingForm(true); setMobileMenuOpen(false); }}
        onDashboard={() => { setDashboardTab("overview"); setMobileMenuOpen(false); }}
        onAdmin={() => { setDashboardTab("admin"); setMobileMenuOpen(false); }}
      />

      <Hero
        onBrowse={() => document.getElementById("browse")?.scrollIntoView()}
        onList={() => setShowListingForm(true)}
        onSearch={(q) => { setQuery(q); document.getElementById("browse")?.scrollIntoView({ behavior: "smooth" }); }}
      />
      <Marquee />

      <section id="browse" className="section-pad relative">
        <motion.div
          className="mx-auto max-w-6xl rounded-[20px] sm:rounded-[28px] border border-[var(--border)] bg-[var(--card)]/82 p-3 sm:p-4 shadow-2xl shadow-black/5 backdrop-blur-2xl md:p-5"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
        >
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.2fr_0.7fr_0.7fr_auto]">
            <SearchField icon={<Search size={18} />} value={query} onChange={setQuery} placeholder="Search cameras, cars, tools..." />
            <SelectField value={category} onChange={setCategory} options={categories} icon={<Filter size={18} />} />
            <SelectField value={city} onChange={setCity} options={cities} icon={<MapPin size={18} />} />
            <button className="btn-primary h-12 sm:h-14 px-6 w-full sm:w-auto">
              <SlidersHorizontal size={18} />
              Search
            </button>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <div className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
                <span>Max price per day</span>
                <span>{maxPrice === 3100 ? "Unlimited" : formatInr(maxPrice)}</span>
              </div>
              <input
                aria-label="Max price"
                className="range-input"
                min={200}
                max={3100}
                step={100}
                type="range"
                value={maxPrice}
                onChange={(event) => setMaxPrice(Number(event.target.value))}
              />
            </div>
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={availableOnly}
                onChange={(event) => setAvailableOnly(event.target.checked)}
              />
              <span>Available now</span>
            </label>
          </div>
          
          <div className="mt-4 grid gap-4 grid-cols-1 md:grid-cols-[1.2fr_0.8fr] md:items-end border-t border-[var(--border)]/60 pt-4">
            <div>
              <div className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
                <span>Proximity Filter</span>
                <span>{userCoords ? (maxDistance ? `${maxDistance} km` : "Any distance") : "Requires GPS location"}</span>
              </div>
              <div className="flex gap-3 items-center">
                <button
                  type="button"
                  onClick={requestUserLocation}
                  disabled={locatingUser}
                  className={cn(
                    "flex items-center gap-2 h-11 px-4 rounded-xl text-xs font-semibold border transition-all duration-200",
                    userCoords
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                      : "border-[var(--border)] hover:bg-[var(--border)] text-[var(--text)] hover:text-white"
                  )}
                >
                  <MapPin size={14} className={locatingUser ? "animate-bounce" : ""} />
                  {locatingUser ? "Locating..." : userCoords ? "Location Saved" : "Use GPS Location"}
                </button>
                {userCoords ? (
                  <input
                    aria-label="Max distance"
                    className="range-input flex-1"
                    min={1}
                    max={100}
                    step={1}
                    type="range"
                    value={maxDistance ?? 100}
                    onChange={(event) => {
                      const val = Number(event.target.value);
                      setMaxDistance(val === 100 ? null : val);
                    }}
                  />
                ) : (
                  <div className="text-xs text-[var(--muted)] italic">
                    Click the button to filter by distance from you.
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
                Sort listings
              </div>
              <select
                className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl h-11 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary text-[var(--text)]"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
              >
                <option value="relevance">Default (Relevance)</option>
                <option value="priceAsc">Price: Low to High</option>
                <option value="priceDesc">Price: High to Low</option>
                {userCoords && <option value="distance">Distance: Closest</option>}
              </select>
            </div>
          </div>
        </motion.div>

        <div className="mx-auto mt-6 sm:mt-8 max-w-6xl flex gap-2 overflow-x-auto pb-2 sm:pb-0 sm:flex-wrap scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
          {categories.map((cat) => (
            <button
              key={cat}
              className={cn("pill shrink-0", category === cat && "pill-active")}
              onClick={() => setCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      <Marketplace
        listings={filteredListings}
        favorites={favorites}
        onFavorite={toggleFavorite}
        onBooking={(listing) => {
          if (!currentUser) return setAuthMode("login");
          setBookingListing(listing);
        }}
        onChat={createOrOpenThread}
        onOpen={setSelectedListing}
        userCoords={userCoords}
      />

      <StartupSections listings={listings} onList={() => {
        if (!currentUser) return setAuthMode("login");
        setShowListingForm(true);
      }} />

      {isLoggedIn && currentUser && (
        <Dashboard
          tab={dashboardTab}
          setTab={setDashboardTab}
          user={currentUser}
          users={users}
          listings={listings}
          myListings={currentUserListings}
          bookings={currentUserBookings}
          favorites={favorites}
          favoriteListings={listings.filter((listing) => favorites.includes(listing.id))}
          notifications={notifications}
          threads={threads}
          reviews={reviews}
          onList={() => setShowListingForm(true)}
          onBookingStatus={updateBooking}
          onChat={(listing) => {
            setChatListing(listing);
            setDashboardTab("messages");
          }}
          onSendMessage={sendMessage}
          onReview={addReview}
          onDeleteListing={deleteListing}
          onBanUser={banUser}
          setCurrentUser={setCurrentUser}
        />
      )}

      <Footer />

      <button className="floating-action" onClick={isLoggedIn ? () => setShowListingForm(true) : () => setAuthMode("login")}>
        <Plus size={18} />
        List an item
      </button>

      {/* ── Mobile Bottom Nav (phones only) ── */}
      <nav className="bottom-nav md:hidden">
        <button className="bottom-nav-btn" onClick={() => document.getElementById("top")?.scrollIntoView({ behavior: "smooth" })}>
          <Home size={20} />
          Home
        </button>
        <button className="bottom-nav-btn" onClick={() => document.getElementById("browse")?.scrollIntoView({ behavior: "smooth" })}>
          <Search size={20} />
          Browse
        </button>
        <button className="bottom-nav-btn" onClick={isLoggedIn ? () => setShowListingForm(true) : () => setAuthMode("login")}>
          <Plus size={22} />
          List
        </button>
        <button className="bottom-nav-btn" onClick={isLoggedIn ? () => { setDashboardTab("messages"); document.getElementById("dashboard")?.scrollIntoView({ behavior: "smooth" }); } : () => setAuthMode("login")}>
          <MessageCircle size={20} />
          Chat
        </button>
        <button className="bottom-nav-btn" onClick={isLoggedIn ? () => { setDashboardTab("overview"); document.getElementById("dashboard")?.scrollIntoView({ behavior: "smooth" }); } : () => setAuthMode("login")}>
          <User size={20} />
          Me
        </button>
      </nav>

      <AnimatePresence>
        {authMode && (
          <AuthModal
            key="auth-modal"
            mode={authMode}
            onMode={setAuthMode}
            onClose={() => setAuthMode(null)}
            setCurrentUser={setCurrentUser}
            notify={notify}
          />
        )}
        {showListingForm && currentUser && (
          <ListingFormModal
            key="listing-form-modal"
            currentUser={currentUser}
            onClose={() => setShowListingForm(false)}
            onCreate={addListing}
          />
        )}
        {bookingListing && currentUser && (
          <BookingModal
            key={`booking-${bookingListing.id}`}
            listing={bookingListing}
            onClose={() => setBookingListing(null)}
            onSubmit={requestBooking}
          />
        )}
        {selectedListing && (
          <ListingDetailModal
            key={`listing-detail-${selectedListing.id}`}
            listing={selectedListing}
            favorite={favorites.includes(selectedListing.id)}
            reviews={reviews.filter((review) => review.listingId === selectedListing.id)}
            onClose={() => setSelectedListing(null)}
            onFavorite={() => toggleFavorite(selectedListing)}
            onBooking={() => {
              if (!currentUser) return setAuthMode("login");
              setBookingListing(selectedListing);
            }}
            onChat={() => createOrOpenThread(selectedListing)}
            onReport={(reason) => {
              setListings((current) =>
                current.map((listing) =>
                  listing.id === selectedListing.id ? { ...listing, reports: listing.reports + 1 } : listing,
                ),
              );
              notify(`Report submitted: "${reason}". Our team will review this listing.`);
            }}
          />
        )}
        {chatListing && currentUser && (
          <ChatDrawer
            key={`chat-${chatListing.id}`}
            listing={chatListing}
            currentUser={currentUser}
            thread={threads.find((thread) => thread.listingId === chatListing.id) ?? null}
            onClose={() => setChatListing(null)}
            onSend={sendMessage}
          />
        )}
        {toast && <Toast key="toast" message={toast} />}
      </AnimatePresence>
    </main>
  );
}

function CursorGlow() {
  const [position, setPosition] = useState({ x: -200, y: -200 });

  useEffect(() => {
    const handler = (event: MouseEvent) => setPosition({ x: event.clientX, y: event.clientY });
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  return (
    <div
      className="pointer-events-none fixed z-[100] hidden h-12 w-12 rounded-full border border-orange-500/35 mix-blend-multiply transition-transform duration-150 md:block"
      style={{ transform: `translate(${position.x - 24}px, ${position.y - 24}px)` }}
    />
  );
}

function AnimatedBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="orb left-[4%] top-[18%] bg-orange-500/14" />
      <div className="orb right-[-8%] top-[8%] h-[460px] w-[460px] bg-amber-400/16 [animation-delay:1.2s]" />
      <div className="orb bottom-[-12%] left-[32%] h-[360px] w-[360px] bg-blue-600/10 [animation-delay:2.4s]" />
    </div>
  );
}

function Header({
  currentUser,
  unreadCount,
  theme,
  isLoggedIn,
  mobileMenuOpen,
  onMobileMenu,
  onTheme,
  onAuth,
  onSignOut,
  onList,
  onDashboard,
  onAdmin,
}: {
  currentUser: UserProfile | null;
  unreadCount: number;
  theme: "light" | "dark";
  isLoggedIn: boolean;
  mobileMenuOpen: boolean;
  onMobileMenu: () => void;
  onTheme: () => void;
  onAuth: (mode: AuthMode) => void;
  onSignOut: () => void;
  onList: () => void;
  onDashboard: () => void;
  onAdmin: () => void;
}) {
  return (
    <>
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-[var(--border)] bg-[var(--bg)]/82 backdrop-blur-2xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-8">
        <a className="brand" href="#top" aria-label="Leasify home">
          Leas<span>ify</span>
        </a>
        <nav className="hidden items-center gap-7 text-sm font-bold text-[var(--muted)] lg:flex">
          <a href="#browse">Browse</a>
          <a href="/products" className="hover:text-[var(--text)] transition">Products</a>
          <a href="#trending">Trending</a>
          <a href="#categories">Categories</a>
          {isLoggedIn && currentUser && <button onClick={onDashboard}>Dashboard</button>}
          {currentUser?.role === "admin" && <button onClick={onAdmin}>Admin</button>}
        </nav>
        <div className="flex items-center gap-2">
          <button className="icon-btn relative" onClick={onDashboard} aria-label="Notifications">
            <Bell size={18} />
            {unreadCount > 0 && <span className="badge-dot">{unreadCount}</span>}
          </button>
          <button className="icon-btn" onClick={onTheme} aria-label="Toggle theme">
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          {isLoggedIn ? (
            <button className="btn-secondary hidden md:inline-flex" onClick={onSignOut}>
              Sign out
            </button>
          ) : (
            <button className="btn-secondary hidden md:inline-flex" onClick={() => onAuth("login")}>
              <LogIn size={16} />
              Login
            </button>
          )}
          <button className="btn-primary hidden md:inline-flex" onClick={isLoggedIn ? onList : () => onAuth("login")}>
            <Plus size={16} />
            List item
          </button>
          {isLoggedIn && currentUser && (
            <button className="avatar-chip hidden md:flex" onClick={onDashboard}>
              {currentUser.avatar.startsWith("http") ? (
                <img src={currentUser.avatar} alt="Avatar" className="w-6 h-6 rounded-full" />
              ) : (
                <span>{currentUser.avatar}</span>
              )}
              <span className="hidden sm:block">{currentUser.name.split(" ")[0]}</span>
            </button>
          )}
          <button className="icon-btn md:hidden" onClick={onMobileMenu} aria-label="Open menu">
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
    </header>
    {/* Mobile slide-out menu */}
    {mobileMenuOpen && (
      <div className="fixed inset-0 z-40 md:hidden">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onMobileMenu} />
        <nav className="absolute right-0 top-0 h-full w-72 bg-[var(--bg)] shadow-2xl flex flex-col p-6 gap-4 pt-20">
          <a href="#browse" className="text-lg font-bold py-2 border-b border-[var(--border)]" onClick={onMobileMenu}>Browse</a>
          <a href="/products" className="text-lg font-bold py-2 border-b border-[var(--border)]" onClick={onMobileMenu}>Products</a>
          <a href="#trending" className="text-lg font-bold py-2 border-b border-[var(--border)]" onClick={onMobileMenu}>Trending</a>
          <a href="#categories" className="text-lg font-bold py-2 border-b border-[var(--border)]" onClick={onMobileMenu}>Categories</a>
          {isLoggedIn && currentUser && <button className="text-lg font-bold py-2 border-b border-[var(--border)] text-left" onClick={onDashboard}>Dashboard</button>}
          {currentUser?.role === "admin" && <button className="text-lg font-bold py-2 border-b border-[var(--border)] text-left" onClick={onAdmin}>Admin</button>}
          <div className="mt-auto flex flex-col gap-3">
            {isLoggedIn ? (
              <button className="btn-secondary h-12 w-full justify-center" onClick={onSignOut}>Sign out</button>
            ) : (
              <button className="btn-secondary h-12 w-full justify-center" onClick={() => { onAuth("login"); onMobileMenu(); }}>
                <LogIn size={16} />Login
              </button>
            )}
            <button className="btn-primary h-12 w-full justify-center" onClick={isLoggedIn ? onList : () => { onAuth("login"); onMobileMenu(); }}>
              <Plus size={16} />List item
            </button>
          </div>
        </nav>
      </div>
    )}
    </>
  );
}

function Hero({ onBrowse, onList, onSearch }: { onBrowse: () => void; onList: () => void; onSearch: (q: string) => void }) {
  const [heroQuery, setHeroQuery] = useState("");
  const floaters = [
    ["Sony A7 IV kit", "INR 800/day"],
    ["Self drive car", "INR 1,200/day"],
    ["Designer lehenga", "INR 2,500/day"],
    ["Party speaker", "INR 600/day"],
    ["Camping kit", "INR 400/day"],
  ];

  function handleSearch() {
    onSearch(heroQuery.trim());
    onBrowse();
  }

  return (
    <section id="top" className="section-pad relative flex min-h-[80vh] sm:min-h-[92vh] items-center pt-24 sm:pt-32">
      <div className="relative z-10 mx-auto grid w-full max-w-7xl gap-10 lg:grid-cols-[1fr_0.62fr] lg:items-center">
        <motion.div initial="hidden" animate="show" variants={container}>
          <motion.div variants={item} className="hero-pill">
            <span className="live-dot" />
            1,200+ verified rentals across India
          </motion.div>
          <motion.h1 variants={item} className="hero-title">
            Rent <span>anything.</span>
            <br />
            From anyone.
            <br />
            Near you.
          </motion.h1>
          <motion.p variants={item} className="hero-copy">
            A premium peer-to-peer marketplace for cameras, cars, fashion, tools, gaming gear, event kits, and the
            useful things hiding in your neighborhood.
          </motion.p>

          {/* ── Hero Search Bar ── */}
          <motion.div variants={item} className="hero-search">
            <Search size={18} className="ml-4 shrink-0 text-[var(--muted)]" />
            <input
              value={heroQuery}
              onChange={(e) => setHeroQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search cameras, cars, tools, dresses…"
              aria-label="Search rentals"
            />
            <button onClick={handleSearch} aria-label="Search">
              <Search size={16} />
              Search
            </button>
          </motion.div>

          <motion.div variants={item} className="mt-4 flex flex-wrap gap-3">
            <button className="btn-secondary h-11 sm:h-12 px-5 sm:px-6" onClick={onList}>
              <Upload size={16} />
              List an item
            </button>
          </motion.div>
        </motion.div>
        <motion.div className="relative hidden min-h-[520px] lg:block" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }}>
          <div className="hero-device">
            <img
              alt="Premium rental marketplace collage"
              className="h-full w-full object-cover"
              src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1200&q=80"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 rounded-2xl border border-white/15 bg-white/12 p-4 text-white backdrop-blur-2xl">
              <div className="flex items-center justify-between text-sm">
                <span className="font-bold">Booking request</span>
                <span className="rounded-full bg-emerald-400 px-3 py-1 text-xs font-black text-emerald-950">Live</span>
              </div>
              <p className="mt-2 text-2xl font-black">Sony camera kit requested for 3 days</p>
              <div className="mt-4 flex gap-2">
                <span className="mini-chip">Chat owner</span>
                <span className="mini-chip">Manual approval</span>
              </div>
            </div>
          </div>
          {floaters.map(([name, price], index) => (
            <motion.div
              key={name}
              className="floater"
              style={{ top: `${12 + index * 17}%`, left: index % 2 ? "-2%" : "56%" }}
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 4 + index * 0.35, repeat: Infinity, ease: "easeInOut" }}
            >
              <Package size={17} className="text-orange-500" />
              <span>{name}</span>
              <strong>{price}</strong>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function Marquee() {
  const items = ["Cameras", "Cars", "Designer fashion", "Power tools", "Gaming", "Camping", "Audio", "Appliances"];
  return (
    <div className="relative z-10 overflow-hidden border-y border-[var(--border)] bg-dark py-4 text-bg">
      <div className="marquee-track">
        {[...items, ...items, ...items].map((label, index) => (
          <span key={`${label}-${index}`} className="mx-7 inline-flex items-center gap-3 text-sm font-black uppercase tracking-[0.2em] opacity-70">
            <Sparkles size={16} className="text-orange-400" />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

function SearchField({
  icon,
  value,
  onChange,
  placeholder,
}: {
  icon: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="field">
      {icon}
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
    </label>
  );
}

function SelectField({
  icon,
  value,
  onChange,
  options,
}: {
  icon: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label className="field">
      {icon}
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function Marketplace({
  listings,
  favorites,
  onFavorite,
  onBooking,
  onChat,
  onOpen,
  userCoords,
}: {
  listings: Listing[];
  favorites: string[];
  onFavorite: (listing: Listing) => void;
  onBooking: (listing: Listing) => void;
  onChat: (listing: Listing) => void;
  onOpen: (listing: Listing) => void;
  userCoords: { lat: number; lng: number } | null;
}) {
  const featured = listings.find((listing) => listing.featured) ?? listings[0];
  const HOME_LIMIT = 8;
  const displayListings = listings.slice(0, HOME_LIMIT);
  const hasMore = listings.length > HOME_LIMIT;

  return (
    <section id="trending" className="section-pad relative z-10">
      <div className="mx-auto max-w-7xl">
        <SectionHeader eyebrow="Featured listings" title="Trending near you" action="Marketplace updated live" />
        {featured && (
          <motion.article className="featured-listing cursor-pointer" initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} onClick={() => onOpen(featured)}>
            <div className="relative h-[180px] sm:h-[220px] lg:h-[260px] overflow-hidden rounded-t-[22px] sm:rounded-t-[24px] lg:rounded-r-none lg:rounded-l-[24px]">
              <img src={featured.images[0]} alt={featured.title} className="h-full w-full object-cover transition-transform duration-700 hover:scale-105" />
              <div className="absolute left-4 top-4 rounded-full bg-white/88 px-3 py-1.5 text-xs font-black uppercase text-stone-950 backdrop-blur">
                {featured.badge}
              </div>
              {featured.images.length > 1 && (
                <div className="absolute bottom-3 right-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-bold text-white backdrop-blur">
                  +{featured.images.length - 1} photos
                </div>
              )}
            </div>
            <div className="p-4 sm:p-5 lg:p-6">
              <div className="mb-2 flex flex-wrap gap-1.5">
                <span className="mini-chip dark-chip">{featured.category}</span>
                <span className="mini-chip dark-chip">{featured.area}</span>
                <span className="mini-chip dark-chip">{featured.rating}★</span>
                {userCoords && featured.lat !== undefined && featured.lng !== undefined && (
                  <span className="mini-chip bg-emerald-500/20 text-emerald-300 font-bold">
                    {getDistanceInKm(userCoords.lat, userCoords.lng, Number(featured.lat), Number(featured.lng)).toFixed(1)} km
                  </span>
                )}
              </div>
              <h3 className="text-lg sm:text-2xl font-black lg:text-3xl line-clamp-1">{featured.title}</h3>
              <p className="mt-1.5 max-w-2xl text-sm leading-6 text-white/55 line-clamp-2">{featured.description}</p>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-2xl sm:text-3xl font-black text-amber-300">{formatInr(featured.pricePerDay)}<span className="text-sm font-bold text-white/40 ml-1">/day</span></div>
                </div>
                <div className="flex gap-2">
                  {featured.phone && (
                    <button className="btn-light" onClick={(e) => { e.stopPropagation(); alert(`Phone: ${featured.phone}`); }}>
                      <Phone size={15} /> {featured.phone}
                    </button>
                  )}
                  <button className="btn-light" onClick={(e) => { e.stopPropagation(); onChat(featured); }}>
                    <MessageCircle size={15} /> Chat
                  </button>
                  <button className="btn-primary" onClick={(e) => { e.stopPropagation(); onBooking(featured); }}>
                    Rent now
                  </button>
                </div>
              </div>
            </div>
          </motion.article>
        )}

        <motion.div className="mt-7 grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-4" variants={container} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }}>
          {displayListings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              favorite={favorites.includes(listing.id)}
              onFavorite={() => onFavorite(listing)}
              onBooking={() => onBooking(listing)}
              onChat={() => onChat(listing)}
              onOpen={() => onOpen(listing)}
              userCoords={userCoords}
            />
          ))}
        </motion.div>

        {hasMore && (
          <div className="mt-8 text-center">
            <a href="/products" className="btn-ink inline-flex h-12 px-8 gap-2 items-center">
              View all {listings.length} products
              <ChevronRight size={16} />
            </a>
          </div>
        )}

        {listings.length === 0 && (
          <EmptyState title="No rentals match these filters" body="Try widening your price, city, category, or availability filters." />
        )}
      </div>
    </section>
  );
}

function ListingCard({
  listing,
  favorite,
  onFavorite,
  onBooking,
  onChat,
  onOpen,
  userCoords,
}: {
  listing: Listing;
  favorite: boolean;
  onFavorite: () => void;
  onBooking: () => void;
  onChat: () => void;
  onOpen: () => void;
  userCoords: { lat: number; lng: number } | null;
}) {
  const freshness = getFreshnessLabel(listing.createdAt);
  const isOwnerVerified = listing.ownerRating >= 4.5 && listing.reviewCount >= 5;

  return (
    <motion.article variants={item} className="listing-card group">
      <button className="absolute inset-0 z-0" onClick={onOpen} aria-label={`Open ${listing.title}`} />
      {/* Image section */}
      <div className="relative overflow-hidden">
        <img className="h-44 sm:h-48 w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110" src={listing.images[0]} alt={listing.title} />
        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        {/* Badge */}
        {listing.badge && (
          <div className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider backdrop-blur-md shadow-sm">
            {listing.badge}
          </div>
        )}
        {/* Photo count */}
        {listing.images.length > 1 && (
          <div className="absolute left-3 bottom-3 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
            {listing.images.length} photos
          </div>
        )}
        {/* Freshness */}
        <div className={`freshness-chip absolute bottom-3 right-12 ${freshness.cls}`}>
          <Clock size={8} />{freshness.label}
        </div>
        {/* Wishlist heart */}
        <button
          className={cn("heart-btn transition-transform duration-200 hover:scale-110", favorite && "heart-active")}
          onClick={onFavorite}
          aria-label={favorite ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart size={15} fill={favorite ? "currentColor" : "none"} className={favorite ? "animate-pulse" : ""} />
        </button>
        {/* Hover action overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-3 flex gap-1.5 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out z-10">
          {listing.phone && (
            <button className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500/90 backdrop-blur-sm py-2 text-xs font-black text-white hover:bg-emerald-500 transition" onClick={(e) => { e.stopPropagation(); alert(`Phone: ${listing.phone}`); }}>
              <Phone size={12} /> Call
            </button>
          )}
          <button className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-white/90 backdrop-blur-sm py-2 text-xs font-black text-stone-900 hover:bg-white transition" onClick={onChat}>
            <MessageCircle size={12} /> Chat
          </button>
        </div>
      </div>
      {/* Content section */}
      <div className="relative z-10 p-3.5 sm:p-4">
        <div className="flex items-center justify-between text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[var(--muted)]">
          <span>{listing.category}</span>
          <span className="inline-flex items-center gap-0.5">
            <Star size={11} className="fill-amber-400 text-amber-400" />
            {listing.rating}
          </span>
        </div>
        <h3 className="mt-1 line-clamp-1 text-base sm:text-lg font-black group-hover:text-[var(--accent)] transition-colors duration-200">{listing.title}</h3>
        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-[var(--muted)]">
          <MapPin size={12} />
          <span className="line-clamp-1">{listing.area}, {listing.city}</span>
          {userCoords && listing.lat !== undefined && listing.lng !== undefined && (
            <span className="ml-auto text-[10px] font-bold text-emerald-400 whitespace-nowrap">
              {getDistanceInKm(userCoords.lat, userCoords.lng, Number(listing.lat), Number(listing.lng)).toFixed(1)} km
            </span>
          )}
        </div>
        <div className="mt-3 flex items-end justify-between border-t border-[var(--border)] pt-3">
          <div>
            <div className="text-lg sm:text-xl font-black">{formatInr(listing.pricePerDay)}</div>
            <div className="text-[10px] font-bold text-[var(--muted)]">per day</div>
          </div>
          <div className="text-right">
            <div className="flex items-center justify-end gap-1 text-xs font-black text-[var(--text)]">
              {listing.ownerName}
              {isOwnerVerified && <ShieldCheck size={11} className="text-emerald-500" />}
            </div>
            <div className="text-[10px] text-[var(--muted)]">{listing.reviewCount} reviews</div>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

function StartupSections({ onList, listings = [] }: { onList: () => void, listings?: any[] }) {
  const stats = [
    ["1,200+", "listed items"],
    ["8,500+", "members"],
    ["12", "active cities"],
    ["INR 9.5K", "avg owner earnings"],
  ];
  const cats = categories.filter((cat) => cat !== "All").slice(0, 10);

  return (
    <>
      <section className="section-pad relative z-10 bg-dark text-bg">
        <div className="mx-auto max-w-7xl">
          <SectionHeader eyebrow="How it works" title="Manual rentals, real conversation, zero payment gateway for now" inverse />
          <div className="grid gap-px overflow-hidden rounded-[20px] sm:rounded-[28px] border border-[var(--border)] bg-[var(--border)] md:grid-cols-3">
            {[
              ["01", "Find the right item", "Search by keyword, city, category, budget, and availability."],
              ["02", "Chat and request", "Message the owner, negotiate handover, then send a date-based request."],
              ["03", "Owner approves", "Owners accept or reject manually. Both sides keep chatting until pickup."],
            ].map(([num, title, body]) => (
              <motion.div
                key={title}
                className="bg-dark p-6 sm:p-8"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <div className="text-5xl sm:text-6xl font-black text-bg opacity-10">{num}</div>
                <h3 className="mt-3 sm:mt-4 text-xl sm:text-2xl font-black text-bg">{title}</h3>
                <p className="mt-2 sm:mt-3 text-sm leading-6 sm:leading-7 text-bg opacity-50">{body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 bg-orange-600 text-white md:grid-cols-4">
        {stats.map(([value, label]) => (
          <div key={label} className="border-b border-white/15 p-5 sm:p-8 text-center md:border-r">
            <div className="text-2xl sm:text-4xl font-black">{value}</div>
            <div className="mt-1 text-xs sm:text-sm font-bold uppercase tracking-[0.14em] sm:tracking-[0.18em] text-white/70">{label}</div>
          </div>
        ))}
      </section>

      <section id="categories" className="section-pad relative z-10">
        <div className="mx-auto max-w-7xl">
          <SectionHeader eyebrow="Explore" title="Popular categories" action="Trending, nearby, and recently added" />
          <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            {cats.map((cat, index) => (
              <motion.div
                key={cat}
                className="category-card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.035 }}
                viewport={{ once: true }}
              >
                <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500 text-white">
                  {index % 3 === 0 ? <Camera size={21} /> : index % 3 === 1 ? <Package size={21} /> : <Sparkles size={21} />}
                </div>
                <h3 className="text-lg font-black">{cat}</h3>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {(() => {
                    const count = listings.filter((l) => l.category === cat).length;
                    return count === 1 ? "1 item nearby" : `${count} items nearby`;
                  })()}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-pad relative z-10">
        <div className="mx-auto grid max-w-7xl gap-6 sm:gap-8 rounded-[22px] sm:rounded-[32px] border border-[var(--border)] bg-[var(--bg2)] p-4 sm:p-6 md:grid-cols-[1fr_0.9fr] md:p-12">
          <div>
            <div className="section-eyebrow">For owners</div>
            <h2 className="mt-3 text-2xl sm:text-4xl font-black md:text-6xl">
              Turn idle items into income.
            </h2>
            <p className="mt-5 max-w-xl text-[var(--muted)]">
              Upload photos, set your deposit and pickup rules, approve requests manually, and chat through every handover.
            </p>
            <button className="btn-primary mt-8 h-14 px-7" onClick={onList}>
              <Plus size={18} />
              Create a free listing
            </button>
          </div>
          <div className="grid gap-3">
            {["Profile verification UI", "Manual booking approvals", "Saved items and reviews", "Reports and admin moderation"].map(
              (label) => (
                <div key={label} className="flex items-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
                  <ShieldCheck className="text-orange-500" size={22} />
                  <span className="font-black">{label}</span>
                </div>
              ),
            )}
          </div>
        </div>
      </section>
    </>
  );
}

function Dashboard({
  tab,
  setTab,
  user,
  users,
  listings,
  myListings,
  bookings,
  favorites,
  favoriteListings,
  notifications,
  threads,
  reviews,
  onList,
  onBookingStatus,
  onChat,
  onSendMessage,
  onReview,
  onDeleteListing,
  onBanUser,
  setCurrentUser,
}: {
  tab: DashboardTab;
  setTab: (tab: DashboardTab) => void;
  user: UserProfile;
  users: UserProfile[];
  listings: Listing[];
  myListings: Listing[];
  bookings: Booking[];
  favorites: string[];
  favoriteListings: Listing[];
  notifications: Notification[];
  threads: Thread[];
  reviews: Review[];
  onList: () => void;
  onBookingStatus: (id: string, status: BookingStatus) => void;
  onChat: (listing: Listing) => void;
  onSendMessage: (threadId: string, body: string) => void;
  onReview: (listingId: string, toUserId: string, body: string, rating: number) => void;
  onDeleteListing: (id: string) => void;
  onBanUser: (id: string) => void;
  setCurrentUser: (user: UserProfile) => void;
}) {
  const tabs: [DashboardTab, React.ReactNode, string][] = [
    ["overview", <LayoutDashboard size={16} key="overview" />, "Overview"],
    ["listings", <Package size={16} key="listings" />, "My Listings"],
    ["bookings", <CalendarDays size={16} key="bookings" />, "Bookings"],
    ["saved", <Heart size={16} key="saved" />, "Saved"],
    ["messages", <MessageCircle size={16} key="messages" />, "Messages"],
    ["profile", <User size={16} key="profile" />, "Profile"],
  ];
  if (user.role === "admin") tabs.push(["admin", <Lock size={16} key="admin" />, "Admin"]);

  return (
    <section id="dashboard" className="section-pad relative z-10 bg-[var(--bg2)]">
      <div className="mx-auto max-w-7xl">
        <SectionHeader eyebrow="Dashboard" title="Operate your Leasify marketplace" action={`${favorites.length} saved items`} />
        <div className="grid gap-4 sm:gap-5 lg:grid-cols-[280px_1fr]">
          <aside className="glass-panel h-fit p-3 sm:p-4">
            <div className="mb-3 sm:mb-4 flex items-center gap-3 rounded-2xl bg-dark p-3 sm:p-4 text-bg">
              <div className="avatar-big">{user.avatar}</div>
              <div className="min-w-0">
                <div className="font-black truncate">{user.name}</div>
                <div className="flex items-center gap-1 text-xs text-white/60">
                  <Star size={12} className="fill-amber-300 text-amber-300" />
                  {user.rating} rating
                  {user.verified && <ShieldCheck size={13} className="text-emerald-300" />}
                </div>
              </div>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 lg:grid lg:overflow-visible lg:pb-0" style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
              {tabs.map(([id, icon, label]) => (
                <button key={id} className={cn("dash-tab shrink-0 lg:shrink", tab === id && "dash-tab-active")} onClick={() => setTab(id)}>
                  {icon}
                  <span className="hidden sm:inline lg:inline">{label}</span>
                </button>
              ))}
            </div>
          </aside>
          <div className="min-h-[520px]">
            {tab === "overview" && (
              <div className="grid gap-5">
                <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-4">
                  <Metric label="Active listings" value={String(myListings.length)} />
                  <Metric label="Bookings" value={String(bookings.length)} />
                  <Metric label="Unread alerts" value={String(notifications.filter((n) => !n.read).length)} />
                  <Metric label="Rental history" value={String(user.rentalHistory)} />
                </div>
                <div className="grid gap-5 xl:grid-cols-[1fr_0.85fr]">
                  <Panel title="Recent notifications">
                    <div className="grid gap-3">
                      {notifications.slice(0, 5).map((notification) => (
                        <div key={notification.id} className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-4">
                          <div className="flex items-center gap-2 font-black">
                            <Bell size={15} className="text-orange-500" />
                            {notification.title}
                          </div>
                          <p className="mt-1 text-sm text-[var(--muted)]">{notification.body}</p>
                        </div>
                      ))}
                    </div>
                  </Panel>
                  <Panel title="Quick actions">
                    <div className="grid gap-3">
                      <button className="btn-primary h-12" onClick={onList}>
                        <Plus size={16} />
                        Upload listing
                      </button>
                      <button className="btn-secondary h-12" onClick={() => setTab("messages")}>
                        <MessageCircle size={16} />
                        Open messages
                      </button>
                      <button className="btn-secondary h-12" onClick={() => setTab("profile")}>
                        <User size={16} />
                        Edit profile
                      </button>
                    </div>
                  </Panel>
                </div>
              </div>
            )}

            {tab === "listings" && (
              <Panel
                title="My listings"
                action={
                  <button className="btn-primary" onClick={onList}>
                    <Plus size={16} />
                    Add listing
                  </button>
                }
              >
                <div className="grid gap-4 md:grid-cols-2">
                  {myListings.map((listing) => (
                    <ListingRow key={listing.id} listing={listing} onDelete={() => onDeleteListing(listing.id)} />
                  ))}
                </div>
                {myListings.length === 0 && <EmptyState title="No listings yet" body="Create your first listing to start receiving manual requests." />}
              </Panel>
            )}

            {tab === "bookings" && (
              <Panel title="Bookings">
                <div className="grid gap-3">
                  {bookings.map((booking) => {
                    const listing = listings.find((item) => item.id === booking.listingId);
                    if (!listing) return null;
                    const isOwner = booking.ownerId === user.id;
                    return (
                      <div key={booking.id} className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-4">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <div className="text-lg font-black">{listing.title}</div>
                            <div className="mt-1 text-sm text-[var(--muted)]">
                              {booking.startDate} to {booking.endDate} - {daysBetween(booking.startDate, booking.endDate)} days
                            </div>
                            <p className="mt-2 text-sm text-[var(--muted)]">{booking.note}</p>
                          </div>
                          <StatusBadge status={booking.status} />
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <button className="btn-secondary" onClick={() => onChat(listing)}>
                            <MessageCircle size={15} />
                            Chat
                          </button>
                          {isOwner && booking.status === "pending" && (
                            <>
                              <button className="btn-primary" onClick={() => onBookingStatus(booking.id, "accepted")}>
                                <Check size={15} />
                                Accept
                              </button>
                              <button className="btn-danger" onClick={() => onBookingStatus(booking.id, "rejected")}>
                                <X size={15} />
                                Reject
                              </button>
                            </>
                          )}
                          {booking.status === "accepted" && (
                            <button className="btn-secondary" onClick={() => onBookingStatus(booking.id, "completed")}>
                              Mark completed
                            </button>
                          )}
                          {booking.status === "completed" && (
                            <ReviewQuickAdd listing={listing} user={user} booking={booking} onReview={onReview} />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Panel>
            )}

            {tab === "saved" && (
              <Panel title="Saved items">
                <div className="grid gap-4 md:grid-cols-2">
                  {favoriteListings.map((listing) => (
                    <ListingRow key={listing.id} listing={listing} onChat={() => onChat(listing)} />
                  ))}
                </div>
                {favoriteListings.length === 0 && <EmptyState title="No saved listings" body="Tap the heart on a listing to save it here." />}
              </Panel>
            )}

            {tab === "messages" && (
              <MessagesPanel currentUser={user} listings={listings} threads={threads} onSend={onSendMessage} />
            )}

            {tab === "profile" && (
              <ProfilePanel user={user} setCurrentUser={setCurrentUser} users={users} />
            )}

            {tab === "admin" && (
              <AdminPanel
                users={users}
                listings={listings}
                reviews={reviews}
                onDeleteListing={onDeleteListing}
                onBanUser={onBanUser}
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function ListingRow({ listing, onDelete, onChat }: { listing: Listing; onDelete?: () => void; onChat?: () => void }) {
  return (
    <div className="flex gap-4 rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-3">
      <img src={listing.images[0]} alt={listing.title} className="h-24 w-24 rounded-xl object-cover" />
      <div className="min-w-0 flex-1">
        <div className="line-clamp-1 font-black">{listing.title}</div>
        <div className="text-sm text-[var(--muted)]">{listing.area}, {listing.city}</div>
        <div className="mt-2 font-black">{formatInr(listing.pricePerDay)} <span className="text-xs text-[var(--muted)]">per day</span></div>
        <div className="mt-3 flex gap-2">
          {onChat && (
            <button className="btn-secondary compact" onClick={onChat}>
              <MessageCircle size={14} />
              Chat
            </button>
          )}
          {onDelete && (
            <button className="btn-danger compact" onClick={onDelete}>
              <Trash2 size={14} />
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function MessagesPanel({
  currentUser,
  listings,
  threads,
  onSend,
}: {
  currentUser: UserProfile;
  listings: Listing[];
  threads: Thread[];
  onSend: (threadId: string, body: string) => void;
}) {
  const [selectedId, setSelectedId] = useState(threads[0]?.id ?? "");
  const selected = threads.find((thread) => thread.id === selectedId) ?? threads[0];
  const [body, setBody] = useState("");

  useEffect(() => {
    if (!selectedId && threads[0]) setSelectedId(threads[0].id);
  }, [selectedId, threads]);

  if (!selected) return <EmptyState title="No messages yet" body="Start a conversation from a listing card." />;

  const listing = listings.find((item) => item.id === selected.listingId);

  return (
    <div className="grid overflow-hidden rounded-[20px] sm:rounded-[28px] border border-[var(--border)] bg-[var(--card)] lg:grid-cols-[280px_1fr]">
      <div className="border-b border-[var(--border)] p-2 sm:p-3 lg:border-b-0 lg:border-r flex gap-2 overflow-x-auto lg:block lg:overflow-visible" style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
        {threads.map((thread) => {
          const threadListing = listings.find((item) => item.id === thread.listingId);
          return (
            <button key={thread.id} className={cn("thread-btn shrink-0 lg:shrink", selected.id === thread.id && "thread-btn-active")} onClick={() => setSelectedId(thread.id)}>
              <MessageCircle size={16} />
              <span className="line-clamp-1">{threadListing?.title ?? "Rental chat"}</span>
            </button>
          );
        })}
      </div>
      <div className="flex min-h-[360px] sm:min-h-[520px] flex-col">
        <div className="border-b border-[var(--border)] p-4">
          <div className="font-black">{listing?.title ?? "Rental chat"}</div>
          <div className="text-sm text-[var(--muted)]">Real-time ready chat, saved locally until Supabase keys are added.</div>
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {selected.messages.map((message) => (
            <div key={message.id} className={cn("chat-bubble", message.senderId === currentUser.id && "chat-bubble-me")}>
              {message.body}
            </div>
          ))}
        </div>
        <form
          className="flex gap-2 border-t border-[var(--border)] p-4"
          onSubmit={(event) => {
            event.preventDefault();
            onSend(selected.id, body);
            setBody("");
          }}
        >
          <input className="input" value={body} onChange={(event) => setBody(event.target.value)} placeholder="Ask about pickup, condition, or dates..." />
          <button className="btn-primary" type="submit">
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}

function ProfilePanel({
  user,
  users,
  setCurrentUser,
}: {
  user: UserProfile;
  users: UserProfile[];
  setCurrentUser: (user: UserProfile) => void;
}) {
  const [draft, setDraft] = useState(user);

  return (
    <Panel title="Profile settings">
      <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-5">
          <div className="avatar-hero">{draft.avatar}</div>
          <h3 className="mt-4 text-2xl font-black">{draft.name}</h3>
          <p className="mt-2 text-sm leading-7 text-[var(--muted)]">{draft.bio}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="mini-chip">{draft.city}</span>
            <span className="mini-chip">{draft.rating} rating</span>
            <span className="mini-chip">Verified badge</span>
          </div>
        </div>
        <form
          className="grid gap-4 rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-5"
          onSubmit={(event) => {
            event.preventDefault();
            setCurrentUser(draft);
          }}
        >
          <label className="label">Name<input className="input" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></label>
          <label className="label">City<input className="input" value={draft.city} onChange={(e) => setDraft({ ...draft, city: e.target.value })} /></label>
          <label className="label">Bio<textarea className="input min-h-28" value={draft.bio} onChange={(e) => setDraft({ ...draft, bio: e.target.value })} /></label>
          <button className="btn-primary h-12" type="submit">Save profile</button>
        </form>
      </div>
    </Panel>
  );
}

function AdminPanel({
  users,
  listings,
  reviews,
  onDeleteListing,
  onBanUser,
}: {
  users: UserProfile[];
  listings: Listing[];
  reviews: Review[];
  onDeleteListing: (id: string) => void;
  onBanUser: (id: string) => void;
}) {
  return (
    <div className="grid gap-5">
      <div className="grid gap-4 md:grid-cols-4">
        <Metric label="Users" value={String(users.length)} />
        <Metric label="Listings" value={String(listings.length)} />
        <Metric label="Reports" value={String(listings.reduce((sum, item) => sum + item.reports, 0))} />
        <Metric label="Reviews" value={String(reviews.length)} />
      </div>
      <Panel title="Moderation queue">
        <div className="grid gap-3">
          {listings
            .filter((listing) => listing.reports > 0)
            .map((listing) => (
              <div key={listing.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-4">
                <div>
                  <div className="font-black">{listing.title}</div>
                  <div className="text-sm text-[var(--muted)]">{listing.reports} report(s)</div>
                </div>
                <button className="btn-danger" onClick={() => onDeleteListing(listing.id)}>
                  <Trash2 size={15} />
                  Remove listing
                </button>
              </div>
            ))}
          {listings.every((listing) => listing.reports === 0) && <EmptyState title="Moderation queue is clear" body="Reported listings will appear here." />}
        </div>
      </Panel>
      <Panel title="Users">
        <div className="grid gap-3 md:grid-cols-2">
          {users.map((user) => (
            <div key={user.id} className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-4">
              <div className="flex items-center gap-3">
                <span className="avatar-mini">{user.avatar}</span>
                <div>
                  <div className="font-black">{user.name}</div>
                  <div className="text-sm text-[var(--muted)]">{user.role} - {user.email}</div>
                </div>
              </div>
              <button className={cn("compact", user.banned ? "btn-primary" : "btn-danger")} onClick={() => onBanUser(user.id)}>
                {user.banned ? "Unban" : "Ban"}
              </button>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function AuthModal({
  mode,
  onMode,
  onClose,
  setCurrentUser,
  notify,
}: {
  mode: AuthMode;
  onMode: (mode: AuthMode) => void;
  onClose: () => void;
  setCurrentUser: (user: UserProfile | null) => void;
  notify: (message: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "");
    const password = String(data.get("password") ?? "");
    const name = String(data.get("name") ?? "Leasify User");
    const city = String(data.get("city") ?? "");
    const phone = String(data.get("phone") ?? "");

    try {
      if (mode === "forgot") {
        await resetPassword(email);
        notify(isSupabaseConfigured() ? "Password reset email sent." : "Demo mode: reset flow simulated.");
      } else if (mode === "signup") {
        await signUpWithEmail(email, password, name, city, phone);
        notify(isSupabaseConfigured() ? "Account created! Check your email to confirm." : "Demo account created locally.");
      } else {
        await signInWithEmail(email, password);
        // Profile will be set by the auth state listener in LeasifyApp
        notify(isSupabaseConfigured() ? "Logged in successfully!" : "Demo login complete.");
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      <form className="modal-card max-w-md w-full" onSubmit={handleSubmit}>
        <ModalClose onClose={onClose} />
        <div className="mb-6">
          <div className="section-eyebrow">{isSupabaseConfigured() ? "Secure auth" : "Demo auth"}</div>
          <h2 className="mt-2 text-3xl font-black">
            {mode === "login" ? "Welcome back" : mode === "signup" ? "Create profile" : "Reset password"}
          </h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Sign in to list items, contact owners, and track your rentals.
          </p>
        </div>
        {mode === "signup" && (
          <>
            <label className="label">Name<input className="input" name="name" required /></label>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <label className="label">City<input className="input" name="city" required /></label>
              <label className="label">Phone<input className="input" name="phone" type="tel" required /></label>
            </div>
          </>
        )}
        <label className="label mt-3">Email<input className="input" name="email" type="email" placeholder="you@example.com" required /></label>
        {mode !== "forgot" && <label className="label mt-3">Password<input className="input" name="password" type="password" placeholder="Min 6 characters" required /></label>}
        {error && <div className="rounded-xl bg-red-500/10 p-3 text-sm font-bold text-red-600">{error}</div>}
        <button className="btn-primary h-12 w-full" disabled={busy} type="submit">
          {busy ? "Working..." : mode === "login" ? "Log in" : mode === "signup" ? "Sign up" : "Send reset email"}
        </button>
        <button
          className="btn-secondary h-12 w-full justify-center"
          type="button"
          onClick={async () => {
            await signInWithGoogle();
            notify(isSupabaseConfigured() ? "Redirecting to Google." : "Demo mode: Google login simulated.");
          }}
        >
          <LogIn size={16} />
          Continue with Google
        </button>
        <div className="flex justify-between text-sm font-bold text-[var(--muted)]">
          <button type="button" onClick={() => onMode(mode === "signup" ? "login" : "signup")}>
            {mode === "signup" ? "Have an account?" : "Need an account?"}
          </button>
          <button type="button" onClick={() => onMode("forgot")}>Forgot password?</button>
        </div>
      </form>
    </Modal>
  );
}



function BookingModal({
  listing,
  onClose,
  onSubmit,
}: {
  listing: Listing;
  onClose: () => void;
  onSubmit: (listing: Listing, startDate: string, endDate: string, note: string) => void;
}) {
  const [startDate, setStartDate] = useState("2026-06-06");
  const [endDate, setEndDate] = useState("2026-06-08");
  const total = daysBetween(startDate, endDate) * listing.pricePerDay;

  return (
    <Modal onClose={onClose}>
      <form
        className="modal-card max-w-lg"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          onSubmit(listing, startDate, endDate, String(data.get("note") ?? ""));
        }}
      >
        <ModalClose onClose={onClose} />
        <div className="section-eyebrow">Request rental</div>
        <h2 className="mt-2 text-3xl font-black">{listing.title}</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <label className="label">Start date<input className="input" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></label>
          <label className="label">End date<input className="input" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></label>
        </div>
        <label className="label mt-3">Message to owner<textarea className="input min-h-24" name="note" defaultValue="Hi, I would like to rent this. Pickup timing is flexible." /></label>
        <div className="mt-4 rounded-2xl bg-[var(--bg2)] p-4">
          <div className="flex justify-between text-sm"><span>Rental total</span><strong>{formatInr(total)}</strong></div>
          <div className="mt-2 flex justify-between text-sm"><span>Security deposit</span><strong>{formatInr(listing.securityDeposit)}</strong></div>
          <p className="mt-3 text-xs leading-6 text-[var(--muted)]">No payment gateway is enabled. This creates a manual request and opens owner communication.</p>
        </div>
        <button className="btn-primary mt-4 h-12 w-full" type="submit">Send request</button>
      </form>
    </Modal>
  );
}

function ListingDetailModal({
  listing,
  favorite,
  reviews,
  onClose,
  onFavorite,
  onBooking,
  onChat,
  onReport,
}: {
  listing: Listing;
  favorite: boolean;
  reviews: Review[];
  onClose: () => void;
  onFavorite: () => void;
  onBooking: () => void;
  onChat: () => void;
  onReport: (reason: string) => void;
}) {
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [activeImg, setActiveImg] = useState(0);
  const freshness = getFreshnessLabel(listing.createdAt);
  const isOwnerVerified = listing.ownerRating >= 4.5 && listing.reviewCount >= 5;

  const REPORT_REASONS = [
    { icon: "🚨", label: "Fake listing or scam" },
    { icon: "💬", label: "Inappropriate content" },
    { icon: "📷", label: "Wrong or stolen photos" },
    { icon: "💰", label: "Misleading price" },
    { icon: "🚫", label: "Prohibited item" },
    { icon: "⚠️", label: "Other concern" },
  ];

  function handleShare() {
    const url = window.location.href;
    const text = `${listing.title} — ₹${listing.pricePerDay}/day on Leasify`;
    if (navigator.share) {
      navigator.share({ title: listing.title, text, url }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(`${text}\n${url}`).then(() => alert("Link copied!")).catch(() => {});
    }
  }

  return (
    <Modal onClose={onClose}>
      <div className="modal-card max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <ModalClose onClose={onClose} />
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-[1fr_0.8fr]">
          {/* Left: image gallery */}
          <div>
            <div className="relative overflow-hidden rounded-[20px] sm:rounded-[26px]">
              <img src={listing.images[activeImg]} alt={listing.title} className="h-full min-h-[180px] sm:min-h-[240px] w-full object-cover lg:min-h-[380px]" />
              {listing.images.length > 1 && (
                <>
                  <button className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-1.5 text-white backdrop-blur hover:bg-black/70 transition" onClick={() => setActiveImg((i) => (i - 1 + listing.images.length) % listing.images.length)}><ChevronLeft size={18} /></button>
                  <button className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-1.5 text-white backdrop-blur hover:bg-black/70 transition" onClick={() => setActiveImg((i) => (i + 1) % listing.images.length)}><ChevronRight size={18} /></button>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-2.5 py-1 text-xs font-bold text-white backdrop-blur">{activeImg + 1}/{listing.images.length}</div>
                </>
              )}
            </div>
            {listing.images.length > 1 && (
              <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                {listing.images.map((img, i) => (
                  <button key={i} onClick={() => setActiveImg(i)} className={`shrink-0 h-14 w-14 sm:h-16 sm:w-16 rounded-xl overflow-hidden border-2 transition ${i === activeImg ? 'border-[var(--accent)]' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: details */}
          <div>
            {/* Chips row: category + freshness */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="mini-chip">{listing.category}</span>
              <span className="mini-chip">{listing.availability}</span>
              <span className="mini-chip">{listing.area}</span>
              <span className={`freshness-chip ${freshness.cls}`}>
                <Clock size={10} />
                {freshness.label}
              </span>
            </div>

            <h2 className="mt-3 sm:mt-4 text-xl sm:text-3xl font-black lg:text-4xl">{listing.title}</h2>
            <p className="mt-3 leading-7 text-[var(--muted)]">{listing.description}</p>

            {/* Phone & Security remarks */}
            {(listing.phone || listing.securityRemarks) && (
              <div className="mt-5 rounded-2xl border border-[var(--border)] bg-[var(--bg2)] p-4 flex flex-col gap-3">
                {listing.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="text-orange-500 flex-shrink-0" size={16} />
                    <div>
                      <div className="font-bold text-[var(--muted)] text-xs uppercase tracking-wider">Contact Phone</div>
                      <div className="font-black mt-0.5">{listing.phone}</div>
                    </div>
                  </div>
                )}
                {listing.securityRemarks && (
                  <div className="flex items-start gap-3 text-sm border-t border-[var(--border)] pt-3">
                    <Shield className="text-orange-500 flex-shrink-0 mt-0.5" size={16} />
                    <div>
                      <div className="font-bold text-[var(--muted)] text-xs uppercase tracking-wider">Security Requirements</div>
                      <div className="mt-1 text-[var(--text)] leading-relaxed">{listing.securityRemarks}</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Address & Map */}
            {listing.address && (
              <div className="mt-5 rounded-2xl border border-[var(--border)] p-4">
                <div className="flex items-start gap-2 text-sm mb-2">
                  <MapPin className="text-orange-500 flex-shrink-0 mt-0.5" size={16} />
                  <div>
                    <div className="font-bold text-[var(--muted)] text-xs uppercase tracking-wider">Location Address</div>
                    <div className="mt-0.5 font-bold text-[var(--text)]">{listing.address}</div>
                  </div>
                </div>
                {listing.lat != null && listing.lng != null && (
                  <MapDisplay lat={Number(listing.lat)} lng={Number(listing.lng)} />
                )}
              </div>
            )}

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Metric label="Price per day" value={formatInr(listing.pricePerDay)} />
            </div>

            {/* Owner card with verified badge */}
            <div className="mt-5 rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-4">
              <div className="flex items-center gap-3">
                <div className="avatar-mini">{listing.ownerAvatar}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="font-black">{listing.ownerName}</div>
                    {isOwnerVerified && (
                      <span className="verified-badge">
                        <ShieldCheck size={11} />
                        Verified
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-[var(--muted)] mt-0.5 flex items-center gap-1">
                    <Star size={12} className="text-amber-400" fill="currentColor" />
                    {listing.ownerRating} rating · {listing.reviewCount} reviews
                  </div>
                </div>
              </div>
            </div>

            {/* Action buttons — Contact first (this is a listing platform) */}
            <div className="mt-4 sm:mt-5 grid grid-cols-2 gap-2">
              {listing.phone && (
                <button className="btn-primary col-span-2 h-11 justify-center gap-2" onClick={() => alert(`Owner's Phone: ${listing.phone}`)}>
                  <Phone size={16} /> {listing.phone}
                </button>
              )}
              <button className="btn-secondary h-10 justify-center" onClick={onChat}><MessageCircle size={15} /> Chat</button>
              <button className="btn-secondary h-10 justify-center" onClick={onFavorite}><Heart size={15} fill={favorite ? "currentColor" : "none"} /> {favorite ? "Saved" : "Wishlist"}</button>
              <button className="btn-secondary h-10 justify-center" onClick={handleShare}><Share2 size={15} /> Share</button>
              <button className="btn-danger h-10 justify-center" onClick={() => setShowReportModal(true)}><Flag size={14} /> Report</button>
            </div>

            {/* Reviews */}
            <div className="mt-6">
              <h3 className="font-black">Reviews</h3>
              <div className="mt-3 grid gap-2">
                {reviews.map((review) => (
                  <div key={review.id} className="rounded-2xl bg-[var(--bg)] p-3 text-sm text-[var(--muted)]">
                    <div className="flex items-center gap-1 mb-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} size={12} fill={i < review.rating ? "currentColor" : "none"} className={i < review.rating ? "text-amber-400" : "text-[var(--border)]"} />
                      ))}
                    </div>
                    {review.body}
                  </div>
                ))}
                {reviews.length === 0 && <p className="text-sm text-[var(--muted)]">No reviews on this listing yet.</p>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Report Modal ── */}
      <AnimatePresence>
        {showReportModal && (
          <motion.div
            className="fixed inset-0 z-[300] flex items-end justify-center sm:items-center p-4 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowReportModal(false)}
          >
            <motion.div
              className="modal-card w-full max-w-sm"
              initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="font-black text-lg">Report this listing</div>
                  <div className="text-sm text-[var(--muted)] mt-0.5">Tell us what's wrong</div>
                </div>
                <button className="icon-btn" onClick={() => setShowReportModal(false)}><X size={16} /></button>
              </div>
              <div className="grid gap-2">
                {REPORT_REASONS.map((r) => (
                  <button
                    key={r.label}
                    className={cn("report-option", reportReason === r.label && "selected")}
                    onClick={() => setReportReason(r.label)}
                  >
                    <span className="text-xl">{r.icon}</span>
                    <span className="font-bold text-sm">{r.label}</span>
                    {reportReason === r.label && <Check size={16} className="ml-auto text-red-500" />}
                  </button>
                ))}
              </div>
              <button
                className="btn-danger mt-4 w-full h-12"
                disabled={!reportReason}
                onClick={() => {
                  onReport(reportReason);
                  setShowReportModal(false);
                  onClose();
                }}
              >
                <Flag size={14} />
                Submit Report
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
}

function ChatDrawer({
  listing,
  currentUser,
  thread,
  onClose,
  onSend,
}: {
  listing: Listing;
  currentUser: UserProfile;
  thread: Thread | null;
  onClose: () => void;
  onSend: (threadId: string, body: string) => void;
}) {
  const [body, setBody] = useState("");

  return (
    <motion.aside className="fixed bottom-0 right-0 top-0 z-[90] w-full max-w-md border-l border-[var(--border)] bg-[var(--card)] shadow-2xl" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}>
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-[var(--border)] p-4">
          <div>
            <div className="font-black">{listing.ownerName}</div>
            <div className="text-sm text-[var(--muted)]">{listing.title}</div>
          </div>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {(thread?.messages ?? []).map((message) => (
            <div key={message.id} className={cn("chat-bubble", message.senderId === currentUser.id && "chat-bubble-me")}>{message.body}</div>
          ))}
          {!thread && <EmptyState title="Thread not created yet" body="Open chat from the listing to start messaging." />}
        </div>
        <form
          className="flex gap-2 border-t border-[var(--border)] p-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (thread) onSend(thread.id, body);
            setBody("");
          }}
        >
          <input className="input" value={body} onChange={(event) => setBody(event.target.value)} placeholder="Type a message..." />
          <button className="btn-primary" type="submit" disabled={!thread}><Send size={16} /></button>
        </form>
      </div>
    </motion.aside>
  );
}

function ReviewQuickAdd({
  listing,
  user,
  booking,
  onReview,
}: {
  listing: Listing;
  user: UserProfile;
  booking: Booking;
  onReview: (listingId: string, toUserId: string, body: string, rating: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  if (!open) return <button className="btn-secondary animate-fade-in" onClick={() => setOpen(true)}>Leave review</button>;

  return (
    <form
      className="flex flex-col gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg)]/95 p-4 w-full md:max-w-md animate-slide-up"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const bodyText = String(data.get("review") ?? "").trim();
        if (!bodyText) return;
        const targetUserId = booking.renterId === user.id ? booking.ownerId : booking.renterId;
        onReview(listing.id, targetUserId, bodyText, rating);
        setOpen(false);
      }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)]">Select Rating</span>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(null)}
              className="p-1 transition duration-150 hover:scale-110"
              aria-label={`Set rating to ${star} stars`}
            >
              <Star
                size={18}
                className={cn(
                  "transition-colors duration-150",
                  star <= (hoverRating ?? rating)
                    ? "fill-amber-400 text-amber-400"
                    : "text-stone-400/40 dark:text-stone-600/40"
                )}
              />
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <input
          className="input min-w-56 flex-1 h-10 text-sm"
          name="review"
          placeholder="Great experience. Recommended!"
          required
        />
        <button className="btn-primary h-10 px-4 text-sm" type="submit">Post</button>
        <button className="btn-secondary h-10 px-4 text-sm" type="button" onClick={() => setOpen(false)}>Cancel</button>
      </div>
    </form>
  );
}

function SectionHeader({ eyebrow, title, action, inverse = false }: { eyebrow: string; title: string; action?: string; inverse?: boolean }) {
  return (
    <div className="mb-6 sm:mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <div className="section-eyebrow">{eyebrow}</div>
        <h2 className={cn("mt-2 max-w-3xl text-3xl sm:text-4xl font-black md:text-5xl", inverse && "text-bg")}>{title}</h2>
      </div>
      {action && <div className={cn("text-xs sm:text-sm font-bold", inverse ? "text-bg opacity-45" : "text-muted")}>{action}</div>}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
      <div className="text-2xl font-black">{value}</div>
      <div className="mt-1 text-xs font-bold uppercase tracking-[0.17em] text-[var(--muted)]">{label}</div>
    </div>
  );
}

function Panel({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="glass-panel p-5 md:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-xl font-black">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[24px] border border-dashed border-[var(--border)] bg-[var(--card)] p-8 text-center">
      <Package className="mx-auto text-orange-500" size={28} />
      <h3 className="mt-3 text-xl font-black">{title}</h3>
      <p className="mt-2 text-sm text-[var(--muted)]">{body}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: BookingStatus }) {
  return <span className={cn("status-badge", `status-${status}`)}>{status}</span>;
}

function SelectNative({ name, options }: { name: string; options: string[] }) {
  return (
    <select className="input" name={name}>
      {options.map((option) => <option key={option} value={option}>{option}</option>)}
    </select>
  );
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <motion.div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center overflow-y-auto bg-black/45 p-2 sm:p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={onClose}>
      <motion.div initial={{ opacity: 0, y: 26, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.97 }} onMouseDown={(event) => event.stopPropagation()} className="w-full max-h-[95vh] sm:max-h-none">
        {children}
      </motion.div>
    </motion.div>
  );
}

function ModalClose({ onClose }: { onClose: () => void }) {
  return (
    <button className="absolute right-4 top-4 z-10 rounded-full bg-[var(--bg2)] p-2 text-[var(--text)]" onClick={onClose} type="button" aria-label="Close">
      <X size={18} />
    </button>
  );
}

function Toast({ message }: { message: string }) {
  return (
    <motion.div className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] sm:bottom-6 left-1/2 z-[100] -translate-x-1/2 rounded-full bg-dark px-4 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-black text-bg shadow-2xl max-w-[90vw] text-center" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}>
      {message}
    </motion.div>
  );
}

function Footer() {
  return (
    <footer className="relative z-10 bg-[#111009] px-4 py-8 sm:py-12 text-white md:px-8 pb-[calc(5rem+env(safe-area-inset-bottom,0px))] md:pb-12">
      <div className="mx-auto grid max-w-7xl gap-6 sm:gap-8 grid-cols-2 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="col-span-2 md:col-span-1">
          <div className="brand text-white">Leas<span className="text-[var(--accent)]">ify</span></div>
          <p className="mt-3 sm:mt-4 max-w-sm text-xs sm:text-sm leading-6 sm:leading-7 text-white/45">
            A polished, Supabase-ready rental marketplace MVP with auth, profiles, listings, chat, bookings, saved items,
            reviews, notifications, and admin moderation.
          </p>
        </div>
        {["Renters", "Owners", "Company"].map((group) => (
          <div key={group}>
            <h4 className="font-black text-white">{group}</h4>
            <div className="mt-4 grid gap-3 text-sm text-white/45">
              <a className="hover:text-white transition-colors">Browse rentals</a>
              <a className="hover:text-white transition-colors">Safety</a>
              <a className="hover:text-white transition-colors">Dashboard</a>
              <a className="hover:text-white transition-colors">Support</a>
            </div>
          </div>
        ))}
      </div>
    </footer>
  );
}
