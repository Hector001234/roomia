import {
  AuditLogEntry,
  BookingSummary,
  ListingItem,
  PublicUserDto,
  ReviewItem,
} from '../types/BookingState';

const STORAGE_KEY = 'roomia_v3_1_full_state_v2';

function deterministicHexHash(input: string): string {
  // Fast deterministic 64-char SHA-256 simulation for synchronous browser state
  let h1 = 0xdeadbeef ^ input.length;
  let h2 = 0x41c6ce57 ^ input.length;
  let h3 = 0x9e3779b9 ^ input.length;
  let h4 = 0x85ebca6b ^ input.length;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
    h3 = Math.imul(h3 ^ ch, 2246822507);
    h4 = Math.imul(h4 ^ ch, 3266489909);
  }
  const part = (n: number, salt: number) =>
    ((n ^ salt) >>> 0).toString(16).padStart(8, '0');
  return (
    part(h1, 0xa5a5a5a5) +
    part(h2, 0x5a5a5a5a) +
    part(h3, 0x3c3c3c3c) +
    part(h4, 0xc3c3c3c3) +
    part(h1 ^ h3, 0x12345678) +
    part(h2 ^ h4, 0x87654321) +
    part(h1 + h2, 0xabcdef01) +
    part(h3 + h4, 0x10fedcba)
  ).slice(0, 64);
}

function generateUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export interface RoomiaDatabaseState {
  users: PublicUserDto[];
  listings: ListingItem[];
  bookings: BookingSummary[];
  lockedDates: Record<string, number>;
  reviews: ReviewItem[];
  completedStays: string[];
  auditLogs: AuditLogEntry[];
  failedLogins: Record<string, number>;
}

function buildSeedState(): RoomiaDatabaseState {
  const genesisPrev = '0'.repeat(64);
  const t1 = '2026-11-05T18:00:00.120Z';
  const h1 = deterministicHexHash(`${genesisPrev}|SYSTEM_GENESIS_INIT|system|roomia-v3.1|189.203.44.XXX|${t1}`);
  const t2 = '2026-11-05T18:02:15.400Z';
  const h2 = deterministicHexHash(`${h1}|CATALOG_SEEDED_12_LISTINGS|listings|all|189.203.44.XXX|${t2}`);
  const t3 = '2026-11-05T18:05:30.800Z';
  const h3 = deterministicHexHash(`${h2}|BOOKING_CONFIRMED_SEED|bookings|501|189.203.44.XXX|${t3}`);

  const users: PublicUserDto[] = [
    {
      id: 104,
      uuid: '10000000-0000-4000-8000-000000000104',
      name: 'Alejandro Mendoza',
      email: 'guest.alejandro@roomia.mx',
      role: 'GUEST',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      createdAt: '2026-10-15T10:00:00.000Z',
      deletedAt: null,
    },
    {
      id: 1,
      uuid: '10000000-0000-4000-8000-000000000001',
      name: 'Elena Rostova (Superanfitriona)',
      email: 'host.elena@roomia.mx',
      role: 'HOST',
      avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80',
      createdAt: '2026-10-10T09:00:00.000Z',
      deletedAt: null,
    },
    {
      id: 999,
      uuid: '10000000-0000-4000-8000-000000000999',
      name: 'Auditor CISA / Admin TI',
      email: 'auditor.ti@roomia.mx',
      role: 'ADMIN',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
      createdAt: '2026-10-01T08:00:00.000Z',
      deletedAt: null,
    },
  ];

  const listings: ListingItem[] = [
    {
      id: 42,
      uuid: '42424242-4242-4242-8242-424242424242',
      hostId: 1,
      hostName: 'Elena Rostova',
      title: 'Loft Alpino Panorámico frente al Nevado',
      description:
        'Espectacular loft de arquitectura contemporánea con ventanales de piso a techo hacia el Nevado de Toluca. Cuenta con chimenea de etanol, internet Starlink de 300 Mbps, cocina de autor y terraza privada de madera.',
      category: 'Montaña',
      city: 'Toluca',
      stateName: 'Estado de México',
      latitude: '19.2826000',
      longitude: '-99.6557000',
      pricePerNight: '1500.00',
      maxGuests: 4,
      bedrooms: 2,
      beds: 2,
      bathrooms: 2,
      ratingAvg: 4.96,
      reviewsCount: 38,
      amenities: ['Wi-Fi 300 Mbps', 'Chimenea', 'Estacionamiento privado', 'Vista al volcán', 'Cocina equipada', 'Check-in autónomo'],
      status: 'ACTIVE',
      photoUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=900&q=80',
      galleryUrls: [
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=900&q=80',
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?auto=format&fit=crop&w=800&q=80',
      ],
      photoAlt: 'Loft Alpino Panorámico en Toluca en formato WebP',
      photosCount: 15,
      deletedAt: null,
    },
    {
      id: 43,
      uuid: '43434343-4343-4343-8343-434343434343',
      hostId: 1,
      hostName: 'Elena Rostova',
      title: 'Cabaña A-Frame en el Bosque con Jacuzzi Térmico',
      description:
        'Refugio nórdico rodeado de pinos centenarios en Valle de Bravo. Disfruta de su jacuzzi exterior climatizado a 39°C bajo las estrellas, fogatero privado, deck suspendido y acceso directo a senderos de montaña.',
      category: 'Cabañas',
      city: 'Valle de Bravo',
      stateName: 'Estado de México',
      latitude: '19.1951000',
      longitude: '-100.1326000',
      pricePerNight: '2450.00',
      maxGuests: 6,
      bedrooms: 3,
      beds: 4,
      bathrooms: 2.5,
      ratingAvg: 4.99,
      reviewsCount: 64,
      amenities: ['Jacuzzi climatizado', 'Fogatero exterior', 'Pet Friendly', 'Asador Weber', 'Wi-Fi fibra óptica', 'Chimenea de leña'],
      status: 'ACTIVE',
      photoUrl: 'https://images.unsplash.com/photo-1449844908441-8829872d2607?auto=format&fit=crop&w=900&q=80',
      galleryUrls: [
        'https://images.unsplash.com/photo-1449844908441-8829872d2607?auto=format&fit=crop&w=900&q=80',
        'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=800&q=80',
      ],
      photoAlt: 'Cabaña A-Frame en Valle de Bravo en formato WebP',
      photosCount: 15,
      deletedAt: null,
    },
    {
      id: 44,
      uuid: '44444444-4444-4444-8444-444444444444',
      hostId: 1,
      hostName: 'Elena Rostova',
      title: 'Suite Colonial del Árbol de la Vida — Metepec',
      description:
        'Casona histórica restaurada en el corazón del Pueblo Mágico de Metepec, a dos cuadras de la Iglesia del Calvario. Bóvedas catalanas originales, patio central con fuente de cantera y estudio de trabajo.',
      category: 'Colonial',
      city: 'Metepec',
      stateName: 'Estado de México',
      latitude: '19.2519000',
      longitude: '-99.6046000',
      pricePerNight: '1250.00',
      maxGuests: 2,
      bedrooms: 1,
      beds: 1,
      bathrooms: 1,
      ratingAvg: 4.91,
      reviewsCount: 29,
      amenities: ['Zona de trabajo', 'Terraza privada', 'Cafetera espresso', 'Centro Histórico', 'Smart TV 65"', 'Calefacción'],
      status: 'ACTIVE',
      photoUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=900&q=80',
      galleryUrls: [
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=900&q=80',
        'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=800&q=80',
      ],
      photoAlt: 'Suite Colonial en Metepec Centro en formato WebP',
      photosCount: 12,
      deletedAt: null,
    },
    {
      id: 45,
      uuid: '45454545-4545-4545-8545-454545454545',
      hostId: 1,
      hostName: 'Elena Rostova',
      title: 'Villa Sustentable con Alberca Infinita — Malinalco',
      description:
        'Villa de descanso con alberca infinita climatizada con vista a los cerros sagrados de Malinalco. Jardines tropicales, palapa con horno de leña y arquitectura bioclimática en piedra y bambú.',
      category: 'Alberca',
      city: 'Malinalco',
      stateName: 'Estado de México',
      latitude: '18.9483000',
      longitude: '-99.4947000',
      pricePerNight: '3200.00',
      maxGuests: 8,
      bedrooms: 4,
      beds: 5,
      bathrooms: 4,
      ratingAvg: 4.97,
      reviewsCount: 52,
      amenities: ['Alberca infinita', 'Horno de leña', 'Jardín 800m²', 'Aire acondicionado', 'Estacionamiento 4 autos', 'Seguridad 24/7'],
      status: 'ACTIVE',
      photoUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=900&q=80',
      galleryUrls: [
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=900&q=80',
        'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
      ],
      photoAlt: 'Villa con alberca infinita en Malinalco en formato WebP',
      photosCount: 15,
      deletedAt: null,
    },
    {
      id: 46,
      uuid: '46464646-4646-4646-8646-464646464646',
      hostId: 1,
      hostName: 'Elena Rostova',
      title: 'Penthouse Industrial Roma Norte con Roof Garden',
      description:
        'Penthouse de doble altura en el corazón gastronómico de Roma Norte. Diseño industrial con concreto aparente, terraza ajardinada privada, cava de vinos y aislamiento acústico de triple cristal.',
      category: 'Lofts',
      city: 'Ciudad de México',
      stateName: 'CDMX',
      latitude: '19.4194000',
      longitude: '-99.1625000',
      pricePerNight: '2150.00',
      maxGuests: 4,
      bedrooms: 2,
      beds: 2,
      bathrooms: 2,
      ratingAvg: 4.94,
      reviewsCount: 81,
      amenities: ['Roof Garden privado', 'Doble altura', 'Elevador directo', 'Seguridad 24h', 'Wi-Fi 500 Mbps', 'Aire acondicionado'],
      status: 'ACTIVE',
      photoUrl: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=900&q=80',
      galleryUrls: [
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=900&q=80',
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80',
      ],
      photoAlt: 'Penthouse Industrial en Roma Norte CDMX en formato WebP',
      photosCount: 14,
      deletedAt: null,
    },
    {
      id: 47,
      uuid: '47474747-4747-4747-8747-474747474747',
      hostId: 1,
      hostName: 'Elena Rostova',
      title: 'Santuario Termal & Spa Privado — Ixtapan de la Sal',
      description:
        'Residencia californiana con alberca termal privada, vapor húmedo y terraza soleada todo el año. Ideal para escapadas familiares de bienestar y relajación a 50 minutos de Toluca.',
      category: 'Alberca',
      city: 'Ixtapan de la Sal',
      stateName: 'Estado de México',
      latitude: '18.8436000',
      longitude: '-99.6767000',
      pricePerNight: '1890.00',
      maxGuests: 6,
      bedrooms: 3,
      beds: 4,
      bathrooms: 3,
      ratingAvg: 4.89,
      reviewsCount: 24,
      amenities: ['Alberca climatizada', 'Vapor privado', 'Camastros', 'Asador argentino', 'Cocina integral', 'Estacionamiento'],
      status: 'ACTIVE',
      photoUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=900&q=80',
      galleryUrls: [
        'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=900&q=80',
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
      ],
      photoAlt: 'Santuario Termal en Ixtapan de la Sal en formato WebP',
      photosCount: 10,
      deletedAt: null,
    },
    {
      id: 48,
      uuid: '48484848-4848-4848-8848-484848484848',
      hostId: 1,
      hostName: 'Elena Rostova',
      title: 'Chalet Suizo entre la Niebla — La Marquesa',
      description:
        'Chalet de madera maciza enclavado en el Parque Nacional Insurgente Miguel Hidalgo. Despierta entre la niebla del bosque con desayuno campestre, calefacción hidrónica y mirador de cristal.',
      category: 'Cabañas',
      city: 'Ocoyoacac',
      stateName: 'Estado de México',
      latitude: '19.2981000',
      longitude: '-99.3812000',
      pricePerNight: '1680.00',
      maxGuests: 4,
      bedrooms: 2,
      beds: 3,
      bathrooms: 2,
      ratingAvg: 4.95,
      reviewsCount: 41,
      amenities: ['Chimenea ecológica', 'Mirador de cristal', 'Senderismo privado', 'Calefacción', 'Wi-Fi', 'Desayuno incluido'],
      status: 'ACTIVE',
      photoUrl: 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=900&q=80',
      galleryUrls: [
        'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=900&q=80',
        'https://images.unsplash.com/photo-1449844908441-8829872d2607?auto=format&fit=crop&w=800&q=80',
      ],
      photoAlt: 'Chalet Suizo en La Marquesa en formato WebP',
      photosCount: 11,
      deletedAt: null,
    },
    {
      id: 49,
      uuid: '49494949-4949-4949-8949-494949494949',
      hostId: 1,
      hostName: 'Elena Rostova',
      title: 'Bungalow Místico frente al Tepozteco',
      description:
        'Bungalow de diseño orgánico con vista frontal a los acantilados del Tepozteco. Cuenta con temazcal tradicional de piedra volcánica, alberca de agua salada y huerto orgánico.',
      category: 'Montaña',
      city: 'Tepoztlán',
      stateName: 'Morelos',
      latitude: '18.9848000',
      longitude: '-99.0931000',
      pricePerNight: '2300.00',
      maxGuests: 4,
      bedrooms: 2,
      beds: 2,
      bathrooms: 2,
      ratingAvg: 4.98,
      reviewsCount: 57,
      amenities: ['Temazcal privado', 'Alberca de sal', 'Vista al Tepozteco', 'Hamacas', 'Wi-Fi alta velocidad', 'Cocina exterior'],
      status: 'ACTIVE',
      photoUrl: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=900&q=80',
      galleryUrls: [
        'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=900&q=80',
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
      ],
      photoAlt: 'Bungalow frente al Tepozteco en formato WebP',
      photosCount: 13,
      deletedAt: null,
    },
    {
      id: 50,
      uuid: '50505050-5050-4050-8050-505050505050',
      hostId: 1,
      hostName: 'Elena Rostova',
      title: 'Residencia Virreinal del Acueducto — Querétaro',
      description:
        'Mansión del siglo XVIII restaurada con lujo contemporáneo en el Centro Histórico de Querétaro. Arcos de cantera rosa, terraza con vista a los templos barrocos y cava subterránea.',
      category: 'Colonial',
      city: 'Querétaro',
      stateName: 'Querétaro',
      latitude: '20.5888000',
      longitude: '-100.3899000',
      pricePerNight: '1950.00',
      maxGuests: 5,
      bedrooms: 3,
      beds: 3,
      bathrooms: 2.5,
      ratingAvg: 4.93,
      reviewsCount: 33,
      amenities: ['Arquitectura siglo XVIII', 'Cava subterránea', 'Terraza panorámica', 'Aire acondicionado', 'Wi-Fi', 'Cochera privada'],
      status: 'ACTIVE',
      photoUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=80',
      galleryUrls: [
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=80',
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80',
      ],
      photoAlt: 'Residencia Virreinal en Querétaro en formato WebP',
      photosCount: 12,
      deletedAt: null,
    },
    {
      id: 51,
      uuid: '51515151-5151-4151-8151-515151515151',
      hostId: 1,
      hostName: 'Elena Rostova',
      title: 'Sky Studio Ejecutivo Santa Fe — Vista Corporativa',
      description:
        'Estudio de lujo en el piso 28 frente al Parque La Mexicana. Ideal para viajes de negocios y nómadas digitales, con escritorio ergonómico Herman Miller, gimnasio y sky lounge.',
      category: 'Urbano',
      city: 'Ciudad de México',
      stateName: 'CDMX',
      latitude: '19.3592000',
      longitude: '-99.2689000',
      pricePerNight: '1750.00',
      maxGuests: 2,
      bedrooms: 1,
      beds: 1,
      bathrooms: 1,
      ratingAvg: 4.92,
      reviewsCount: 47,
      amenities: ['Frente a La Mexicana', 'Piso 28', 'Gimnasio & Spa', 'Silla Herman Miller', 'Seguridad biométrica', 'Estacionamiento'],
      status: 'ACTIVE',
      photoUrl: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=900&q=80',
      galleryUrls: [
        'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=900&q=80',
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80',
      ],
      photoAlt: 'Sky Studio Ejecutivo en Santa Fe CDMX en formato WebP',
      photosCount: 9,
      deletedAt: null,
    },
  ];

  const bookings: BookingSummary[] = [
    {
      id: 501,
      uuid: '50100000-0000-4000-8000-000000000501',
      listingId: 42,
      listingTitle: 'Loft Alpino Panorámico frente al Nevado',
      listingPhoto: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=900&q=80',
      listingCity: 'Toluca',
      guestId: 104,
      guestName: 'Alejandro Mendoza',
      checkIn: '2026-10-10',
      checkOut: '2026-10-13',
      nights: 3,
      guestsCount: 2,
      subtotal: '4500.00',
      serviceFee: '540.00',
      taxAmount: '720.00',
      totalAmount: '5760.00',
      status: 'COMPLETED',
      paymentLastFour: '4242',
      stripeIntentId: 'pi_3Q9RoomiaSeed_501',
      integritySha256: deterministicHexHash('501|42|104|2026-10-10|2026-10-13|5760.00|COMPLETED'),
      createdAt: '2026-10-05T14:20:00.000Z',
      deletedAt: null,
    },
  ];

  const reviews: ReviewItem[] = [
    {
      id: 1,
      uuid: '90000000-0000-4000-8000-000000000001',
      bookingId: 501,
      listingId: 42,
      guestId: 104,
      guestName: 'Alejandro Mendoza',
      rating: 5,
      comment:
        'La vista al Nevado de Toluca al amanecer es impresionante. El internet de alta velocidad funcionó perfecto para mis videollamadas y la chimenea calienta todo el loft en minutos.',
      createdAt: '2026-10-14T11:30:00.000Z',
      deletedAt: null,
    },
    {
      id: 2,
      uuid: '90000000-0000-4000-8000-000000000002',
      bookingId: 502,
      listingId: 43,
      guestId: 104,
      guestName: 'Sofía Villaseñor',
      rating: 5,
      comment:
        'La cabaña A-Frame superó nuestras expectativas. El jacuzzi caliente en medio del bosque de Valle de Bravo es una experiencia inolvidable.',
      createdAt: '2026-10-20T18:15:00.000Z',
      deletedAt: null,
    },
  ];

  const auditLogs: AuditLogEntry[] = [
    {
      id: 1,
      uuid: '11111111-1111-4111-8111-111111111111',
      userId: 999,
      eventType: 'SYSTEM_GENESIS_INIT',
      entityType: 'system',
      entityId: 'roomia-v3.1',
      ipAnonymized: '189.203.44.XXX',
      previousHash: genesisPrev,
      currentHash: h1,
      createdAtUtc: t1,
    },
    {
      id: 2,
      uuid: '22222222-2222-4222-8222-222222222222',
      userId: 1,
      eventType: 'CATALOG_SEEDED_WEBP',
      entityType: 'listings',
      entityId: '42..51',
      ipAnonymized: '189.203.44.XXX',
      previousHash: h1,
      currentHash: h2,
      createdAtUtc: t2,
    },
    {
      id: 3,
      uuid: '33333333-3333-4333-8333-333333333333',
      userId: 104,
      eventType: 'BOOKING_COMPLETED_VERIFIED',
      entityType: 'bookings',
      entityId: '501',
      ipAnonymized: '189.203.44.XXX',
      previousHash: h2,
      currentHash: h3,
      createdAtUtc: t3,
    },
  ];

  return {
    users,
    listings,
    bookings,
    lockedDates: {},
    reviews,
    completedStays: ['104:42', '104:43'],
    auditLogs,
    failedLogins: {},
  };
}

let initialAdminSyncSent = false;

export function loadRoomiaState(): RoomiaDatabaseState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as RoomiaDatabaseState;
      if (Array.isArray(parsed.listings) && parsed.listings.length > 0) {
        if (!initialAdminSyncSent) {
          initialAdminSyncSent = true;
          void fetch('/api/v1/state-sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(parsed),
          }).catch(() => undefined);
        }
        return parsed;
      }
    }
  } catch {
    // Fallback to seed state
  }
  const initial = buildSeedState();
  saveRoomiaState(initial);
  return initial;
}

export function saveRoomiaState(state: RoomiaDatabaseState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    void fetch('/api/v1/state-sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state),
    }).catch(() => undefined);
  } catch {
    // Ignore storage quota errors
  }
}

export async function syncRoomiaStateFromServer(): Promise<RoomiaDatabaseState> {
  const local = loadRoomiaState();
  try {
    const resp = await fetch(`/api/v1/state-sync?_t=${Date.now()}`, { cache: 'no-store' });
    if (resp.ok) {
      const json = (await resp.json()) as {
        state?: RoomiaDatabaseState | null;
        liveState?: {
          users?: PublicUserDto[];
          listings?: ListingItem[];
          bookings?: BookingSummary[];
          lockedDates?: Record<string, number>;
          reviews?: ReviewItem[];
          completedStays?: string[];
          auditLogs?: AuditLogEntry[];
        };
      };

      const live = json.liveState;
      if (live) {
        // Merge users created in Public Portal (:5174)
        if (Array.isArray(live.users)) {
          for (const ru of live.users) {
            if (!ru || !ru.email) continue;
            const exists = local.users.some(
              (u) => u.email.trim().toLowerCase() === ru.email.trim().toLowerCase()
            );
            if (!exists) {
              local.users.unshift({
                ...ru,
                avatarUrl:
                  ru.avatarUrl ||
                  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
              });
            }
          }
        }

        // Merge bookings created/updated in Public Portal (:5174)
        if (Array.isArray(live.bookings)) {
          for (const rb of live.bookings) {
            if (!rb) continue;
            const existingBooking = local.bookings.find(
              (b) => b.uuid === rb.uuid || (b.checkIn === rb.checkIn && b.guestId === rb.guestId && b.listingId === rb.listingId)
            );
            if (existingBooking) {
              existingBooking.status = rb.status;
              existingBooking.paymentIntentId = rb.paymentIntentId || existingBooking.paymentIntentId;
            } else {
              const matchedListing = local.listings.find((l) => l.id === rb.listingId);
              const matchedUser = local.users.find((u) => u.id === rb.guestId);
              local.bookings.unshift({
                ...rb,
                listingTitle: rb.listingTitle || matchedListing?.title || `Residencia #${rb.listingId}`,
                listingPhoto:
                  rb.listingPhoto ||
                  matchedListing?.photoUrl ||
                  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=600&q=80',
                listingCity: rb.listingCity || matchedListing?.city || 'Estado de México',
                guestName: rb.guestName || matchedUser?.name || `Huésped #${rb.guestId}`,
              });
            }
          }
        }

        // Merge reviews created in Public Portal (:5174)
        if (Array.isArray(live.reviews)) {
          for (const rr of live.reviews) {
            if (!rr) continue;
            const exists = local.reviews.some(
              (r) => r.uuid === rr.uuid || (r.comment === rr.comment && r.guestId === rr.guestId)
            );
            if (!exists) {
              const matchedUser = local.users.find((u) => u.id === rr.guestId);
              local.reviews.unshift({
                ...rr,
                guestName: rr.guestName || matchedUser?.name || 'Huésped Verificado',
              });
            }
          }
        }

        // Merge audit logs from backend
        if (Array.isArray(live.auditLogs) && live.auditLogs.length > local.auditLogs.length) {
          local.auditLogs = live.auditLogs;
        }
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(local));
      void fetch('/api/v1/state-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(local),
      }).catch(() => undefined);
    }
  } catch {
    // Offline fallback
  }
  return local;
}

export function resetRoomiaStateToSeed(): RoomiaDatabaseState {
  const fresh = buildSeedState();
  saveRoomiaState(fresh);
  return fresh;
}

export function appendAuditLog(
  state: RoomiaDatabaseState,
  userId: number | null,
  eventType: string,
  entityType: string,
  entityId: string
): AuditLogEntry {
  const prevHash =
    state.auditLogs.length > 0
      ? state.auditLogs[state.auditLogs.length - 1].currentHash
      : '0'.repeat(64);
  const createdAtUtc = new Date().toISOString();
  const ipAnonymized = '189.203.44.XXX';
  const currentHash = deterministicHexHash(
    `${prevHash}|${eventType}|${entityType}|${entityId}|${ipAnonymized}|${createdAtUtc}`
  );

  const entry: AuditLogEntry = {
    id: state.auditLogs.length + 1,
    uuid: generateUuid(),
    userId,
    eventType,
    entityType,
    entityId,
    ipAnonymized,
    previousHash: prevHash,
    currentHash,
    createdAtUtc,
  };
  state.auditLogs.push(entry);
  return entry;
}

export function enumerateDateRange(checkIn: string, checkOut: string): string[] {
  const dates: string[] = [];
  const start = new Date(`${checkIn}T00:00:00Z`);
  const end = new Date(`${checkOut}T00:00:00Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    return dates;
  }
  const cursor = new Date(start);
  while (cursor < end) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

export function computeRowHash(input: string): string {
  return deterministicHexHash(input);
}

export function createUuid(): string {
  return generateUuid();
}
