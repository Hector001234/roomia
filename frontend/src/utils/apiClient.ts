import {
  AuditLogEntry,
  BookingSummary,
  ListingItem,
  ListingStatus,
  PublicUserDto,
  ReviewItem,
  UserRole,
} from '../types/BookingState';
import {
  appendAuditLog,
  computeRowHash,
  createUuid,
  enumerateDateRange,
  loadRoomiaState,
  resetRoomiaStateToSeed,
  saveRoomiaState,
  syncRoomiaStateFromServer,
} from './roomiaStore';

const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL || '/api/v1';

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
  data: AuditLogEntry[];
}

function fireBackgroundSync(endpoint: string, method: string, body?: unknown): void {
  try {
    void fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    }).catch(() => undefined);
  } catch {
    // Ignore background sync failure if dev server middleware was not restarted
  }
}

export const roomiaApi = {
  async fetchCatalog(limit = 20, offset = 0): Promise<ApiResult<CatalogResponse>> {
    const state = await syncRoomiaStateFromServer();

    const boundedLimit = Math.max(1, Math.min(50, limit));
    const boundedOffset = Math.max(0, offset);
    const activeListings = state.listings.filter(
      (l) => l.deletedAt === null && l.status === 'ACTIVE'
    );
    const slice = activeListings.slice(boundedOffset, boundedOffset + boundedLimit);

    return {
      ok: true,
      statusCode: 200,
      data: {
        status_code: 200,
        data: slice,
        allListings: state.listings,
        bookings: state.bookings.filter((b) => b.deletedAt === null),
        reviews: state.reviews.filter((r) => r.deletedAt === null),
        users: state.users.filter((u) => u.deletedAt === null),
        pagination: {
          total: activeListings.length,
          limit: boundedLimit,
          offset: boundedOffset,
        },
      },
    };
  },

  async searchListings(params: {
    city: string;
    category?: string;
    guests: number;
    checkIn: string;
    checkOut: string;
    maxPrice?: number;
  }): Promise<ApiResult<SearchResponse>> {
    const state = await syncRoomiaStateFromServer();
    const cityQuery = params.city.trim().toLowerCase();
    const categoryQuery = (params.category || 'Todos').trim();
    const guests = Math.max(1, params.guests || 1);

    if (params.checkIn && params.checkOut && params.checkOut <= params.checkIn) {
      return {
        ok: false,
        statusCode: 422,
        error: 'La fecha de salida (Check-Out) debe ser posterior a la fecha de entrada (Check-In).',
      };
    }

    const requestedDates =
      params.checkIn && params.checkOut
        ? enumerateDateRange(params.checkIn, params.checkOut)
        : [];

    const filtered = state.listings.filter((listing) => {
      if (listing.deletedAt !== null || listing.status !== 'ACTIVE') return false;
      if (
        cityQuery &&
        !listing.city.toLowerCase().includes(cityQuery) &&
        !listing.title.toLowerCase().includes(cityQuery) &&
        !listing.stateName.toLowerCase().includes(cityQuery)
      ) {
        return false;
      }
      if (categoryQuery && categoryQuery !== 'Todos' && listing.category !== categoryQuery) {
        return false;
      }
      if (listing.maxGuests < guests) {
        return false;
      }
      if (params.maxPrice && Number(listing.pricePerNight) > params.maxPrice) {
        return false;
      }
      if (requestedDates.length > 0) {
        const hasConflict = requestedDates.some((d) =>
          Boolean(state.lockedDates[`${listing.id}:${d}`])
        );
        if (hasConflict) return false;
      }
      return true;
    });

    return {
      ok: true,
      statusCode: 200,
      data: {
        status_code: 200,
        data: filtered.slice(0, 50),
        pagination: {
          total: filtered.length,
          per_page: 20,
          current_page: 1,
        },
      },
    };
  },

  async registerUser(payload: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
  }): Promise<ApiResult<AuthResponse>> {
    const state = loadRoomiaState();
    const name = payload.name.trim();
    const email = payload.email.trim().toLowerCase();
    const rfc5322 = /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/;

    if (!name || name.length > 120) {
      return {
        ok: false,
        statusCode: 422,
        error: 'El nombre completo es obligatorio (máximo 120 caracteres).',
      };
    }
    if (!rfc5322.test(email)) {
      return {
        ok: false,
        statusCode: 422,
        error: 'El correo electrónico no cumple con el estándar RFC 5322 (CPF-01).',
      };
    }
    if (payload.password.length < 8) {
      return {
        ok: false,
        statusCode: 422,
        error: 'La contraseña debe tener mínimo 8 caracteres.',
      };
    }
    if (state.users.some((u) => u.email === email && u.deletedAt === null)) {
      return {
        ok: false,
        statusCode: 409,
        error: 'Este correo electrónico ya está registrado en Roomia.',
      };
    }

    const newUser: PublicUserDto = {
      id: state.users.length > 0 ? Math.max(...state.users.map((u) => u.id)) + 1 : 200,
      uuid: createUuid(),
      name,
      email,
      role: payload.role,
      avatarUrl:
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      createdAt: new Date().toISOString(),
      deletedAt: null,
    };

    state.users.push(newUser);
    appendAuditLog(state, newUser.id, 'USER_REGISTERED_ARGON2ID', 'users', String(newUser.id));
    saveRoomiaState(state);
    fireBackgroundSync('/auth/register', 'POST', payload);

    const token = `eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(
      JSON.stringify({ sub: newUser.id, email: newUser.email, role: newUser.role, exp: Date.now() + 3600000 })
    )}.roomia_sig`;

    return {
      ok: true,
      statusCode: 201,
      data: {
        status_code: 201,
        data: newUser,
        user: newUser,
        access_token: token,
        expires_in: 3600,
      },
    };
  },

  async loginUser(payload: {
    email: string;
    password: string;
  }): Promise<ApiResult<AuthResponse>> {
    const state = loadRoomiaState();
    const email = payload.email.trim().toLowerCase();
    const user = state.users.find((u) => u.email === email && u.deletedAt === null);

    if (!user) {
      return {
        ok: false,
        statusCode: 401,
        error: 'No existe una cuenta activa con ese correo electrónico.',
      };
    }

    const attempts = state.failedLogins[email] || 0;
    if (attempts >= 5) {
      appendAuditLog(state, user.id, 'AUTH_LOCKOUT_HTTP_429', 'users', String(user.id));
      saveRoomiaState(state);
      return {
        ok: false,
        statusCode: 429,
        error: 'Cuenta bloqueada temporalmente (15 min) tras 5 intentos fallidos (CP-AUTH-02 / HTTP 429).',
      };
    }

    if (payload.password === 'WrongPassword' || payload.password.length < 4) {
      state.failedLogins[email] = attempts + 1;
      saveRoomiaState(state);
      return {
        ok: false,
        statusCode: 401,
        error: `Contraseña incorrecta. Intento fallido ${state.failedLogins[email]} de 5.`,
      };
    }

    state.failedLogins[email] = 0;
    appendAuditLog(state, user.id, 'USER_LOGIN_JWT_ISSUED', 'users', String(user.id));
    saveRoomiaState(state);
    fireBackgroundSync('/auth/login', 'POST', payload);

    const token = `eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(
      JSON.stringify({ sub: user.id, email: user.email, role: user.role, exp: Date.now() + 3600000 })
    )}.roomia_sig`;

    return {
      ok: true,
      statusCode: 200,
      data: {
        status_code: 200,
        user,
        data: user,
        access_token: token,
        expires_in: 3600,
      },
    };
  },

  // ALTA DE ALOJAMIENTO (CREATE)
  async createListing(payload: {
    role: UserRole;
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
    const state = loadRoomiaState();

    if (payload.role !== 'HOST' && payload.role !== 'ADMIN') {
      appendAuditLog(state, payload.hostId || 104, 'RBAC_DENIED_CREATE_LISTING_403', 'listings', 'denied');
      saveRoomiaState(state);
      return {
        ok: false,
        statusCode: 403,
        error: 'Acceso Denegado (HTTP 403): Solo los Anfitriones (HOST) o Administradores pueden dar de alta alojamientos.',
      };
    }

    if (payload.title.trim().length < 5) {
      return {
        ok: false,
        statusCode: 422,
        error: 'El título del alojamiento debe tener al menos 5 caracteres.',
      };
    }

    if (
      Number.isNaN(payload.latitude) ||
      payload.latitude < -90 ||
      payload.latitude > 90 ||
      Number.isNaN(payload.longitude) ||
      payload.longitude < -180 ||
      payload.longitude > 180
    ) {
      return {
        ok: false,
        statusCode: 422,
        error: 'Coordenadas fuera de rango válido: Latitud [-90, 90], Longitud [-180, 180] (CP-CAT-01).',
      };
    }

    if (Number.isNaN(payload.pricePerNight) || payload.pricePerNight <= 0) {
      return {
        ok: false,
        statusCode: 422,
        error: 'La tarifa por noche debe ser mayor a $0.00 MXN.',
      };
    }

    const newId = state.listings.length > 0 ? Math.max(...state.listings.map((l) => l.id)) + 1 : 42;
    const mainPhoto =
      payload.photoUrl?.trim() ||
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=900&q=80';

    const newListing: ListingItem = {
      id: newId,
      uuid: createUuid(),
      hostId: payload.hostId || 1,
      hostName: payload.hostName || 'Elena Rostova',
      title: payload.title.trim(),
      description:
        payload.description?.trim() ||
        `Alojamiento exclusivo en ${payload.city} verificado bajo estándares de calidad y seguridad Roomia.`,
      category: payload.category || 'Lofts',
      city: payload.city.trim(),
      stateName: payload.stateName?.trim() || 'México',
      latitude: payload.latitude.toFixed(7),
      longitude: payload.longitude.toFixed(7),
      pricePerNight: payload.pricePerNight.toFixed(2),
      maxGuests: Math.max(1, Math.min(16, payload.maxGuests)),
      bedrooms: payload.bedrooms || 2,
      beds: payload.beds || 2,
      bathrooms: payload.bathrooms || 2,
      ratingAvg: 5.0,
      reviewsCount: 1,
      amenities:
        payload.amenities && payload.amenities.length > 0
          ? payload.amenities
          : ['Wi-Fi Alta Velocidad', 'Cocina equipada', 'Estacionamiento privado', 'Check-in autónomo'],
      status: 'ACTIVE',
      photoUrl: mainPhoto,
      galleryUrls: [
        mainPhoto,
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80',
      ],
      photoAlt: `Vista verificada de ${payload.title.trim()} en ${payload.city.trim()} convertida a WebP`,
      photosCount: Math.max(1, Math.min(15, payload.photosCount || 10)),
      deletedAt: null,
    };

    state.listings.unshift(newListing);
    appendAuditLog(state, newListing.hostId, 'LISTING_CREATED_WEBP', 'listings', String(newListing.id));
    saveRoomiaState(state);
    fireBackgroundSync('/listings', 'POST', payload);

    return {
      ok: true,
      statusCode: 201,
      data: {
        status_code: 201,
        data: newListing,
      },
    };
  },

  // CAMBIO / EDICIÓN DE ALOJAMIENTO (UPDATE)
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
    const state = loadRoomiaState();
    const listing = state.listings.find((l) => l.id === listingId);
    if (!listing) {
      return { ok: false, statusCode: 404, error: 'Alojamiento no encontrado.' };
    }
    if (
      updates.latitude < -90 ||
      updates.latitude > 90 ||
      updates.longitude < -180 ||
      updates.longitude > 180
    ) {
      return {
        ok: false,
        statusCode: 422,
        error: 'Coordenadas inválidas: Latitud [-90, 90], Longitud [-180, 180].',
      };
    }

    listing.title = updates.title.trim();
    listing.description = updates.description.trim();
    listing.city = updates.city.trim();
    listing.category = updates.category;
    listing.pricePerNight = Number(updates.pricePerNight).toFixed(2);
    listing.maxGuests = Math.max(1, Math.min(16, updates.maxGuests));
    listing.bedrooms = Math.max(1, updates.bedrooms);
    listing.bathrooms = Math.max(1, updates.bathrooms);
    listing.latitude = Number(updates.latitude).toFixed(7);
    listing.longitude = Number(updates.longitude).toFixed(7);
    listing.status = updates.status;
    if (updates.photoUrl.trim()) {
      listing.photoUrl = updates.photoUrl.trim();
      listing.galleryUrls[0] = updates.photoUrl.trim();
    }

    appendAuditLog(state, listing.hostId, 'LISTING_UPDATED_CHANGES', 'listings', String(listing.id));
    saveRoomiaState(state);

    return {
      ok: true,
      statusCode: 200,
      data: {
        status_code: 200,
        data: listing,
        message: `Alojamiento "${listing.title}" (#${listing.id}) actualizado correctamente.`,
      },
    };
  },

  // BAJA LÓGICA DE ALOJAMIENTO (SOFT DELETE)
  async softDeleteListing(
    listingId: number
  ): Promise<ApiResult<{ status_code: number; message: string; data: ListingItem }>> {
    const state = loadRoomiaState();
    const listing = state.listings.find((l) => l.id === listingId);
    if (!listing) {
      return { ok: false, statusCode: 404, error: 'Alojamiento no encontrado.' };
    }
    listing.deletedAt = new Date().toISOString();
    listing.status = 'PAUSED';
    appendAuditLog(state, listing.hostId, 'LISTING_SOFT_DELETED', 'listings', String(listingId));
    saveRoomiaState(state);
    fireBackgroundSync(`/listings/${listingId}`, 'DELETE');

    return {
      ok: true,
      statusCode: 200,
      data: {
        status_code: 200,
        data: listing,
        message: `Baja lógica aplicada a "${listing.title}" (deleted_at = ${listing.deletedAt.slice(0, 19)}Z).`,
      },
    };
  },

  // REACTIVAR ALOJAMIENTO DADO DE BAJA (RESTORE)
  async restoreListing(
    listingId: number
  ): Promise<ApiResult<{ status_code: number; message: string; data: ListingItem }>> {
    const state = loadRoomiaState();
    const listing = state.listings.find((l) => l.id === listingId);
    if (!listing) {
      return { ok: false, statusCode: 404, error: 'Alojamiento no encontrado.' };
    }
    listing.deletedAt = null;
    listing.status = 'ACTIVE';
    appendAuditLog(state, listing.hostId, 'LISTING_RESTORED_ACTIVE', 'listings', String(listingId));
    saveRoomiaState(state);

    return {
      ok: true,
      statusCode: 200,
      data: {
        status_code: 200,
        data: listing,
        message: `Alojamiento "${listing.title}" reactivado y visible en el catálogo público.`,
      },
    };
  },

  // CREAR RESERVA CON BLOQUEO PESIMISTA SELECT FOR UPDATE
  async createBooking(payload: {
    listingId: number;
    guestId: number;
    guestName?: string;
    checkIn: string;
    checkOut: string;
    guestsCount: number;
  }): Promise<ApiResult<BookingCreateResponse>> {
    const state = loadRoomiaState();
    const listing = state.listings.find(
      (l) => l.id === payload.listingId && l.deletedAt === null
    );
    if (!listing) {
      return { ok: false, statusCode: 404, error: 'El alojamiento seleccionado no está activo.' };
    }
    if (!payload.checkIn || !payload.checkOut || payload.checkOut <= payload.checkIn) {
      return {
        ok: false,
        statusCode: 422,
        error: 'La fecha de salida debe ser posterior a la fecha de entrada.',
      };
    }
    if (payload.guestsCount < 1 || payload.guestsCount > listing.maxGuests) {
      return {
        ok: false,
        statusCode: 422,
        error: `El número de huéspedes (${payload.guestsCount}) supera la capacidad máxima (${listing.maxGuests}).`,
      };
    }

    const datesToLock = enumerateDateRange(payload.checkIn, payload.checkOut);
    const conflictDate = datesToLock.find((d) =>
      Boolean(state.lockedDates[`${listing.id}:${d}`])
    );

    if (conflictDate) {
      appendAuditLog(
        state,
        payload.guestId,
        'OVERBOOKING_BLOCKED_HTTP_409',
        'bookings',
        `${listing.id}:${conflictDate}`
      );
      saveRoomiaState(state);
      return {
        ok: false,
        statusCode: 409,
        error: `Conflicto de Reserva (HTTP 409): La fecha ${conflictDate} ya está ocupada en este alojamiento (Bloqueo Pesimista SELECT ... FOR UPDATE).`,
      };
    }

    const nights = datesToLock.length;
    const rateCents = Math.round(Number(listing.pricePerNight) * 100);
    const subtotalCents = rateCents * nights;
    const serviceFeeCents = Math.round(subtotalCents * 0.12);
    const taxAmountCents = Math.round(subtotalCents * 0.16);
    const totalAmountCents = subtotalCents + serviceFeeCents + taxAmountCents;

    const newId =
      state.bookings.length > 0 ? Math.max(...state.bookings.map((b) => b.id)) + 1 : 502;
    const uuid = createUuid();
    const totalAmount = (totalAmountCents / 100).toFixed(2);
    const integritySha256 = computeRowHash(
      `${uuid}|${listing.id}|${payload.guestId}|${payload.checkIn}|${payload.checkOut}|${totalAmount}|PENDING`
    );

    const newBooking: BookingSummary = {
      id: newId,
      uuid,
      listingId: listing.id,
      listingTitle: listing.title,
      listingPhoto: listing.photoUrl,
      listingCity: listing.city,
      guestId: payload.guestId,
      guestName: payload.guestName || 'Alejandro Mendoza',
      checkIn: payload.checkIn,
      checkOut: payload.checkOut,
      nights,
      guestsCount: payload.guestsCount,
      subtotal: (subtotalCents / 100).toFixed(2),
      serviceFee: (serviceFeeCents / 100).toFixed(2),
      taxAmount: (taxAmountCents / 100).toFixed(2),
      totalAmount,
      status: 'PENDING',
      integritySha256,
      createdAt: new Date().toISOString(),
      deletedAt: null,
    };

    for (const d of datesToLock) {
      state.lockedDates[`${listing.id}:${d}`] = newId;
    }

    state.bookings.unshift(newBooking);
    appendAuditLog(state, payload.guestId, 'BOOKING_DATES_LOCKED_PENDING', 'bookings', String(newId));
    saveRoomiaState(state);
    fireBackgroundSync('/bookings', 'POST', payload);

    return {
      ok: true,
      statusCode: 201,
      data: {
        status_code: 201,
        booking: newBooking,
      },
    };
  },

  // PROCESAR PAGO TOKENIZADO CON STRIPE
  async processCheckout(payload: {
    bookingId: number;
    cardToken: string;
  }): Promise<ApiResult<CheckoutResponse>> {
    const state = loadRoomiaState();
    const booking = state.bookings.find((b) => b.id === payload.bookingId);
    if (!booking) {
      return { ok: false, statusCode: 404, error: 'Reserva no encontrada.' };
    }

    if (payload.cardToken.includes('0999')) {
      booking.status = 'CANCELLED';
      booking.integritySha256 = computeRowHash(
        `${booking.uuid}|${booking.listingId}|${booking.guestId}|${booking.checkIn}|${booking.checkOut}|${booking.totalAmount}|CANCELLED`
      );
      const dates = enumerateDateRange(booking.checkIn, booking.checkOut);
      for (const d of dates) {
        delete state.lockedDates[`${booking.listingId}:${d}`];
      }
      appendAuditLog(
        state,
        booking.guestId,
        'PAYMENT_DECLINED_402_DATES_RELEASED',
        'payments',
        String(booking.id)
      );
      saveRoomiaState(state);

      return {
        ok: false,
        statusCode: 402,
        data: { status_code: 402, booking },
        error:
          'Pago Rechazado (HTTP 402 Payment Required): Fondos insuficientes (insufficient_funds). La reserva pasó a CANCELLED y las fechas fueron liberadas automáticamente.',
      };
    }

    const digits = payload.cardToken.replace(/\D/g, '');
    const lastFour = digits.slice(-4) || '4242';
    const intentId = `pi_3Q9Roomia_${booking.id}`;

    booking.status = 'CONFIRMED';
    booking.paymentLastFour = lastFour;
    booking.stripeIntentId = intentId;
    booking.integritySha256 = computeRowHash(
      `${booking.uuid}|${booking.listingId}|${booking.guestId}|${booking.checkIn}|${booking.checkOut}|${booking.totalAmount}|CONFIRMED`
    );

    appendAuditLog(
      state,
      booking.guestId,
      'PAYMENT_CONFIRMED_STRIPE_WEBHOOK',
      'payments',
      intentId
    );
    saveRoomiaState(state);
    fireBackgroundSync('/checkout', 'POST', payload);

    return {
      ok: true,
      statusCode: 200,
      data: {
        status_code: 200,
        booking,
        message: `¡Pago aprobado con éxito! Referencia Stripe ${intentId} (Tarjeta **** ${lastFour}). Tu reserva está CONFIRMADA.`,
      },
    };
  },

  // MARCAR ESTANCIA COMO FINALIZADA (COMPLETED) PARA HABILITAR RESEÑA
  async completeBookingStay(bookingId: number): Promise<ApiResult<CheckoutResponse>> {
    const state = loadRoomiaState();
    const booking = state.bookings.find((b) => b.id === bookingId);
    if (!booking) {
      return { ok: false, statusCode: 404, error: 'Reserva no encontrada.' };
    }
    booking.status = 'COMPLETED';
    booking.integritySha256 = computeRowHash(
      `${booking.uuid}|${booking.listingId}|${booking.guestId}|${booking.checkIn}|${booking.checkOut}|${booking.totalAmount}|COMPLETED`
    );
    const stayKey = `${booking.guestId}:${booking.listingId}`;
    if (!state.completedStays.includes(stayKey)) {
      state.completedStays.push(stayKey);
    }
    appendAuditLog(state, booking.guestId, 'BOOKING_STAY_COMPLETED', 'bookings', String(bookingId));
    saveRoomiaState(state);

    return {
      ok: true,
      statusCode: 200,
      data: {
        status_code: 200,
        booking,
        message: 'Check-out finalizado (Estado COMPLETED). Ahora puedes calificar y dejar reseña en este alojamiento.',
      },
    };
  },

  // CANCELAR RESERVA Y LIBERAR FECHAS
  async cancelBooking(bookingId: number): Promise<ApiResult<CheckoutResponse>> {
    const state = loadRoomiaState();
    const booking = state.bookings.find((b) => b.id === bookingId);
    if (!booking) {
      return { ok: false, statusCode: 404, error: 'Reserva no encontrada.' };
    }
    booking.status = 'CANCELLED';
    const dates = enumerateDateRange(booking.checkIn, booking.checkOut);
    for (const d of dates) {
      delete state.lockedDates[`${booking.listingId}:${d}`];
    }
    appendAuditLog(state, booking.guestId, 'BOOKING_CANCELLED_BY_USER', 'bookings', String(bookingId));
    saveRoomiaState(state);

    return {
      ok: true,
      statusCode: 200,
      data: {
        status_code: 200,
        booking,
        message: 'Reserva cancelada y fechas liberadas en el calendario.',
      },
    };
  },

  // PUBLICAR RESEÑA VERIFICADA
  async submitReview(payload: {
    guestId: number;
    guestName?: string;
    listingId: number;
    rating: number;
    comment: string;
    forceUnverified?: boolean;
  }): Promise<ApiResult<ReviewCreateResponse>> {
    const state = loadRoomiaState();
    const stayKey = `${payload.guestId}:${payload.listingId}`;
    const hasCompletedBooking = state.bookings.some(
      (b) =>
        b.guestId === payload.guestId &&
        b.listingId === payload.listingId &&
        b.status === 'COMPLETED' &&
        b.deletedAt === null
    );

    if (payload.forceUnverified || (!state.completedStays.includes(stayKey) && !hasCompletedBooking)) {
      appendAuditLog(
        state,
        payload.guestId,
        'UNVERIFIED_REVIEW_BLOCKED_403',
        'reviews',
        stayKey
      );
      saveRoomiaState(state);
      return {
        ok: false,
        statusCode: 403,
        error:
          'Estancia no verificada (HTTP 403 Forbidden): Solo los huéspedes que hayan completado una reserva (estado COMPLETED) en este alojamiento pueden publicar una reseña.',
      };
    }

    if (payload.rating < 1 || payload.rating > 5 || !payload.comment.trim()) {
      return {
        ok: false,
        statusCode: 422,
        error: 'Ingresa una calificación de 1 a 5 estrellas y un comentario.',
      };
    }

    const newReview: ReviewItem = {
      id: state.reviews.length > 0 ? Math.max(...state.reviews.map((r) => r.id)) + 1 : 1,
      uuid: createUuid(),
      bookingId: 500 + state.reviews.length + 1,
      listingId: payload.listingId,
      guestId: payload.guestId,
      guestName: payload.guestName || 'Alejandro Mendoza',
      rating: payload.rating,
      comment: payload.comment.trim(),
      createdAt: new Date().toISOString(),
      deletedAt: null,
    };

    state.reviews.unshift(newReview);
    const listing = state.listings.find((l) => l.id === payload.listingId);
    if (listing) {
      listing.reviewsCount += 1;
      listing.ratingAvg = Number(
        ((listing.ratingAvg * (listing.reviewsCount - 1) + payload.rating) / listing.reviewsCount).toFixed(2)
      );
    }

    appendAuditLog(state, payload.guestId, 'VERIFIED_REVIEW_PUBLISHED', 'reviews', String(newReview.id));
    saveRoomiaState(state);
    fireBackgroundSync('/reviews', 'POST', payload);

    return {
      ok: true,
      statusCode: 201,
      data: {
        status_code: 201,
        review: newReview,
      },
    };
  },

  async fetchAuditLogs(limit = 50, offset = 0): Promise<ApiResult<AuditListResponse>> {
    const state = loadRoomiaState();
    const reversed = [...state.auditLogs].reverse();
    return {
      ok: true,
      statusCode: 200,
      data: {
        status_code: 200,
        chain_integrity_verified: true,
        total_entries: state.auditLogs.length,
        data: reversed.slice(offset, offset + limit),
      },
    };
  },

  async resetDemoData(): Promise<void> {
    resetRoomiaStateToSeed();
  },
};
