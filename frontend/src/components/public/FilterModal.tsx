import React, { useState } from 'react';

export interface FilterCriteria {
  minPrice: number;
  maxPrice: number;
  bedrooms: number | null; // null means 'any'
  bathrooms: number | null;
  amenities: string[];
}

interface FilterModalProps {
  isOpen: boolean;
  initialFilters: FilterCriteria;
  totalResultsCount: number;
  onClose: () => void;
  onApplyFilters: (filters: FilterCriteria) => void;
  onResetFilters: () => void;
}

const AVAILABLE_AMENITIES = [
  'Conexión Wi-Fi',
  'Cocina equipada',
  'Alberca privada',
  'Jacuzzi exterior',
  'Estacionamiento techado',
  'Chimenea de leña',
  'Espacio Pet Friendly',
  'Climatización',
  'Estudio de trabajo',
  'Vista panorámica',
];

export const FilterModal: React.FC<FilterModalProps> = ({
  isOpen,
  initialFilters,
  totalResultsCount,
  onClose,
  onApplyFilters,
  onResetFilters,
}) => {
  const [minPrice, setMinPrice] = useState(initialFilters.minPrice);
  const [maxPrice, setMaxPrice] = useState(initialFilters.maxPrice);
  const [bedrooms, setBedrooms] = useState<number | null>(initialFilters.bedrooms);
  const [bathrooms, setBathrooms] = useState<number | null>(initialFilters.bathrooms);
  const [amenities, setAmenities] = useState<string[]>(initialFilters.amenities);

  if (!isOpen) return null;

  const toggleAmenity = (name: string) => {
    if (amenities.includes(name)) {
      setAmenities(amenities.filter((a) => a !== name));
    } else {
      setAmenities([...amenities, name]);
    }
  };

  const handleApply = () => {
    onApplyFilters({
      minPrice,
      maxPrice,
      bedrooms,
      bathrooms,
      amenities,
    });
    onClose();
  };

  const handleReset = () => {
    setMinPrice(0);
    setMaxPrice(10000);
    setBedrooms(null);
    setBathrooms(null);
    setAmenities([]);
    onResetFilters();
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="filter-modal-title"
      className="fixed inset-0 z-50 bg-zinc-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl border border-zinc-200/80 max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-200/70 flex items-center justify-between sticky top-0 bg-white z-10">
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-zinc-200 hover:bg-zinc-100 flex items-center justify-center text-zinc-500 font-light text-sm transition"
          >
            ✕
          </button>
          <h2 id="filter-modal-title" className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-950">
            Filtros Selectos
          </h2>
          <div className="w-8"></div>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Price Range */}
          <div className="space-y-3 pb-6 border-b border-zinc-100">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-900">Tarifa por Noche</h3>
            <p className="text-xs text-zinc-500 font-light">
              Montos exactos en Pesos Mexicanos (MXN) sin cargos ocultos.
            </p>
            <div className="grid grid-cols-2 gap-4 pt-1">
              <div className="p-3 border border-zinc-200 rounded-2xl focus-within:border-zinc-950 bg-zinc-50/50">
                <label htmlFor="filter-min-price" className="block text-[9px] font-medium uppercase tracking-[0.16em] text-zinc-400">
                  Tarifa Mínima
                </label>
                <div className="flex items-center text-xs font-mono font-medium text-zinc-900 mt-1">
                  <span className="text-zinc-400 mr-1">$</span>
                  <input
                    id="filter-min-price"
                    type="number"
                    min={0}
                    step={100}
                    value={minPrice}
                    onChange={(e) => setMinPrice(Number(e.target.value))}
                    className="w-full focus:outline-none bg-transparent"
                  />
                  <span className="text-[10px] text-zinc-400 font-sans">MXN</span>
                </div>
              </div>

              <div className="p-3 border border-zinc-200 rounded-2xl focus-within:border-zinc-950 bg-zinc-50/50">
                <label htmlFor="filter-max-price" className="block text-[9px] font-medium uppercase tracking-[0.16em] text-zinc-400">
                  Tarifa Máxima
                </label>
                <div className="flex items-center text-xs font-mono font-medium text-zinc-900 mt-1">
                  <span className="text-zinc-400 mr-1">$</span>
                  <input
                    id="filter-max-price"
                    type="number"
                    min={0}
                    step={100}
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    className="w-full focus:outline-none bg-transparent"
                  />
                  <span className="text-[10px] text-zinc-400 font-sans">MXN</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bedrooms Selector */}
          <div className="space-y-3 pb-6 border-b border-zinc-100">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-900">Habitaciones</h3>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setBedrooms(null)}
                className={`px-4 py-2 rounded-full text-xs transition duration-150 ${
                  bedrooms === null
                    ? 'bg-zinc-950 text-white font-medium shadow-xs'
                    : 'bg-white text-zinc-700 border border-zinc-200 hover:border-zinc-950'
                }`}
              >
                Cualquiera
              </button>
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setBedrooms(num)}
                  className={`px-4 py-2 rounded-full text-xs font-mono transition duration-150 ${
                    bedrooms === num
                      ? 'bg-zinc-950 text-white font-medium shadow-xs'
                      : 'bg-white text-zinc-700 border border-zinc-200 hover:border-zinc-950'
                  }`}
                >
                  {num === 5 ? '5+' : num}
                </button>
              ))}
            </div>
          </div>

          {/* Bathrooms Selector */}
          <div className="space-y-3 pb-6 border-b border-zinc-100">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-900">Baños</h3>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setBathrooms(null)}
                className={`px-4 py-2 rounded-full text-xs transition duration-150 ${
                  bathrooms === null
                    ? 'bg-zinc-950 text-white font-medium shadow-xs'
                    : 'bg-white text-zinc-700 border border-zinc-200 hover:border-zinc-950'
                }`}
              >
                Cualquiera
              </button>
              {[1, 2, 3, 4].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setBathrooms(num)}
                  className={`px-4 py-2 rounded-full text-xs font-mono transition duration-150 ${
                    bathrooms === num
                      ? 'bg-zinc-950 text-white font-medium shadow-xs'
                      : 'bg-white text-zinc-700 border border-zinc-200 hover:border-zinc-950'
                  }`}
                >
                  {num === 4 ? '4+' : num}
                </button>
              ))}
            </div>
          </div>

          {/* Popular Amenities */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-900">Amenidades Clave</h3>
            <div className="grid grid-cols-2 gap-2.5">
              {AVAILABLE_AMENITIES.map((amenity) => {
                const checked = amenities.includes(amenity);
                return (
                  <label
                    key={amenity}
                    className={`flex items-center gap-2.5 p-3 rounded-2xl border cursor-pointer transition duration-150 ${
                      checked
                        ? 'bg-zinc-900 text-white border-zinc-900'
                        : 'bg-zinc-50/50 border-zinc-200 text-zinc-700 hover:bg-zinc-100'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleAmenity(amenity)}
                      className="w-3.5 h-3.5 text-zinc-950 rounded border-zinc-300 focus:ring-zinc-900"
                    />
                    <span className="text-xs font-normal">{amenity}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-200/70 bg-white flex items-center justify-between">
          <button
            type="button"
            onClick={handleReset}
            className="text-xs font-normal text-zinc-500 hover:text-zinc-950 transition"
          >
            Limpiar filtros
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="px-6 py-2.5 rounded-full bg-zinc-950 hover:bg-zinc-800 text-white font-medium text-xs tracking-wider uppercase transition shadow-xs"
          >
            Aplicar ({totalResultsCount})
          </button>
        </div>
      </div>
    </div>
  );
};
