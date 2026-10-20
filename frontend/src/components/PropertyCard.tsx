import React from 'react';
import { ListingItem } from '../types/BookingState';
import { formatCurrencyAmount } from '../utils/currencyUtils';

interface PropertyCardProps {
  listing: ListingItem;
  onSelect: (listing: ListingItem) => void;
}

/**
 * Section 14.1 & Section 28.2 Compliance: Mandatory descriptive alt text on all S3 WebP images.
 */
export const PropertyCard: React.FC<PropertyCardProps> = ({ listing, onSelect }) => {
  return (
    <article className="border rounded-xl overflow-hidden shadow-sm bg-white">
      <img src={listing.photoUrl} alt={listing.photoAlt} className="w-full h-48 object-cover" loading="lazy" />
      <div className="p-4">
        <h3 className="text-lg font-bold text-slate-900">{listing.title}</h3>
        <p className="text-sm text-slate-600">{listing.city} • Hasta {listing.maxGuests} huéspedes</p>
        <p className="mt-2 text-base font-semibold text-blue-900">
          {formatCurrencyAmount(listing.pricePerNight)} <span className="text-xs font-normal">/ noche</span>
        </p>
        <button
          type="button"
          onClick={() => onSelect(listing)}
          className="mt-3 w-full py-2 bg-slate-900 text-white rounded font-medium focus:outline-2 focus:outline-blue-600"
        >
          Reservar Estancia
        </button>
      </div>
    </article>
  );
};
