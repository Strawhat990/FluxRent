import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Booking, BookingStatus, Listing, Message, Notification, Review, Thread, UserProfile } from "./types";
import { uid } from "./utils";

let browserClient: SupabaseClient | null = null;

export function isSupabaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function getSupabaseBrowserClient() {
  if (!isSupabaseConfigured()) return null;
  if (!browserClient) {
    browserClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } },
    );
  }
  return browserClient;
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export async function signInWithEmail(email: string, password: string) {
  const sb = getSupabaseBrowserClient();
  if (!sb) return { demo: true };
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signUpWithEmail(email: string, password: string, name: string, city: string, phone: string) {
  const sb = getSupabaseBrowserClient();
  if (!sb) return { demo: true };
  const { data, error } = await sb.auth.signUp({ email, password, options: { data: { name, city, phone } } });
  if (error) throw error;
  return data;
}

export async function signInWithGoogle() {
  const sb = getSupabaseBrowserClient();
  if (!sb) return { demo: true };
  const { data, error } = await sb.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: typeof window !== "undefined" ? window.location.origin : undefined },
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const sb = getSupabaseBrowserClient();
  if (sb) await sb.auth.signOut();
}

export async function resetPassword(email: string) {
  const sb = getSupabaseBrowserClient();
  if (!sb) return { demo: true };
  const { data, error } = await sb.auth.resetPasswordForEmail(email, {
    redirectTo: typeof window !== "undefined" ? `${window.location.origin}/reset-password` : undefined,
  });
  if (error) throw error;
  return data;
}

// ── Converters ────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toListing(r: any): Listing {
  return {
    id: r.id, ownerId: r.owner_id, ownerName: r.owner_name, ownerAvatar: r.owner_avatar,
    ownerRating: Number(r.owner_rating), title: r.title, description: r.description,
    category: r.category, city: r.city, area: r.area,
    address: r.address ?? '', lat: r.lat ?? undefined, lng: r.lng ?? undefined,
    phone: r.phone ?? '', securityRemarks: r.security_remarks ?? '',
    pricePerDay: r.price_per_day,
    securityDeposit: r.security_deposit, delivery: r.delivery, availability: r.availability,
    availableFrom: r.available_from, availableTo: r.available_to, images: r.images ?? [],
    rating: Number(r.rating), reviewCount: r.review_count, badge: r.badge,
    featured: r.featured, createdAt: r.created_at, reports: r.reports,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toProfile(r: any): UserProfile {
  return {
    id: r.id, name: r.name, email: r.email, city: r.city, phone: r.phone ?? "", bio: r.bio, avatar: r.avatar,
    rating: Number(r.rating), reviewCount: r.review_count, verified: r.verified,
    role: r.role, listedItems: r.listed_items, rentalHistory: r.rental_history, banned: r.banned,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toBooking(r: any): Booking {
  return {
    id: r.id, listingId: r.listing_id, renterId: r.renter_id, ownerId: r.owner_id,
    startDate: r.start_date, endDate: r.end_date, status: r.status, note: r.note,
    createdAt: r.created_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toReview(r: any): Review {
  return {
    id: r.id, listingId: r.listing_id, fromUserId: r.from_user_id, toUserId: r.to_user_id,
    rating: r.rating, body: r.body, createdAt: r.created_at, moderated: r.moderated,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toNotification(r: any): Notification {
  return { id: r.id, title: r.title, body: r.body, type: r.type, read: r.read, createdAt: r.created_at };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toThread(r: any, msgs: Message[] = []): Thread {
  return { id: r.id, listingId: r.listing_id, renterId: r.renter_id, ownerId: r.owner_id, messages: msgs };
}

// ── Listings ──────────────────────────────────────────────────────────────────

export async function fetchListings(): Promise<Listing[]> {
  const sb = getSupabaseBrowserClient();
  if (!sb) return [];
  const { data, error } = await sb.from("listings").select("*").order("created_at", { ascending: false });
  if (error) { console.error("fetchListings:", error); return []; }
  return (data ?? []).map(toListing);
}

export async function createListing(listing: Omit<Listing, "id" | "createdAt">, imageFiles?: File[]): Promise<Listing | null> {
  const sb = getSupabaseBrowserClient();
  if (!sb) return null;
  const id = uid("lst");
  let images = listing.images;

  if (imageFiles && imageFiles.length > 0) {
    const urls: string[] = [];
    for (const file of imageFiles) {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${id}/${uid("img")}.${ext}`;
      const { error: upErr } = await sb.storage.from("listing-images").upload(path, file, { upsert: true });
      if (!upErr) {
        const { data: u } = sb.storage.from("listing-images").getPublicUrl(path);
        urls.push(u.publicUrl);
      }
    }
    if (urls.length > 0) images = urls;
  }

  const row = {
    id, owner_id: listing.ownerId, owner_name: listing.ownerName,
    owner_avatar: listing.ownerAvatar, owner_rating: listing.ownerRating,
    title: listing.title, description: listing.description, category: listing.category,
    city: listing.city, area: listing.area,
    address: listing.address ?? '', lat: listing.lat ?? null, lng: listing.lng ?? null,
    phone: listing.phone ?? '', security_remarks: listing.securityRemarks ?? '',
    price_per_day: listing.pricePerDay,
    security_deposit: listing.securityDeposit, delivery: listing.delivery,
    availability: listing.availability, available_from: listing.availableFrom,
    available_to: listing.availableTo, images, rating: listing.rating,
    review_count: listing.reviewCount, badge: listing.badge,
    featured: listing.featured ?? false, reports: listing.reports,
  };
  const { data, error } = await sb.from("listings").insert(row).select().single();
  if (error) { console.error("createListing:", error); return null; }
  return toListing(data);
}

export async function deleteListing(id: string): Promise<void> {
  const sb = getSupabaseBrowserClient();
  if (sb) await sb.from("listings").delete().eq("id", id);
}

export async function incrementListingReports(id: string): Promise<void> {
  const sb = getSupabaseBrowserClient();
  if (!sb) return;
  try {
    await sb.rpc("increment_reports", { listing_id: id });
  } catch {
    await sb.from("listings").update({ reports: 999 }).eq("id", id);
  }
}

// ── Profiles ──────────────────────────────────────────────────────────────────

export async function fetchProfile(userId: string): Promise<UserProfile | null> {
  const sb = getSupabaseBrowserClient();
  if (!sb) return null;
  const { data, error } = await sb.from("profiles").select("*").eq("id", userId).single();
  if (error) { console.error("fetchProfile:", error); return null; }
  return toProfile(data);
}

export async function createProfile(profile: Partial<UserProfile> & { id: string, name: string, email: string }): Promise<UserProfile | null> {
  const sb = getSupabaseBrowserClient();
  if (!sb) return null;
  
  const { data, error } = await sb.from("profiles").insert({
    id: profile.id,
    name: profile.name,
    email: profile.email,
    city: profile.city ?? "",
    phone: profile.phone ?? "",
    bio: profile.bio ?? "",
    avatar: profile.avatar ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.email}`,
    rating: profile.rating ?? 0,
    review_count: profile.reviewCount ?? 0,
    verified: profile.verified ?? false,
    role: profile.role ?? "user",
    listed_items: profile.listedItems ?? 0,
    rental_history: profile.rentalHistory ?? 0,
    banned: profile.banned ?? false,
  }).select("*").single();

  if (error) {
    console.error("createProfile:", error);
    return null;
  }
  return toProfile(data);
}

export async function updateProfile(userId: string, updates: Partial<UserProfile>): Promise<void> {
  const sb = getSupabaseBrowserClient();
  if (!sb) return;
  const row: Record<string, unknown> = {};
  if (updates.name !== undefined) row.name = updates.name;
  if (updates.city !== undefined) row.city = updates.city;
  if (updates.phone !== undefined) row.phone = updates.phone;
  if (updates.bio !== undefined) row.bio = updates.bio;
  if (updates.avatar !== undefined) row.avatar = updates.avatar;
  if (updates.role !== undefined) row.role = updates.role;
  if (updates.listedItems !== undefined) row.listed_items = updates.listedItems;
  if (updates.rentalHistory !== undefined) row.rental_history = updates.rentalHistory;
  await sb.from("profiles").update(row).eq("id", userId);
}

// ── Bookings ──────────────────────────────────────────────────────────────────

export async function fetchMyBookings(userId: string): Promise<Booking[]> {
  const sb = getSupabaseBrowserClient();
  if (!sb) return [];
  const { data, error } = await sb
    .from("bookings")
    .select("*")
    .or(`renter_id.eq.${userId},owner_id.eq.${userId}`)
    .order("created_at", { ascending: false });
  if (error) { console.error("fetchMyBookings:", error); return []; }
  return (data ?? []).map(toBooking);
}

export async function createBooking(booking: Omit<Booking, "createdAt">): Promise<void> {
  const sb = getSupabaseBrowserClient();
  if (!sb) return;
  await sb.from("bookings").insert({
    id: booking.id, listing_id: booking.listingId, renter_id: booking.renterId,
    owner_id: booking.ownerId, start_date: booking.startDate, end_date: booking.endDate,
    status: booking.status, note: booking.note,
  });
}

export async function updateBookingStatus(id: string, status: BookingStatus): Promise<void> {
  const sb = getSupabaseBrowserClient();
  if (sb) await sb.from("bookings").update({ status }).eq("id", id);
}

// ── Threads & Messages ────────────────────────────────────────────────────────

export async function fetchMyThreads(userId: string): Promise<Thread[]> {
  const sb = getSupabaseBrowserClient();
  if (!sb) return [];
  const { data: threadRows, error } = await sb
    .from("threads")
    .select("*")
    .or(`renter_id.eq.${userId},owner_id.eq.${userId}`)
    .order("created_at", { ascending: false });
  if (error || !threadRows) return [];

  const threads: Thread[] = [];
  for (const row of threadRows) {
    const { data: msgRows } = await sb
      .from("messages")
      .select("*")
      .eq("thread_id", row.id)
      .order("created_at", { ascending: true });
    const messages: Message[] = (msgRows ?? []).map((m) => ({
      id: m.id, senderId: m.sender_id, body: m.body, createdAt: m.created_at,
    }));
    threads.push(toThread(row, messages));
  }
  return threads;
}

export async function createThread(thread: Omit<Thread, "messages">): Promise<void> {
  const sb = getSupabaseBrowserClient();
  if (!sb) return;
  await sb.from("threads").insert({
    id: thread.id, listing_id: thread.listingId, renter_id: thread.renterId, owner_id: thread.ownerId,
  });
}

export async function sendMessage(threadId: string, senderId: string, body: string, msgId: string): Promise<void> {
  const sb = getSupabaseBrowserClient();
  if (!sb) return;
  await sb.from("messages").insert({ id: msgId, thread_id: threadId, sender_id: senderId, body });
}

// ── Reviews ───────────────────────────────────────────────────────────────────

export async function fetchReviews(): Promise<Review[]> {
  const sb = getSupabaseBrowserClient();
  if (!sb) return [];
  const { data, error } = await sb.from("reviews").select("*").order("created_at", { ascending: false });
  if (error) return [];
  return (data ?? []).map(toReview);
}

export async function createReview(review: Omit<Review, "createdAt">): Promise<void> {
  const sb = getSupabaseBrowserClient();
  if (!sb) return;
  await sb.from("reviews").insert({
    id: review.id, listing_id: review.listingId, from_user_id: review.fromUserId,
    to_user_id: review.toUserId, rating: review.rating, body: review.body, moderated: false,
  });
}

// ── Notifications ─────────────────────────────────────────────────────────────

export async function fetchNotifications(userId: string): Promise<Notification[]> {
  const sb = getSupabaseBrowserClient();
  if (!sb) return [];
  const { data, error } = await sb
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) return [];
  return (data ?? []).map(toNotification);
}

export async function createNotification(userId: string, notif: Omit<Notification, "createdAt">): Promise<void> {
  const sb = getSupabaseBrowserClient();
  if (!sb) return;
  await sb.from("notifications").insert({
    id: notif.id, user_id: userId, title: notif.title, body: notif.body, type: notif.type, read: false,
  });
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const sb = getSupabaseBrowserClient();
  if (sb) await sb.from("notifications").update({ read: true }).eq("user_id", userId);
}

// ── Favorites ─────────────────────────────────────────────────────────────────

export async function fetchFavorites(userId: string): Promise<string[]> {
  const sb = getSupabaseBrowserClient();
  if (!sb) return [];
  const { data, error } = await sb.from("favorites").select("listing_id").eq("user_id", userId);
  if (error) return [];
  return (data ?? []).map((r) => r.listing_id as string);
}

export async function addFavorite(userId: string, listingId: string): Promise<void> {
  const sb = getSupabaseBrowserClient();
  if (sb) await sb.from("favorites").insert({ user_id: userId, listing_id: listingId });
}

export async function removeFavorite(userId: string, listingId: string): Promise<void> {
  const sb = getSupabaseBrowserClient();
  if (sb) await sb.from("favorites").delete().eq("user_id", userId).eq("listing_id", listingId);
}

export async function triggerEmailNotification(params: {
  type: "new_message" | "new_booking";
  toEmail: string;
  ownerName: string;
  itemTitle: string;
  senderName: string;
  message: string;
}) {
  const sb = getSupabaseBrowserClient();
  if (!sb) return;
  await sb.functions.invoke("notify", {
    body: {
      type: params.type,
      to: params.toEmail,
      ownerName: params.ownerName,
      itemTitle: params.itemTitle,
      senderName: params.senderName,
      message: params.message,
    },
  });
}

export async function fetchProfiles(): Promise<UserProfile[]> {
  const sb = getSupabaseBrowserClient();
  if (!sb) return [];
  const { data, error } = await sb.from("profiles").select("*").order("name", { ascending: true });
  if (error) { console.error("fetchProfiles:", error); return []; }
  return (data ?? []).map(toProfile);
}

export async function updateProfileBannedStatus(userId: string, banned: boolean): Promise<void> {
  const sb = getSupabaseBrowserClient();
  if (sb) await sb.from("profiles").update({ banned }).eq("id", userId);
}
