import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatInr(value: number) {
  return `INR ${value.toLocaleString("en-IN")}`;
}

export function daysBetween(startDate: string, endDate: string) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const ms = end.getTime() - start.getTime();
  return Math.max(1, Math.ceil(ms / 86_400_000) + 1);
}

export function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36)}`;
}

export function getDistanceInKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

/** Returns freshness label text + CSS variant class based on listing age */
export function getFreshnessLabel(createdAt: string): { label: string; cls: string } {
  const diffMs = Date.now() - new Date(createdAt).getTime();
  const diffH = diffMs / 3_600_000;
  if (diffH < 3)   return { label: "Just listed", cls: "freshness-today" };
  if (diffH < 24)  return { label: "Today",       cls: "freshness-today" };
  if (diffH < 72)  return { label: "This week",   cls: "freshness-recent" };
  if (diffH < 168) return { label: "7 days ago",  cls: "freshness-recent" };
  return { label: "Older",                         cls: "freshness-old" };
}

