import React, { useState } from 'react';

interface SearchFiltersProps {
  onSearch: (filters: { city: string; guests: number; checkIn: string; checkOut: string }) => void;
  onReset?: () => void;
}

export const SearchFilters: React.FC<SearchFiltersProps> = ({ onSearch, onReset }) => {
  const [city, setCity] = useState('');
  const [guests, setGuests] = useState(2);
  const [checkIn, setCheckIn] = useState('2026-12-24');
  const [checkOut, setCheckOut] = useState('2026-12-26');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({ city, guests, checkIn, checkOut });
  };

  return (
    <form
      onSubmit={handleSubmit}
      aria-label="Accommodation Search Form"
      className="bg-white p-5 rounded-xl shadow-md border border-slate-200 grid grid-cols-1 md:grid-cols-5 gap-4 items-end"
    >
      <div>
        <label htmlFor="search-city" className="block text-xs font-bold text-slate-700 mb-1">
          Ciudad / Destino
        </label>
        <input
          id="search-city"
          type="text"
          placeholder="Todas (ej. Toluca, Metepec)"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="search-guests" className="block text-xs font-bold text-slate-700 mb-1">
          Huéspedes
        </label>
        <input
          id="search-guests"
          type="number"
          min={1}
          max={16}
          value={guests}
          onChange={(e) => setGuests(Number(e.target.value))}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="search-checkin" className="block text-xs font-bold text-slate-700 mb-1">
          Check-In
        </label>
        <input
          id="search-checkin"
          type="date"
          value={checkIn}
          onChange={(e) => setCheckIn(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="search-checkout" className="block text-xs font-bold text-slate-700 mb-1">
          Check-Out
        </label>
        <input
          id="search-checkout"
          type="date"
          value={checkOut}
          onChange={(e) => setCheckOut(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
        />
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          aria-label="Buscar alojamientos disponibles"
          className="flex-1 bg-blue-700 hover:bg-blue-800 text-white font-semibold text-sm py-2.5 px-4 rounded-lg shadow transition focus:ring-2 focus:ring-blue-500 focus:outline-none"
        >
          Buscar (M03)
        </button>
        {onReset && (
          <button
            type="button"
            onClick={() => {
              setCity('');
              setGuests(1);
              onReset();
            }}
            aria-label="Restablecer filtros de búsqueda"
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs py-2.5 px-3 rounded-lg border border-slate-300 transition"
          >
            Ver Todos
          </button>
        )}
      </div>
    </form>
  );
};
