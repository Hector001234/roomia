export type UserRole = 'GUEST' | 'HOST' | 'ADMIN';
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
export type ListingStatus = 'ACTIVE' | 'PAUSED' | 'DRAFT';

export interface PublicUserDto {
  id: number;
  uuid: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl: string;
  createdAt: string;
  deletedAt: string | null;
}

export interface ListingItem {
  id: number;
  uuid: string;
  hostId: number;
  hostName: string;
  title: string;
  description: string;
  category: 'Cabañas' | 'Lofts' | 'Colonial' | 'Alberca' | 'Montaña' | 'Urbano';
  city: string;
  stateName: string;
  latitude: string;
  longitude: string;
  pricePerNight: string;
  maxGuests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  ratingAvg: number;
  reviewsCount: number;
  amenities: string[];
  status: ListingStatus;
  photoUrl: string;
  galleryUrls: string[];
  photoAlt: string;
  photosCount: number;
  deletedAt: string | null;
}

export interface BookingSummary {
  id: number;
  uuid: string;
  listingId: number;
  listingTitle: string;
  listingPhoto: string;
  listingCity: string;
  guestId: number;
  guestName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guestsCount: number;
  subtotal: string;
  serviceFee: string;
  taxAmount: string;
  totalAmount: string;
  status: BookingStatus;
  paymentLastFour?: string;
  stripeIntentId?: string;
  integritySha256: string;
  createdAt: string;
  deletedAt: string | null;
}

export interface ReviewItem {
  id: number;
  uuid: string;
  bookingId: number;
  listingId: number;
  guestId: number;
  guestName: string;
  rating: number;
  comment: string;
  createdAt: string;
  deletedAt: string | null;
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
