import React, { useEffect, useState } from 'react';
import { PropertyCard } from '../../components/PropertyCard';
import { PropertyDetailModal } from '../../components/PropertyDetailModal';
import { useAuth } from '../../context/AuthContext';
import { BookingSummary, ListingItem, ReviewItem } from '../../types/BookingState';
import { roomiaApi } from '../../utils/apiClient';

export const WishlistsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [allListings, setAllListings] = useState<ListingItem[]>([]);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedListing, setSelectedListing] = useState<ListingItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('roomia_favorites');
      if (stored) {
        setFavoriteIds(JSON.parse(stored) as number[]);
      }
    } catch {
      setFavoriteIds([]);
    }

    void (async () => {
      setLoading(true);
      const res = await roomiaApi.fetchCatalog(100, 0);
      setLoading(false);
      if (res.ok && res.data) {
        setAllListings(res.data.data);
        setReviews(res.data.reviews);
      }
    })();
  }, []);

  const favoriteListings = allListings.filter((l) => favoriteIds.includes(l.id));

  const handleRemoveFavorite = (id: number) => {
    const updated = favoriteIds.filter((favId) => favId !== id);
    setFavoriteIds(updated);
    localStorage.setItem('roomia_favorites', JSON.stringify(updated));
    setToastMessage('Residencia retirada de tu colección.');
  };

  return (
    <div className="space-y-8">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          role="status"
          className="bg-zinc-950 text-white px-5 py-3 rounded-full shadow-lg border border-zinc-800 flex items-center justify-between text-xs font-medium tracking-wide fixed bottom-8 right-8 z-50 animate-in fade-in slide-in-from-bottom-2"
        >
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            {toastMessage}
          </span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-zinc-400 hover:text-white ml-5 text-sm"
          >
            ×
          </button>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-zinc-200/70 pb-5">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-950">
          Colección Privada
        </h1>
        <p className="text-xs text-zinc-500 font-light mt-1">
          Espacios y santuarios guardados localmente para tus próximas estancias.
        </p>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-7">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-3xl h-84 animate-pulse border border-zinc-100 p-4 space-y-4">
              <div className="h-48 bg-zinc-100 rounded-2xl"></div>
              <div className="h-4 bg-zinc-100 rounded w-2/3"></div>
              <div className="h-3 bg-zinc-100 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : favoriteListings.length === 0 ? (
        <div className="bg-white p-16 rounded-3xl border border-zinc-200/80 text-center space-y-4 shadow-xs max-w-lg mx-auto my-8">
          <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 mx-auto font-light text-xl">
            —
          </div>
          <h2 className="text-base font-semibold text-zinc-900 tracking-tight">
            Tu colección está vacía
          </h2>
          <p className="text-xs text-zinc-500 font-light leading-relaxed max-w-sm mx-auto">
            Explora el catálogo y selecciona el marcador en cualquier residencia para guardarla en este apartado.
          </p>
          <a
            href="/"
            className="inline-block px-5 py-2.5 rounded-full bg-zinc-950 hover:bg-zinc-800 text-white font-medium text-xs tracking-wider uppercase shadow-xs transition"
          >
            Explorar Residencias
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-xs font-mono text-zinc-500">
            {favoriteListings.length} {favoriteListings.length === 1 ? 'espacio guardado' : 'espacios guardados'}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-7">
            {favoriteListings.map((listing) => (
              <div key={listing.id} className="relative group">
                <PropertyCard
                  listing={listing}
                  onSelect={(item) => setSelectedListing(item)}
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFavorite(listing.id);
                  }}
                  title="Eliminar de colección"
                  className="absolute top-3 right-3 z-10 w-7 h-7 rounded-full bg-zinc-950/80 hover:bg-zinc-950 text-white flex items-center justify-center text-xs font-light shadow-xs transition"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Property Detail Modal */}
      {currentUser && (
        <PropertyDetailModal
          listing={selectedListing}
          currentUser={currentUser}
          reviews={reviews}
          onClose={() => setSelectedListing(null)}
          onBookingSuccess={(booking: BookingSummary) => {
            setToastMessage(`Reserva #${booking.id} creada para ${booking.listingTitle}`);
          }}
          onReviewAdded={() => {
            setToastMessage('Reseña registrada con éxito');
          }}
        />
      )}
    </div>
  );
};
