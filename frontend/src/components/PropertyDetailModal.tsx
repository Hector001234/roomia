import React, { useEffect, useRef, useState } from 'react';
import {
  BookingSummary,
  ListingItem,
  PublicUserDto,
  ReviewItem,
} from '../types/BookingState';
import { roomiaApi } from '../utils/apiClient';
import { enumerateDateRange } from '../utils/roomiaStore';
import { BookingVoucherModal } from './public/BookingVoucherModal';
import { PaymentGatewayModal } from './public/PaymentGatewayModal';
import { SharePropertyModal } from './public/SharePropertyModal';

interface PropertyDetailModalProps {
  listing: ListingItem | null;
  currentUser: PublicUserDto | null;
  reviews: ReviewItem[];
  onClose: () => void;
  onBookingSuccess: (booking: BookingSummary) => void;
  onReviewAdded: () => void;
}

export const PropertyDetailModal: React.FC<PropertyDetailModalProps> = ({
  listing,
  currentUser,
  reviews,
  onClose,
  onBookingSuccess,
  onReviewAdded,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [checkIn, setCheckIn] = useState('2026-11-20');
  const [checkOut, setCheckOut] = useState('2026-11-23');
  const [guestsCount, setGuestsCount] = useState(2);
  const [isGatewayOpen, setIsGatewayOpen] = useState(false);
  const [isVoucherOpen, setIsVoucherOpen] = useState(false);
  const [createdBooking, setCreatedBooking] = useState<BookingSummary | null>(null);
  const [bookingFeedback, setBookingFeedback] = useState<{
    error: boolean;
    message: string;
  } | null>(null);
  const [processing, setProcessing] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [copiedSplit, setCopiedSplit] = useState(false);
  const [selectedAddons, setSelectedAddons] = useState<{
    chef: boolean;
    cava: boolean;
    transfer: boolean;
    guide: boolean;
  }>({
    chef: false,
    cava: false,
    transfer: false,
    guide: false,
  });

  // Review state inside property detail
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewFeedback, setReviewFeedback] = useState<{
    error: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    if (!listing) return;
    setCreatedBooking(null);
    setBookingFeedback(null);
    setReviewFeedback(null);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [listing, onClose]);

  if (!listing) return null;

  const nights = Math.max(1, enumerateDateRange(checkIn, checkOut).length);
  const rate = Number(listing.pricePerNight);
  const baseSubtotal = rate * nights;

  const addonsTotal =
    (selectedAddons.chef ? 1800 : 0) +
    (selectedAddons.cava ? 950 : 0) +
    (selectedAddons.transfer ? 1400 : 0) +
    (selectedAddons.guide ? 650 : 0);

  const subtotal = baseSubtotal + addonsTotal;
  const serviceFee = Math.round(subtotal * 0.12 * 100) / 100;
  const taxAmount = Math.round(subtotal * 0.16 * 100) / 100;
  const totalAmount = subtotal + serviceFee + taxAmount;
  const perGuestShare = Math.round((totalAmount / (guestsCount || 1)) * 100) / 100;

  const listingReviews = reviews.filter((r) => r.listingId === listing.id);
  const gallery =
    listing.galleryUrls && listing.galleryUrls.length > 0
      ? listing.galleryUrls
      : [listing.photoUrl];

  const handleShareClick = () => {
    setIsShareOpen(true);
  };

  const handleLockAndBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setBookingFeedback({
        error: true,
        message: 'Debes iniciar sesión con tu cuenta de huésped para confirmar el bloqueo transaccional.',
      });
      return;
    }
    setProcessing(true);
    setBookingFeedback(null);

    const res = await roomiaApi.createBooking({
      listingId: listing.id,
      guestId: currentUser.id,
      guestName: currentUser.name,
      checkIn,
      checkOut,
      guestsCount,
    });

    setProcessing(false);
    if (!res.ok || !res.data) {
      setBookingFeedback({
        error: true,
        message: res.error || 'No se pudo reservar el periodo seleccionado.',
      });
      return;
    }

    setCreatedBooking(res.data.booking);
    onBookingSuccess(res.data.booking);
    setBookingFeedback({
      error: false,
      message: `Bloqueo transaccional exitoso (Reserva #${res.data.booking.id}). Confirma tu pago a continuación.`,
    });
  };

  const handleCompleteStayNow = async () => {
    if (!createdBooking) return;
    const res = await roomiaApi.completeBookingStay(createdBooking.id);
    if (res.ok && res.data?.booking) {
      setCreatedBooking(res.data.booking);
      onBookingSuccess(res.data.booking);
      setBookingFeedback({
        error: false,
        message: 'Estancia finalizada. Ya puedes publicar tu reseña verificada.',
      });
    }
  };

  const handlePostReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setReviewFeedback({
        error: true,
        message: 'Inicia sesión para publicar tu evaluación verificada.',
      });
      return;
    }
    const res = await roomiaApi.submitReview({
      guestId: currentUser.id,
      guestName: currentUser.name,
      listingId: listing.id,
      rating: reviewRating,
      comment: reviewComment,
    });

    if (!res.ok) {
      setReviewFeedback({
        error: true,
        message: res.error || 'Se requiere una estancia completada para calificar.',
      });
      return;
    }

    setReviewComment('');
    onReviewAdded();
    setReviewFeedback({
      error: false,
      message: 'Reseña verificada registrada con éxito.',
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="detail-modal-title"
      className="fixed inset-0 z-50 bg-zinc-950/60 backdrop-blur-sm overflow-y-auto p-4 md:p-8"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className="max-w-5xl mx-auto bg-white rounded-3xl shadow-xl border border-zinc-200/80 overflow-hidden my-4"
      >
        {/* Top Header Bar */}
        <div className="px-8 py-5 border-b border-zinc-200/70 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono tracking-widest uppercase text-zinc-400">
                {listing.category} · {listing.city}, {listing.stateName || 'México'}
              </span>
              <span className="text-zinc-300">·</span>
              <span className="text-xs font-medium text-zinc-700">
                ★ {listing.ratingAvg?.toFixed(2) || '4.95'} ({listing.reviewsCount || listingReviews.length} reseñas)
              </span>
            </div>
            <h2 id="detail-modal-title" className="text-xl md:text-2xl font-semibold tracking-tight text-zinc-950 mt-1">
              {listing.title}
            </h2>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleShareClick}
              className="px-4 py-1.5 rounded-full border border-zinc-200 hover:border-zinc-950 text-zinc-800 text-xs font-medium transition duration-150 flex items-center gap-1.5"
            >
              <span>Compartir Ficha</span>
              <span className="text-[10px] text-zinc-400 font-mono">↗</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar detalle de alojamiento"
              className="w-8 h-8 rounded-full border border-zinc-200 hover:bg-zinc-100 text-zinc-600 text-sm font-light flex items-center justify-center transition"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-8 space-y-10">
          {/* Architectural 5-Photo Grid Gallery */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 rounded-2xl overflow-hidden h-72 md:h-96">
            <div className="md:col-span-2 md:row-span-2 h-full bg-zinc-100">
              <img
                src={gallery[0]}
                alt={listing.title}
                className="w-full h-full object-cover"
              />
            </div>
            {[1, 2, 3, 4].map((idx) => (
              <div key={idx} className="hidden md:block h-full bg-zinc-100 overflow-hidden">
                <img
                  src={gallery[idx % gallery.length]}
                  alt={`${listing.title} vista ${idx + 1}`}
                  className="w-full h-full object-cover hover:scale-102 transition duration-500 ease-out"
                />
              </div>
            ))}
          </div>

          {/* Main 2-Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
            {/* Left 2 Columns */}
            <div className="lg:col-span-2 space-y-8">
              {/* Host Intro & Specs */}
              <div className="flex items-center justify-between pb-6 border-b border-zinc-200/70">
                <div>
                  <h3 className="text-base font-semibold text-zinc-950">
                    Residencia privada · Anfitrión: {listing.hostName || 'Elena Rostova'}
                  </h3>
                  <p className="text-xs text-zinc-500 font-light mt-1">
                    {listing.maxGuests} huéspedes · {listing.bedrooms || 2} habitaciones · {listing.beds || 2} camas · {listing.bathrooms || 1} baños
                  </p>
                  <div className="flex items-center gap-2 mt-3">
                    <span className="px-3 py-0.5 rounded-full bg-zinc-100 text-zinc-800 text-[10px] font-medium tracking-wider uppercase border border-zinc-200/60">
                      Anfitrión Selecto
                    </span>
                    <span className="px-3 py-0.5 rounded-full bg-zinc-100 text-zinc-800 text-[10px] font-medium tracking-wider uppercase border border-zinc-200/60">
                      Identidad Verificada SAT
                    </span>
                  </div>
                </div>

                <div className="w-12 h-12 rounded-full bg-zinc-950 text-white font-mono text-sm flex items-center justify-center font-medium shrink-0">
                  {(listing.hostName || 'E')[0]}
                </div>
              </div>

              {/* Highlights */}
              <div className="space-y-4 py-1 border-b border-zinc-200/70 pb-6">
                <div className="flex items-start gap-3">
                  <span className="w-2 h-2 rounded-full bg-zinc-900 mt-1.5 shrink-0"></span>
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider">Hospitalidad de Excelencia</h4>
                    <p className="text-xs text-zinc-500 font-light mt-0.5">
                      Calificación promedio de 4.95 estrellas con 100% de atención personalizada.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-2 h-2 rounded-full bg-zinc-900 mt-1.5 shrink-0"></span>
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider">Acceso Autónomo Digital</h4>
                    <p className="text-xs text-zinc-500 font-light mt-0.5">
                      Ingreso inteligente con credenciales temporales generadas para la estancia.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-2 h-2 rounded-full bg-zinc-900 mt-1.5 shrink-0"></span>
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider">Política de Cancelación Flexible</h4>
                    <p className="text-xs text-zinc-500 font-light mt-0.5">
                      Reembolso íntegro con cancelación previa a 48 horas de la llegada.
                    </p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="pb-6 border-b border-zinc-200/70 space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-900">Acerca del Espacio</h4>
                <p className="text-xs text-zinc-600 font-light leading-relaxed whitespace-pre-line">{listing.description}</p>
              </div>

              {/* Amenities */}
              <div className="pb-6 border-b border-zinc-200/70 space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-900">Amenidades Incluidas</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(listing.amenities || ['Conexión de alta velocidad', 'Cocina equipada', 'Estacionamiento']).map((amenity) => (
                    <div
                      key={amenity}
                      className="flex items-center gap-2 text-xs font-normal text-zinc-700 bg-zinc-50 px-3 py-2 rounded-xl border border-zinc-100"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-400"></span>
                      <span>{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 6-Dimension Rating Breakdown */}
              <div className="pb-6 border-b border-zinc-200/70 space-y-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-semibold text-zinc-950 font-mono">★ {listing.ratingAvg?.toFixed(2) || '4.95'}</span>
                  <span className="text-xs text-zinc-500 font-light">
                    Evaluación multidimensional de calidad
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-zinc-50/70 p-5 rounded-2xl border border-zinc-200/60">
                  <div>
                    <div className="text-[11px] font-medium text-zinc-700">Limpieza</div>
                    <div className="text-xs font-mono font-medium text-zinc-950 mt-0.5">4.9 / 5.0</div>
                    <div className="w-full bg-zinc-200 rounded-full h-1 mt-1.5">
                      <div className="bg-zinc-950 h-1 rounded-full w-[98%]"></div>
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] font-medium text-zinc-700">Veracidad</div>
                    <div className="text-xs font-mono font-medium text-zinc-950 mt-0.5">5.0 / 5.0</div>
                    <div className="w-full bg-zinc-200 rounded-full h-1 mt-1.5">
                      <div className="bg-zinc-950 h-1 rounded-full w-[100%]"></div>
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] font-medium text-zinc-700">Llegada</div>
                    <div className="text-xs font-mono font-medium text-zinc-950 mt-0.5">5.0 / 5.0</div>
                    <div className="w-full bg-zinc-200 rounded-full h-1 mt-1.5">
                      <div className="bg-zinc-950 h-1 rounded-full w-[100%]"></div>
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] font-medium text-zinc-700">Comunicación</div>
                    <div className="text-xs font-mono font-medium text-zinc-950 mt-0.5">4.9 / 5.0</div>
                    <div className="w-full bg-zinc-200 rounded-full h-1 mt-1.5">
                      <div className="bg-zinc-950 h-1 rounded-full w-[98%]"></div>
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] font-medium text-zinc-700">Ubicación</div>
                    <div className="text-xs font-mono font-medium text-zinc-950 mt-0.5">4.8 / 5.0</div>
                    <div className="w-full bg-zinc-200 rounded-full h-1 mt-1.5">
                      <div className="bg-zinc-950 h-1 rounded-full w-[96%]"></div>
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] font-medium text-zinc-700">Calidad-Precio</div>
                    <div className="text-xs font-mono font-medium text-zinc-950 mt-0.5">4.9 / 5.0</div>
                    <div className="w-full bg-zinc-200 rounded-full h-1 mt-1.5">
                      <div className="bg-zinc-950 h-1 rounded-full w-[98%]"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reviews List */}
              <div className="space-y-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-900">
                  Reseñas de Huéspedes ({listingReviews.length})
                </h4>

                {listingReviews.length === 0 ? (
                  <p className="text-xs text-zinc-400 font-light italic">
                    Sin evaluaciones registradas para esta residencia aún.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {listingReviews.map((rev) => (
                      <div
                        key={rev.uuid}
                        className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/70 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-zinc-900">
                            {rev.guestName || `Huésped #${rev.guestId}`}
                          </span>
                          <span className="text-[11px] font-mono text-zinc-600">
                            ★ {rev.rating}.0
                          </span>
                        </div>
                        <p className="text-xs text-zinc-600 font-light leading-relaxed">{rev.comment}</p>
                        <div className="text-[10px] text-zinc-400 font-mono">
                          {rev.createdAt.slice(0, 10)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Leave Review Form */}
                <form
                  onSubmit={handlePostReview}
                  className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/70 space-y-3 mt-4"
                >
                  <div className="text-xs font-medium text-zinc-900">
                    Publicar reseña (requiere estancia completada)
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <label htmlFor="detail-review-rating" className="text-xs text-zinc-600">
                      Calificación:
                    </label>
                    <select
                      id="detail-review-rating"
                      value={reviewRating}
                      onChange={(e) => setReviewRating(Number(e.target.value))}
                      className="rounded-xl border border-zinc-200 bg-white px-3 py-1 text-xs font-mono"
                    >
                      <option value={5}>5 Estrellas (Excelente)</option>
                      <option value={4}>4 Estrellas (Muy bueno)</option>
                      <option value={3}>3 Estrellas (Regular)</option>
                      <option value={2}>2 Estrellas (Deficiente)</option>
                      <option value={1}>1 Estrella (Malo)</option>
                    </select>
                  </div>
                  <textarea
                    rows={2}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Comparte tu experiencia en esta residencia..."
                    required
                    className="w-full rounded-xl border border-zinc-200 p-3 text-xs text-zinc-900 bg-white focus:outline-none"
                  />
                  {reviewFeedback && (
                    <div
                      className={`p-2.5 rounded-xl text-xs font-medium ${
                        reviewFeedback.error
                          ? 'bg-rose-50 text-rose-800 border border-rose-200'
                          : 'bg-zinc-100 text-zinc-900 border border-zinc-300'
                      }`}
                    >
                      {reviewFeedback.message}
                    </div>
                  )}
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-full bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-medium tracking-wide transition"
                  >
                    Publicar Reseña
                  </button>
                </form>
              </div>

              {/* Georeferenced Location & Direct Navigation Card */}
              <div className="pt-6 border-t border-zinc-200/70 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-900">
                      Ubicación Georreferenciada & Navegación
                    </h4>
                    <p className="text-xs text-zinc-500 font-light mt-0.5">
                      {listing.city}, {listing.stateName} · {Number(listing.latitude).toFixed(4)}, {Number(listing.longitude).toFixed(4)}
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-700 text-[10px] font-mono border border-zinc-200">
                    GPS Preciso
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${listing.latitude},${listing.longitude}&query_place_id=${encodeURIComponent(listing.title)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3.5 rounded-2xl border border-zinc-200 hover:border-zinc-950 bg-white hover:bg-zinc-50 transition flex items-center justify-between group shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                        G
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-zinc-900 group-hover:text-zinc-950">
                          Abrir en Google Maps
                        </div>
                        <div className="text-[10px] text-zinc-400">
                          Vista satelital y trayecto
                        </div>
                      </div>
                    </div>
                    <span className="text-zinc-400 group-hover:translate-x-0.5 transition-transform text-xs">↗</span>
                  </a>

                  <a
                    href={`https://waze.com/ul?ll=${listing.latitude},${listing.longitude}&navigate=yes`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3.5 rounded-2xl border border-zinc-200 hover:border-cyan-600 bg-white hover:bg-cyan-50/30 transition flex items-center justify-between group shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold text-xs">
                        W
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-zinc-900 group-hover:text-cyan-800">
                          Navegar con Waze
                        </div>
                        <div className="text-[10px] text-zinc-400">
                          Tráfico y alertas en vivo
                        </div>
                      </div>
                    </div>
                    <span className="text-zinc-400 group-hover:translate-x-0.5 transition-transform text-xs">↗</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Right Column: Sticky Reservation Box */}
            <div className="bg-white rounded-3xl shadow-sm border border-zinc-200/80 p-6 space-y-4 sticky top-24">
              <div className="flex items-baseline justify-between border-b border-zinc-100 pb-3">
                <div>
                  <span className="text-2xl font-semibold text-zinc-950 font-mono">
                    ${rate.toLocaleString('es-MX', { minimumFractionDigits: 0 })}
                  </span>
                  <span className="text-xs text-zinc-400 font-light"> MXN / noche</span>
                </div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-600 bg-zinc-100 px-2.5 py-0.5 rounded-full border border-zinc-200">
                  Disponible
                </span>
              </div>

              <form onSubmit={handleLockAndBook} className="space-y-3">
                <div className="grid grid-cols-2 border border-zinc-200 rounded-2xl overflow-hidden">
                  <div className="p-3 border-r border-zinc-200">
                    <label
                      htmlFor="detail-checkin"
                      className="block text-[9px] font-medium uppercase tracking-[0.16em] text-zinc-400"
                    >
                      Llegada
                    </label>
                    <input
                      id="detail-checkin"
                      type="date"
                      value={checkIn}
                      onChange={(e) => setCheckIn(e.target.value)}
                      className="w-full text-xs font-medium text-zinc-900 focus:outline-none bg-transparent mt-0.5"
                    />
                  </div>
                  <div className="p-3">
                    <label
                      htmlFor="detail-checkout"
                      className="block text-[9px] font-medium uppercase tracking-[0.16em] text-zinc-400"
                    >
                      Salida
                    </label>
                    <input
                      id="detail-checkout"
                      type="date"
                      value={checkOut}
                      onChange={(e) => setCheckOut(e.target.value)}
                      className="w-full text-xs font-medium text-zinc-900 focus:outline-none bg-transparent mt-0.5"
                    />
                  </div>
                </div>

                <div className="border border-zinc-200 rounded-2xl p-3">
                  <label
                    htmlFor="detail-guests"
                    className="block text-[9px] font-medium uppercase tracking-[0.16em] text-zinc-400"
                  >
                    Huéspedes (Máx. {listing.maxGuests})
                  </label>
                  <input
                    id="detail-guests"
                    type="number"
                    min={1}
                    max={listing.maxGuests}
                    value={guestsCount}
                    onChange={(e) => setGuestsCount(Number(e.target.value))}
                    className="w-full text-xs font-medium text-zinc-900 focus:outline-none mt-1 bg-transparent"
                  />
                </div>

                {/* Experiencias de Concierge & Add-ons Exclusivos */}
                <div className="border border-zinc-200/90 rounded-2xl p-3.5 space-y-2.5 bg-zinc-50/40">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                      Servicios de Concierge Opcionales
                    </span>
                    <span className="text-[9px] font-mono text-zinc-400">Personalizados</span>
                  </div>

                  <label className="flex items-center justify-between p-2 rounded-xl bg-white border border-zinc-200/80 hover:border-zinc-300 cursor-pointer text-xs transition">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedAddons.chef}
                        onChange={(e) =>
                          setSelectedAddons({ ...selectedAddons, chef: e.target.checked })
                        }
                        className="rounded text-zinc-950 focus:ring-zinc-950"
                      />
                      <span className="text-zinc-800">Chef Privado en Residencia (4 tiempos)</span>
                    </div>
                    <span className="font-mono text-zinc-900 font-medium">+$1,800</span>
                  </label>

                  <label className="flex items-center justify-between p-2 rounded-xl bg-white border border-zinc-200/80 hover:border-zinc-300 cursor-pointer text-xs transition">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedAddons.cava}
                        onChange={(e) =>
                          setSelectedAddons({ ...selectedAddons, cava: e.target.checked })
                        }
                        className="rounded text-zinc-950 focus:ring-zinc-950"
                      />
                      <span className="text-zinc-800">Cata de Vinos & Mezcal Mexiquense</span>
                    </div>
                    <span className="font-mono text-zinc-900 font-medium">+$950</span>
                  </label>

                  <label className="flex items-center justify-between p-2 rounded-xl bg-white border border-zinc-200/80 hover:border-zinc-300 cursor-pointer text-xs transition">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedAddons.transfer}
                        onChange={(e) =>
                          setSelectedAddons({ ...selectedAddons, transfer: e.target.checked })
                        }
                        className="rounded text-zinc-950 focus:ring-zinc-950"
                      />
                      <span className="text-zinc-800">Traslado Ejecutivo (AIT Toluca / Santa Fe)</span>
                    </div>
                    <span className="font-mono text-zinc-900 font-medium">+$1,400</span>
                  </label>
                </div>

                {/* Financial Breakdown */}
                <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100 space-y-2 text-xs">
                  <div className="flex justify-between text-zinc-500 font-light">
                    <span>${rate.toFixed(0)} MXN × {nights} noche(s)</span>
                    <span className="font-mono text-zinc-900">${baseSubtotal.toFixed(2)} MXN</span>
                  </div>
                  {addonsTotal > 0 && (
                    <div className="flex justify-between text-emerald-700 font-medium">
                      <span>Servicios de concierge agregados</span>
                      <span className="font-mono">+${addonsTotal.toFixed(2)} MXN</span>
                    </div>
                  )}
                  <div className="flex justify-between text-zinc-500 font-light">
                    <span>Comisión de plataforma (12%)</span>
                    <span className="font-mono text-zinc-900">${serviceFee.toFixed(2)} MXN</span>
                  </div>
                  <div className="flex justify-between text-zinc-500 font-light">
                    <span>Impuestos IVA (16%)</span>
                    <span className="font-mono text-zinc-900">${taxAmount.toFixed(2)} MXN</span>
                  </div>
                  <div className="pt-2 border-t border-zinc-200 flex justify-between text-sm font-semibold text-zinc-950">
                    <span>Total liquidable</span>
                    <span className="font-mono text-zinc-950">${totalAmount.toFixed(2)} MXN</span>
                  </div>

                  {/* Split Bill Calculator */}
                  <div className="mt-2 pt-2 border-t border-zinc-200/60 flex items-center justify-between text-[11px] text-zinc-600 bg-zinc-100/60 px-2.5 py-1.5 rounded-xl">
                    <span>Dividir entre {guestsCount} huésped(es):</span>
                    <div className="flex items-center gap-1.5 font-mono font-bold text-zinc-950">
                      <span>${perGuestShare.toFixed(2)} MXN c/u</span>
                      <button
                        type="button"
                        onClick={() => {
                          const text = `Oigan, nos toca de $${perGuestShare.toFixed(2)} MXN cada uno para la reserva de Roomia: ${listing.title}.`;
                          void navigator.clipboard?.writeText(text);
                          setCopiedSplit(true);
                          setTimeout(() => setCopiedSplit(false), 2000);
                        }}
                        className="text-[10px] text-zinc-500 hover:text-zinc-950 transition ml-1"
                        title="Copiar mensaje de división para WhatsApp"
                      >
                        {copiedSplit ? '✓' : 'Copiar'}
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={processing}
                  className="w-full py-3.5 rounded-full bg-zinc-950 hover:bg-zinc-800 text-white font-medium text-xs tracking-wider uppercase transition shadow-xs"
                >
                  {processing ? 'Confirmando periodo...' : '1. Bloquear Fechas'}
                </button>
              </form>

              {/* Stripe Checkout Gateway Gateway Button */}
              {createdBooking && (
                <div className="pt-4 border-t border-zinc-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-zinc-800">
                      2. Pago Seguro Tokenizado
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-800 border border-zinc-200">
                      {createdBooking.status === 'PENDING' ? 'Pendiente' : createdBooking.status}
                    </span>
                  </div>

                  {createdBooking.status === 'PENDING' && (
                    <button
                      type="button"
                      onClick={() => setIsGatewayOpen(true)}
                      className="w-full py-3.5 rounded-full bg-zinc-950 hover:bg-zinc-800 text-white font-medium text-xs tracking-wider uppercase transition shadow-xs flex items-center justify-center gap-2"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      <span>Abrir Pasarela de Pago (${createdBooking.totalAmount} MXN)</span>
                    </button>
                  )}

                  {createdBooking.status === 'CONFIRMED' && (
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => setIsVoucherOpen(true)}
                        className="w-full py-3 rounded-full border border-zinc-300 hover:border-zinc-950 text-zinc-900 font-medium text-xs tracking-wide transition"
                      >
                        Ver Pase de Acceso & QR
                      </button>
                      <button
                        type="button"
                        onClick={handleCompleteStayNow}
                        className="w-full py-2.5 rounded-full bg-zinc-950 hover:bg-zinc-800 text-white font-medium text-xs tracking-wide transition"
                      >
                        Finalizar Estancia
                      </button>
                    </div>
                  )}
                </div>
              )}

              {bookingFeedback && (
                <div
                  role="alert"
                  className={`p-3 rounded-2xl text-xs font-normal border ${
                    bookingFeedback.error
                      ? 'bg-rose-50 text-rose-900 border-rose-200'
                      : 'bg-zinc-50 text-zinc-900 border-zinc-300'
                  }`}
                >
                  {bookingFeedback.message}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Payment Gateway Modal */}
      <PaymentGatewayModal
        isOpen={isGatewayOpen}
        booking={createdBooking}
        onClose={() => setIsGatewayOpen(false)}
        onPaymentSuccess={(updated) => {
          setCreatedBooking(updated);
          setIsGatewayOpen(false);
          onBookingSuccess(updated);
          setBookingFeedback({
            error: false,
            message: 'Pago acreditado y confirmado exitosamente con la pasarela bancaria.',
          });
        }}
      />

      {/* Digital Access Voucher Modal */}
      <BookingVoucherModal
        isOpen={isVoucherOpen}
        booking={createdBooking}
        onClose={() => setIsVoucherOpen(false)}
      />

      {/* Share Property Modal */}
      <SharePropertyModal
        isOpen={isShareOpen}
        listing={listing}
        onClose={() => setIsShareOpen(false)}
      />
    </div>
  );
};
