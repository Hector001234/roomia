/**
 * Section 14.1 Compliance: Strict TypeScript interfaces without 'any'.
 */
export type UserRole = 'GUEST' | 'HOST' | 'ADMIN';

export type BookingLifecycleStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';

export interface ListingItem {
  id: number;
  uuid: string;
  title: string;
  city: string;
  latitude: string;
  longitude: string;
  pricePerNight: string;
  maxGuests: number;
  photoUrl: string;
  photoAlt: string;
}

export interface BookingState {
  bookingId: number | null;
  uuid: string | null;
  listingId: number;
  checkIn: string;
  checkOut: string;
  guestsCount: number;
  nightlyRate: string;
  totalAmount: string;
  status: BookingLifecycleStatus;
  integritySha256: string | null;
}

export interface AuditLogEntry {
  id: number;
  uuid: string;
  userId: number | null;
  eventType: string;
  entityType: string;
  entityId: string;
  ipAnonymized: string;
  previousHash: string;
  currentHash: string;
  createdAtUtc: string;
}
