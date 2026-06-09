import type { Booking, Listing, Notification, Review, Thread, UserProfile } from "./types";

export const demoUsers: UserProfile[] = [
  {
    id: "user-rhea",
    name: "Rhea Malhotra",
    email: "rhea@leasify.test",
    city: "Bangalore",
    bio: "Weekend creator, careful renter, and camera gear obsessive.",
    avatar: "RM",
    rating: 4.9,
    reviewCount: 42,
    verified: true,
    role: "renter",
    listedItems: 2,
    rentalHistory: 18,
  },
  {
    id: "user-arjun",
    name: "Arjun Kapur",
    email: "arjun@leasify.test",
    city: "Bangalore",
    bio: "Photography studio owner. I rent clean, tested equipment with flexible pickup.",
    avatar: "AK",
    rating: 5,
    reviewCount: 128,
    verified: true,
    role: "owner",
    listedItems: 7,
    rentalHistory: 96,
  },
  {
    id: "user-priya",
    name: "Priya Shah",
    email: "priya@leasify.test",
    city: "Bangalore",
    bio: "Designer wardrobe curator with event-ready outfits and jewelry.",
    avatar: "PS",
    rating: 4.8,
    reviewCount: 76,
    verified: true,
    role: "owner",
    listedItems: 14,
    rentalHistory: 121,
  },
  {
    id: "user-admin",
    name: "Leasify Admin",
    email: "admin@leasify.test",
    city: "Bangalore",
    bio: "Marketplace operations and trust team.",
    avatar: "RA",
    rating: 5,
    reviewCount: 12,
    verified: true,
    role: "admin",
    listedItems: 0,
    rentalHistory: 0,
  },
];

export const categories = [
  "All",
  "Cameras",
  "Vehicles",
  "Fashion",
  "Tools",
  "Gaming",
  "Music",
  "Outdoors",
  "Electronics",
  "Events",
  "Appliances",
];

export const demoListings: Listing[] = [];

export const demoBookings: Booking[] = [
  {
    id: "book-001",
    listingId: "lst-partybox",
    renterId: "user-arjun",
    ownerId: "user-rhea",
    startDate: "2026-06-06",
    endDate: "2026-06-08",
    status: "pending",
    note: "Need it for a terrace birthday party. Pickup works for me.",
    createdAt: "2026-06-01T08:00:00.000Z",
  },
  {
    id: "book-002",
    listingId: "lst-camera-a7",
    renterId: "user-rhea",
    ownerId: "user-arjun",
    startDate: "2026-06-11",
    endDate: "2026-06-13",
    status: "accepted",
    note: "Short film shoot. Can collect from Koramangala.",
    createdAt: "2026-05-31T08:00:00.000Z",
  },
];

export const demoThreads: Thread[] = [
  {
    id: "thread-camera-rhea",
    listingId: "lst-camera-a7",
    renterId: "user-rhea",
    ownerId: "user-arjun",
    messages: [
      {
        id: "msg-1",
        senderId: "user-rhea",
        body: "Is the 24-70 lens included for June 11?",
        createdAt: "2026-06-01T08:14:00.000Z",
      },
      {
        id: "msg-2",
        senderId: "user-arjun",
        body: "Yes, lens, two batteries, charger, and SD cards are included.",
        createdAt: "2026-06-01T08:16:00.000Z",
      },
    ],
  },
];

export const demoReviews: Review[] = [
  {
    id: "rev-001",
    listingId: "lst-camera-a7",
    fromUserId: "user-rhea",
    toUserId: "user-arjun",
    rating: 5,
    body: "Camera was spotless and Arjun explained every setting I needed.",
    createdAt: "2026-05-20T08:00:00.000Z",
  },
  {
    id: "rev-002",
    listingId: "lst-lehenga",
    fromUserId: "user-rhea",
    toUserId: "user-priya",
    rating: 5,
    body: "Beautiful outfit, clear sizing help, and very easy delivery.",
    createdAt: "2026-05-25T08:00:00.000Z",
  },
];

export const demoNotifications: Notification[] = [
  {
    id: "not-001",
    title: "New booking request",
    body: "Arjun requested your JBL PartyBox for June 6 to June 8.",
    type: "booking",
    read: false,
    createdAt: "2026-06-01T08:00:00.000Z",
  },
  {
    id: "not-002",
    title: "Message received",
    body: "Arjun replied about the camera kit.",
    type: "message",
    read: false,
    createdAt: "2026-06-01T08:16:00.000Z",
  },
];
