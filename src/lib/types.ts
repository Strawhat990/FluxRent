export type BookingStatus = "pending" | "accepted" | "rejected" | "completed";

export type UserRole = "renter" | "owner" | "admin";

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  city: string;
  bio: string;
  avatar: string;
  rating: number;
  reviewCount: number;
  verified: boolean;
  role: UserRole;
  listedItems: number;
  rentalHistory: number;
  banned?: boolean;
};

export type Listing = {
  id: string;
  ownerId: string;
  ownerName: string;
  ownerAvatar: string;
  ownerRating: number;
  title: string;
  description: string;
  category: string;
  city: string;
  area: string;
  pricePerDay: number;
  securityDeposit: number;
  delivery: "pickup" | "delivery" | "both";
  availability: "available" | "limited" | "booked";
  availableFrom: string;
  availableTo: string;
  images: string[];
  rating: number;
  reviewCount: number;
  badge: string;
  featured?: boolean;
  createdAt: string;
  reports: number;
};

export type Booking = {
  id: string;
  listingId: string;
  renterId: string;
  ownerId: string;
  startDate: string;
  endDate: string;
  status: BookingStatus;
  note: string;
  createdAt: string;
};

export type Message = {
  id: string;
  senderId: string;
  body: string;
  createdAt: string;
};

export type Thread = {
  id: string;
  listingId: string;
  renterId: string;
  ownerId: string;
  messages: Message[];
};

export type Review = {
  id: string;
  listingId: string;
  fromUserId: string;
  toUserId: string;
  rating: number;
  body: string;
  createdAt: string;
  moderated?: boolean;
};

export type Notification = {
  id: string;
  title: string;
  body: string;
  type: "message" | "booking" | "favorite" | "review" | "system";
  read: boolean;
  createdAt: string;
};
