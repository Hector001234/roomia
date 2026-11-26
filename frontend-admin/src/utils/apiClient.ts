import {
  AuditLogEntry,
  BookingSummary,
  ListingItem,
  ListingStatus,
  PublicUserDto,
  ReviewItem,
  UserRole,
} from '../types/BookingState';

const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL || '/api/v1';
const SESSION_TOKEN_KEY = 'roomia_admin_session_token';

let inMemoryToken: string | null = null;

export function setAuthToken(token: string | null): void {
  inMemoryToken = token;
  try {
    if (token) {
      sessionStorage.setItem(SESSION_TOKEN_KEY, token);
    } else {
      sessionStorage.removeItem(SESSION_TOKEN_KEY);
    }
  } catch {
    // ignore storage errors
  }
}

export function getAuthToken(): string | null {
  if (inMemoryToken) return inMemoryToken;
  try {
    const stored = sessionStorage.getItem(SESSION_TOKEN_KEY);
    if (stored) {
      inMemoryToken = stored;
      return stored;
    }
  } catch {
    // ignore storage errors
  }
  return null;
}

export interface ApiResult<T> {
  ok: boolean;
  statusCode: number;
  data?: T;
  error?: string;
}

export interface CatalogResponse {
  status_code: number;
  data: ListingItem[];
  allListings: ListingItem[];
  bookings: BookingSummary[];
  reviews: ReviewItem[];
  users: PublicUserDto[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}

export interface SearchResponse {
  status_code: number;
  data: ListingItem[];
  pagination: {
    total: number;
    per_page: number;
    current_page: number;
  };
}

export interface AuthResponse {
  status_code: number;
  data?: PublicUserDto;
  user?: PublicUserDto;
  access_token: string;
  expires_in: number;
}

export interface BookingCreateResponse {
  status_code: number;
  booking: BookingSummary;
}

export interface CheckoutResponse {
  status_code: number;
  message?: string;
  booking: BookingSummary;
}

export interface ReviewCreateResponse {
  status_code: number;
  review: ReviewItem;
}

export interface AuditListResponse {
  status_code: number;
  chain_integrity_verified: boolean;
  total_entries: number;
  db_views?: {
    booking_tamper_count: number;
    bookings_verified_count: number;
    pci_dss_verdict: string;
    overbooking_conflicts: number;
  };
  data: AuditLogEntry[];
}

async function apiRequest<T>(
  endpoint: string,
  options: { method?: string; body?: unknown } = {}
): Promise<ApiResult<T>> {
  const method = options.method || 'GET';
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const token = getAuthToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });

    const parsed = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    const statusCode = response.status;

    if (!response.ok) {
      const errMsg =
        (typeof parsed.detail === 'string' && parsed.detail) ||
        (typeof parsed.error === 'string' && parsed.error) ||
        `Error HTTP ${statusCode}`;
      return {
        ok: false,
        statusCode,
        data: parsed as unknown as T,
        error: errMsg,
      };
    }

    return {
      ok: true,
      statusCode,
      data: parsed as unknown as T,
    };
  } catch {
    return {
      ok: false,
      statusCode: 0,
      error: 'No se pudo conectar con la API de Roomia (http://127.0.0.1:8000). Verifica que el backend esté activo.',
    };
  }
}

export const roomiaApi = {
  async fetchCatalog(limit = 20, offset = 0): Promise<ApiResult<CatalogResponse>> {
    const qs = new URLSearchParams({
      limit: String(Math.max(1, Math.min(50, limit))),
      offset: String(Math.max(0, offset)),
    });
    return apiRequest<CatalogResponse>(`/listings?${qs.toString()}`);
  },

  async searchListings(params: {
    city: string;
    category?: string;
    guests: number;
    checkIn: string;
    checkOut: string;
    maxPrice?: number;
  }): Promise<ApiResult<SearchResponse>> {
    const qs = new URLSearchParams();
    if (params.city.trim()) qs.set('city', params.city.trim());
    if (params.category && params.category !== 'Todos') qs.set('category', params.category);
    qs.set('guests', String(Math.max(1, params.guests || 1)));
    if (params.checkIn) qs.set('checkIn', params.checkIn);
    if (params.checkOut) qs.set('checkOut', params.checkOut);
    if (params.maxPrice && params.maxPrice > 0) qs.set('maxPrice', String(params.maxPrice));

    return apiRequest<SearchResponse>(`/listings/search?${qs.toString()}`);
  },

  async fetchMe(): Promise<ApiResult<{ status_code: number; user: PublicUserDto }>> {
    return apiRequest<{ status_code: number; user: PublicUserDto }>('/auth/me');
  },

  async registerUser(payload: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
  }): Promise<ApiResult<AuthResponse>> {
    const res = await apiRequest<AuthResponse>('/auth/register', {
      method: 'POST',
      body: payload,
    });
    if (res.ok && res.data?.access_token) {
      setAuthToken(res.data.access_token);
    }
    return res;
  },

  async loginUser(payload: {
    email: string;
    password: string;
  }): Promise<ApiResult<AuthResponse>> {
    const res = await apiRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: payload,
    });
    if (res.ok && res.data?.access_token) {
      setAuthToken(res.data.access_token);
    }
    return res;
  },

  async createListing(payload: {
    role?: UserRole;
    hostId?: number;
    hostName?: string;
    title: string;
    description?: string;
    category?: ListingItem['category'];
    city: string;
    stateName?: string;
    latitude: number;
    longitude: number;
    pricePerNight: number;
    maxGuests: number;
    bedrooms?: number;
    beds?: number;
    bathrooms?: number;
    amenities?: string[];
    photoUrl?: string;
    photosCount: number;
  }): Promise<ApiResult<{ status_code: number; data: ListingItem }>> {
    return apiRequest<{ status_code: number; data: ListingItem }>('/listings', {
      method: 'POST',
      body: payload,
    });
  },

  async updateListing(
    listingId: number,
    updates: {
      title: string;
      description: string;
      city: string;
      category: ListingItem['category'];
      pricePerNight: number;
      maxGuests: number;
      bedrooms: number;
      bathrooms: number;
      latitude: number;
      longitude: number;
      status: ListingStatus;
      photoUrl: string;
    }
  ): Promise<ApiResult<{ status_code: number; data: ListingItem; message: string }>> {
    return apiRequest<{ status_code: number; data: ListingItem; message: string }>(
      `/listings/${listingId}`,
      {
        method: 'PATCH',
        body: updates,
      }
    );
  },

  async softDeleteListing(
    listingId: number
  ): Promise<ApiResult<{ status_code: number; message: string; data: ListingItem }>> {
    return apiRequest<{ status_code: number; message: string; data: ListingItem }>(
      `/listings/${listingId}`,
      { method: 'DELETE' }
    );
  },

  async restoreListing(
    listingId: number
  ): Promise<ApiResult<{ status_code: number; message: string; data: ListingItem }>> {
    return apiRequest<{ status_code: number; message: string; data: ListingItem }>(
      `/listings/${listingId}/restore`,
      { method: 'PATCH' }
    );
  },

  async createBooking(payload: {
    listingId: number;
    guestId: number;
    guestName?: string;
    checkIn: string;
    checkOut: string;
    guestsCount: number;
  }): Promise<ApiResult<BookingCreateResponse>> {
    return apiRequest<BookingCreateResponse>('/bookings', {
      method: 'POST',
      body: payload,
    });
  },

  async processCheckout(payload: {
    bookingId: number;
    cardToken: string;
  }): Promise<ApiResult<CheckoutResponse>> {
    return apiRequest<CheckoutResponse>('/checkout', {
      method: 'POST',
      body: payload,
    });
  },

  async completeBookingStay(bookingId: number): Promise<ApiResult<CheckoutResponse>> {
    return apiRequest<CheckoutResponse>(`/bookings/${bookingId}/complete`, {
      method: 'PATCH',
    });
  },

  async cancelBooking(bookingId: number): Promise<ApiResult<CheckoutResponse>> {
    return apiRequest<CheckoutResponse>(`/bookings/${bookingId}/cancel`, {
      method: 'PATCH',
    });
  },

  async submitReview(payload: {
    guestId: number;
    guestName?: string;
    listingId: number;
    rating: number;
    comment: string;
    forceUnverified?: boolean;
  }): Promise<ApiResult<ReviewCreateResponse>> {
    return apiRequest<ReviewCreateResponse>('/reviews', {
      method: 'POST',
      body: payload,
    });
  },

  async fetchAuditLogs(limit = 50, offset = 0): Promise<ApiResult<AuditListResponse>> {
    const qs = new URLSearchParams({
      limit: String(limit),
      offset: String(offset),
    });
    return apiRequest<AuditListResponse>(`/audit?${qs.toString()}`);
  },

  async resetDemoData(): Promise<void> {
    await this.fetchCatalog();
  },
};
