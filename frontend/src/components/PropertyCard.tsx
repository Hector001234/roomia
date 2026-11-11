import React, { useEffect, useState } from 'react';
import { ListingItem } from '../types/BookingState';

interface PropertyCardProps {
  listing: ListingItem;
  showTaxes?: boolean;
  onSelect: (listing: ListingItem) => void;
  onEdit?: (listing: ListingItem) => void;
  onSoftDelete?: (listingId: number) => void;
}

const DESTINATION_CLIMATE: Record<string, string> = {
  Toluca: '16°C Montaña',
  'Valle de Bravo': '23°C Lago',
  Metepec: '18°C Fresco',
  Malinalco: '26°C Cálido',
  CDMX: '21°C Templado',
};

export const PropertyCard: React.FC<PropertyCardProps> = ({
  listing,
  showTaxes = false,
  onSelect,
  onEdit,
  onSoftDelete,
}) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('roomia_favorites');
      if (stored) {
        const ids: number[] = JSON.parse(stored);
        setIsFavorite(ids.includes(listing.id));
      }
    } catch {
      setIsFavorite(false);
    }
  }, [listing.id]);

  const toggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const stored = localStorage.getItem('roomia_favorites');
      let ids: number[] = stored ? JSON.parse(stored) : [];
      if (ids.includes(listing.id)) {
        ids = ids.filter((id) => id !== listing.id);
        setIsFavorite(false);
      } else {
        ids.push(listing.id);
        setIsFavorite(true);
      }
      localStorage.setItem('roomia_favorites', JSON.stringify(ids));
    } catch {
      setIsFavorite(!isFavorite);
    }
  };

  const photos =
    listing.galleryUrls && listing.galleryUrls.length > 0
      ? listing.galleryUrls
      : [listing.photoUrl];
  const currentPhoto = photos[photoIndex % photos.length] || listing.photoUrl;
  const basePhoto = currentPhoto.split('?')[0];
  const responsiveSrcSet = `${basePhoto}?auto=format&fit=crop&w=400&q=75 400w, ${basePhoto}?auto=format&fit=crop&w=800&q=80 800w, ${basePhoto}?auto=format&fit=crop&w=1200&q=85 1200w`;

  const basePrice = Number(listing.pricePerNight);
  const displayPrice = showTaxes ? Math.round(basePrice * 1.28) : basePrice;
  const isSuperhost = (listing.ratingAvg || 4.95) >= 4.9;

  return (
    <article
      className="group bg-white rounded-3xl overflow-hidden border border-zinc-200/70 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between cursor-pointer"
      aria-label={listing.title}
      onClick={() => onSelect(listing)}
    >
      <div>
        {/* Image Carousel Container */}
        <div className="relative aspect-[4/3] w-full bg-zinc-100 overflow-hidden">
          <img
            src={currentPhoto}
            srcSet={responsiveSrcSet}
            sizes="(max-width: 768px) 100vw, 33vw"
            alt={listing.photoAlt || `${listing.title} en ${listing.city}`}
            loading="lazy"
            decoding="async"
            width={800}
            height={600}
            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-700 ease-out"
            onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
              e.currentTarget.src =
                'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80';
            }}
          />

          {/* Top Left Badges: Minimalist Architectural Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
            {isSuperhost && (
              <span className="bg-white/90 backdrop-blur-md text-zinc-950 text-[9px] font-medium tracking-[0.14em] uppercase px-2.5 py-0.5 rounded-full border border-zinc-200/80 shadow-xs">
                Colección Selecta
              </span>
            )}
            <span className="bg-zinc-950/75 backdrop-blur-md text-white text-[9px] font-normal tracking-wider uppercase px-2 py-0.5 rounded-full">
              {listing.category}
            </span>
          </div>

          {/* Top Right Favorite Indicator */}
          <button
            type="button"
            aria-label={isFavorite ? 'Retirar de colección' : 'Guardar en colección'}
            onClick={toggleFavorite}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-zinc-950/40 hover:bg-zinc-950/70 backdrop-blur-md flex items-center justify-center text-white transition-all duration-200"
          >
            <span className={isFavorite ? 'text-zinc-100 font-bold text-sm' : 'text-white/80 font-normal text-sm'}>
              {isFavorite ? '★' : '☆'}
            </span>
          </button>

          {/* Carousel Controls on Hover */}
          {photos.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Foto anterior"
                onClick={(e) => {
                  e.stopPropagation();
                  setPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
                }}
                className="opacity-0 group-hover:opacity-100 absolute left-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/90 text-zinc-800 shadow-xs flex items-center justify-center text-xs font-light transition hover:bg-white"
              >
                ‹
              </button>
              <button
                type="button"
                aria-label="Foto siguiente"
                onClick={(e) => {
                  e.stopPropagation();
                  setPhotoIndex((prev) => (prev + 1) % photos.length);
                }}
                className="opacity-0 group-hover:opacity-100 absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/90 text-zinc-800 shadow-xs flex items-center justify-center text-xs font-light transition hover:bg-white"
              >
                ›
              </button>
            </>
          )}

          {/* Bottom Dots */}
          <div className="absolute bottom-2.5 inset-x-0 flex justify-center gap-1">
            {photos.slice(0, 5).map((_, idx) => (
              <span
                key={idx}
                className={`h-1 rounded-full transition-all duration-200 ${
                  idx === photoIndex % photos.length ? 'w-3.5 bg-white' : 'w-1 bg-white/50'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Card Content */}
        <div className="p-4 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 truncate">
              <h3 className="font-semibold text-zinc-900 text-xs tracking-wider uppercase truncate">
                {listing.city}
              </h3>
              <span className="text-[10px] text-zinc-400 font-mono tracking-normal shrink-0">
                · {DESTINATION_CLIMATE[listing.city] || '20°C'}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-medium text-zinc-800 shrink-0">
              <span className="text-zinc-400">★</span>
              <span>{listing.ratingAvg?.toFixed(2) || '4.95'}</span>
              <span className="text-zinc-400 text-[10px] font-light">({listing.reviewsCount || 12})</span>
            </div>
          </div>

          <p className="text-xs text-zinc-600 font-light line-clamp-1">{listing.title}</p>

          <p className="text-[11px] text-zinc-400 font-light">
            Hasta {listing.maxGuests} huéspedes · {listing.bedrooms || 2} rec. · {listing.bathrooms || 1} baños
          </p>

          <div className="flex flex-wrap gap-1 pt-1">
            {(listing.amenities || []).slice(0, 3).map((amenity) => (
              <span
                key={amenity}
                className="text-[9px] bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full font-normal tracking-wide"
              >
                {amenity}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Price & Action Footer */}
      <div className="px-4 pb-4 pt-2.5 border-t border-zinc-100 flex items-center justify-between gap-2">
        <div>
          <span className="text-sm font-semibold text-zinc-950 font-mono">
            ${displayPrice.toLocaleString('es-MX', { minimumFractionDigits: 0 })}
          </span>
          <span className="text-[11px] text-zinc-400 font-light">
            {showTaxes ? ' total MXN' : ' / noche'}
          </span>
        </div>

        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(listing)}
              aria-label={`Editar ${listing.title}`}
              className="px-2.5 py-1 rounded-full border border-zinc-200 hover:border-zinc-400 text-zinc-700 text-[11px] font-normal transition"
            >
              Editar
            </button>
          )}
          {onSoftDelete && (
            <button
              type="button"
              onClick={() => onSoftDelete(listing.id)}
              aria-label={`Dar de baja ${listing.title}`}
              className="px-2.5 py-1 rounded-full border border-zinc-200 hover:border-zinc-400 text-zinc-700 text-[11px] font-normal transition"
            >
              Baja
            </button>
          )}
          <button
            type="button"
            onClick={() => onSelect(listing)}
            aria-label={`Ver detalles y reservar ${listing.title}`}
            className="px-4 py-1.5 rounded-full bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-medium tracking-wide transition duration-150 shadow-xs"
          >
            Reservar
          </button>
        </div>
      </div>
    </article>
  );
};
