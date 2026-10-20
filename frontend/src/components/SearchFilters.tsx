import React, { useState } from 'react';

interface SearchFiltersProps {
  onSearch: (city: string, checkIn: string, checkOut: string, guests: number) => void;
}

/**
 * Section 12 (RF-03) & CPF-04: Multi-criteria parameterized search filter bar.
 */
export const SearchFilters: React.FC<SearchFiltersProps> = ({ onSearch }) => {
  const [city, setCity] = useState<string>('Toluca');
  const [checkIn, setCheckIn] = useState<string>('2026-12-24');
  const [checkOut, setCheckOut] = useState<string>('2026-12-26');
  const [guests, setGuests] = useState<number>(2);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSearch(city, checkIn, checkOut, guests);
      }}
      aria-label="Multi-Criteria Property Search"
      className="p-4 bg-slate-100 rounded-xl flex flex-wrap gap-4 items-end"
    >
      <div>
        <label htmlFor="search-city" className="block text-xs font-semibold uppercase">Ciudad</label>
        <input id="search-city" type="text" value={city} onChange={(e) => setCity(e.target.value)} className="border rounded p-2" />
      </div>
      <div>
        <label htmlFor="search-checkin" className="block text-xs font-semibold uppercase">Check-In</label>
        <input id="search-checkin" type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} className="border rounded p-2" />
      </div>
      <div>
        <label htmlFor="search-checkout" className="block text-xs font-semibold uppercase">Check-Out</label>
        <input id="search-checkout" type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} className="border rounded p-2" />
      </div>
      <div>
        <label htmlFor="search-guests" className="block text-xs font-semibold uppercase">Huéspedes</label>
        <input id="search-guests" type="number" min={1} max={20} value={guests} onChange={(e) => setGuests(Number(e.target.value))} className="border rounded p-2 w-20" />
      </div>
      <button type="submit" className="px-5 py-2 bg-blue-800 text-white font-semibold rounded">
        Buscar Disponibilidad
      </button>
    </form>
  );
};
