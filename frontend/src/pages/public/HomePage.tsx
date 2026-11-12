import React, { useEffect, useState } from 'react';
import { PropertyCard } from '../../components/PropertyCard';
import { PropertyDetailModal } from '../../components/PropertyDetailModal';
import { FilterCriteria, FilterModal } from '../../components/public/FilterModal';
import { InteractiveMapView } from '../../components/public/InteractiveMapView';
import { useAuth } from '../../context/AuthContext';
import { BookingSummary, ListingItem, ReviewItem } from '../../types/BookingState';
import { roomiaApi } from '../../utils/apiClient';

const CATEGORIES: Array<{ id: string; label: string }> = [
  { id: 'Todos', label: 'Todos los espacios' },
  { id: 'Cabañas', label: 'Bosque & Montaña' },
  { id: 'Lofts', label: 'Lofts de Autor' },
  { id: 'Colonial', label: 'Casonas Históricas' },
  { id: 'Alberca', label: 'Villas con Alberca' },
  { id: 'Montaña', label: 'Vistas al Nevado' },
  { id: 'Urbano', label: 'Residencias de Estudio' },
];

const DEFAULT_FILTERS: FilterCriteria = {
  minPrice: 0,
  maxPrice: 10000,
  bedrooms: null,
  bathrooms: null,
  amenities: [],
};

export const HomePage: React.FC = () => {
  const { currentUser } = useAuth();
  const [allListings, setAllListings] = useState<ListingItem[]>([]);
  const [filteredListings, setFilteredListings] = useState<ListingItem[]>([]);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Search Bar State
  const [city, setCity] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [checkIn, setCheckIn] = useState('2026-11-20');
  const [checkOut, setCheckOut] = useState('2026-11-23');
  const [guests, setGuests] = useState(2);

  // Minimalist Controls
  const [showTaxes, setShowTaxes] = useState(false);
  const [isMapView, setIsMapView] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<FilterCriteria>(DEFAULT_FILTERS);

  // Modal State
  const [selectedListing, setSelectedListing] = useState<ListingItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchCatalogData = async () => {
    setLoading(true);
    setErrorMsg(null);
    const res = await roomiaApi.fetchCatalog(50, 0);
    setLoading(false);
    if (res.ok && res.data) {
      setAllListings(res.data.data);
      setFilteredListings(res.data.data);
      setReviews(res.data.reviews);

      // Deep linking: auto-open shared residence if ?residencia=ID is present
      const params = new URLSearchParams(window.location.search);
      const targetId = params.get('residencia');
      if (targetId) {
        const found = res.data.data.find((item) => item.id === Number(targetId));
        if (found) {
          setSelectedListing(found);
        }
      }
    } else {
      setErrorMsg(res.error || 'No se pudo conectar con el catálogo de alojamientos.');
    }
  };

  useEffect(() => {
    void fetchCatalogData();
  }, []);

  // Real-time cross-tab/cross-port sync when Admin (:5175) creates, pauses, or reactivates a listing
  useEffect(() => {
    const syncLive = async () => {
      const res = await roomiaApi.searchListings({
        city,
        category: selectedCategory,
        guests,
        checkIn,
        checkOut,
      });
      if (res.ok && res.data) {
        setAllListings(res.data.data);
        setFilteredListings(applyClientFilters(res.data.data, activeFilters));
      }
    };
    const onFocus = () => void syncLive();
    window.addEventListener('focus', onFocus);
    const interval = window.setInterval(onFocus, 2500);
    return () => {
      window.removeEventListener('focus', onFocus);
      window.clearInterval(interval);
    };
  }, [city, selectedCategory, guests, checkIn, checkOut, activeFilters]);

  const applyClientFilters = (base: ListingItem[], filters: FilterCriteria) => {
    return base.filter((item) => {
      const price = Number(item.pricePerNight);
      if (price < filters.minPrice || price > filters.maxPrice) return false;
      if (filters.bedrooms !== null && (item.bedrooms || 1) < filters.bedrooms) return false;
      if (filters.bathrooms !== null && (item.bathrooms || 1) < filters.bathrooms) return false;
      if (filters.amenities.length > 0) {
        const itemAmenities = item.amenities || [];
        const hasAll = filters.amenities.every((a) => itemAmenities.includes(a));
        if (!hasAll) return false;
      }
      return true;
    });
  };

  const handleSearchSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    const res = await roomiaApi.searchListings({
      city,
      category: selectedCategory,
      guests,
      checkIn,
      checkOut,
    });
    setLoading(false);
    if (res.ok && res.data) {
      setAllListings(res.data.data);
      setFilteredListings(applyClientFilters(res.data.data, activeFilters));
    } else {
      setErrorMsg(res.error || 'Error al procesar la búsqueda.');
    }
  };

  const handleCategorySelect = (catId: string) => {
    setSelectedCategory(catId);
    void (async () => {
      setLoading(true);
      const res = await roomiaApi.searchListings({
        city,
        category: catId,
        guests,
        checkIn,
        checkOut,
      });
      setLoading(false);
      if (res.ok && res.data) {
        setAllListings(res.data.data);
        setFilteredListings(applyClientFilters(res.data.data, activeFilters));
      }
    })();
  };

  const handleApplyAdvancedFilters = (newFilters: FilterCriteria) => {
    setActiveFilters(newFilters);
    setFilteredListings(applyClientFilters(allListings, newFilters));
  };

  const handleResetAdvancedFilters = () => {
    setActiveFilters(DEFAULT_FILTERS);
    setFilteredListings(allListings);
  };

  const activeFiltersCount =
    (activeFilters.bedrooms !== null ? 1 : 0) +
    (activeFilters.bathrooms !== null ? 1 : 0) +
    (activeFilters.minPrice > 0 || activeFilters.maxPrice < 10000 ? 1 : 0) +
    activeFilters.amenities.length;

  return (
    <div className="space-y-8 relative pb-20">
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

      {/* Floating Vacation Search Bar - Monochromatic Architectural Form */}
      <section aria-label="Buscador de Alojamientos" className="bg-white rounded-3xl shadow-sm border border-zinc-200/80 p-2 md:p-3">
        <form
          onSubmit={handleSearchSubmit}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-center"
        >
          <div className="px-4 py-2 border-b sm:border-b-0 sm:border-r border-zinc-100">
            <label htmlFor="search-city" className="block text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-400">
              Destino
            </label>
            <input
              id="search-city"
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Toluca, Valle de Bravo, Metepec..."
              className="w-full text-xs font-medium text-zinc-900 focus:outline-none placeholder-zinc-400 mt-1 bg-transparent"
            />
          </div>

          <div className="px-4 py-2 border-b sm:border-b-0 lg:border-r border-zinc-100">
            <label htmlFor="search-checkin" className="block text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-400">
              Llegada
            </label>
            <input
              id="search-checkin"
              type="date"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              className="w-full text-xs font-medium text-zinc-900 focus:outline-none mt-1 bg-transparent"
            />
          </div>

          <div className="px-4 py-2 border-b sm:border-b-0 sm:border-r border-zinc-100">
            <label htmlFor="search-checkout" className="block text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-400">
              Salida
            </label>
            <input
              id="search-checkout"
              type="date"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              className="w-full text-xs font-medium text-zinc-900 focus:outline-none mt-1 bg-transparent"
            />
          </div>

          <div className="px-4 py-2">
            <label htmlFor="search-guests" className="block text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-400">
              Huéspedes
            </label>
            <input
              id="search-guests"
              type="number"
              min={1}
              max={16}
              value={guests}
              onChange={(e) => setGuests(Number(e.target.value))}
              className="w-full text-xs font-medium text-zinc-900 focus:outline-none mt-1 bg-transparent"
            />
          </div>

          <div className="flex items-center gap-2 px-2">
            <button
              type="submit"
              className="flex-1 py-3 px-6 rounded-2xl bg-zinc-950 hover:bg-zinc-800 text-white font-medium text-xs tracking-wider uppercase shadow-xs transition duration-200"
            >
              Buscar
            </button>
            <button
              type="button"
              onClick={() => {
                setCity('');
                setSelectedCategory('Todos');
                setGuests(1);
                handleResetAdvancedFilters();
                void fetchCatalogData();
              }}
              title="Restablecer filtros"
              className="w-10 h-10 rounded-2xl border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 text-zinc-600 text-xs font-medium flex items-center justify-center transition"
            >
              ↺
            </button>
          </div>
        </form>
      </section>

      {/* Categories & Filter Bar - Clean Architectural Line */}
      <section aria-label="Filtro por Categorías y Opciones" className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
        {/* Categories Strip */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar flex-1 border-b border-zinc-200/60 pb-3">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleCategorySelect(cat.id)}
              className={`px-4 py-2 rounded-full text-xs whitespace-nowrap transition-all duration-200 ${
                selectedCategory === cat.id
                  ? 'bg-zinc-950 text-white font-medium shadow-xs'
                  : 'bg-transparent text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 font-normal'
              }`}
            >
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Right Controls: Filters Button + Minimalist Tax Switch */}
        <div className="flex items-center gap-4 shrink-0">
          {/* Advanced Filter Modal Button */}
          <button
            type="button"
            onClick={() => setIsFilterModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-zinc-200 hover:border-zinc-900 bg-white text-xs font-medium text-zinc-800 transition duration-200"
          >
            <span>Filtros</span>
            {activeFiltersCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-zinc-950 text-white text-[9px] flex items-center justify-center font-mono">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Minimalist Price with Taxes Toggle */}
          <div className="hidden sm:flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border border-zinc-200 bg-white text-xs">
            <span className="font-normal text-zinc-600 text-[11px]">Impuestos incluidos</span>
            <button
              type="button"
              role="switch"
              aria-checked={showTaxes}
              onClick={() => setShowTaxes(!showTaxes)}
              className={`relative inline-flex h-4 w-8 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                showTaxes ? 'bg-zinc-950' : 'bg-zinc-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out mt-0.5 ml-0.5 ${
                  showTaxes ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </section>

      {/* Catalog Title & Counter */}
      <div className="flex flex-wrap items-baseline justify-between gap-3 pt-2">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-zinc-950">
            {selectedCategory === 'Todos' ? 'Espacios Disponibles' : selectedCategory}
            <span className="text-zinc-400 font-normal text-xs ml-2">
              {filteredListings.length} {filteredListings.length === 1 ? 'residencia' : 'residencias'}
            </span>
          </h1>
          <p className="text-xs text-zinc-500 font-light mt-0.5">
            Tarifas transparentes · Asignación garantizada con bloqueo concurrente
          </p>
        </div>
      </div>

      {/* Main Content: Map or Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-7">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="bg-white rounded-3xl h-84 animate-pulse border border-zinc-100 p-4 space-y-4">
              <div className="h-48 bg-zinc-100 rounded-2xl"></div>
              <div className="h-4 bg-zinc-100 rounded w-2/3"></div>
              <div className="h-3 bg-zinc-100 rounded w-1/2"></div>
              <div className="h-4 bg-zinc-100 rounded w-1/3 pt-1"></div>
            </div>
          ))}
        </div>
      ) : errorMsg ? (
        <div className="p-10 bg-zinc-50 border border-zinc-200 rounded-3xl text-center space-y-3">
          <div className="text-zinc-800 font-medium text-xs">{errorMsg}</div>
          <button
            type="button"
            onClick={fetchCatalogData}
            className="px-5 py-2 rounded-full bg-zinc-950 text-white text-xs font-medium"
          >
            Reintentar
          </button>
        </div>
      ) : filteredListings.length === 0 ? (
        <div className="bg-white p-16 rounded-3xl border border-zinc-200/80 text-center space-y-4 shadow-xs max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 mx-auto font-light text-xl">
            —
          </div>
          <h2 className="text-base font-semibold text-zinc-900 tracking-tight">
            No se encontraron residencias disponibles
          </h2>
          <p className="text-xs text-zinc-500 font-light max-w-sm mx-auto leading-relaxed">
            Las fechas seleccionadas no cuentan con cupo libre bajo los criterios actuales.
          </p>
          <button
            type="button"
            onClick={() => {
              setCity('');
              setSelectedCategory('Todos');
              setGuests(1);
              handleResetAdvancedFilters();
              void fetchCatalogData();
            }}
            className="px-5 py-2 rounded-full border border-zinc-300 hover:border-zinc-950 text-zinc-900 font-medium text-xs transition"
          >
            Ver todos los espacios
          </button>
        </div>
      ) : isMapView ? (
        <InteractiveMapView
          listings={filteredListings}
          showTaxes={showTaxes}
          onSelectListing={(item) => setSelectedListing(item)}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-7">
          {filteredListings.map((item) => (
            <PropertyCard
              key={item.id}
              listing={item}
              showTaxes={showTaxes}
              onSelect={(selected) => setSelectedListing(selected)}
            />
          ))}
        </div>
      )}

      {/* Floating Minimalist "Mapa / Lista" Pill Button */}
      <div className="fixed bottom-7 left-1/2 -translate-x-1/2 z-40">
        <button
          type="button"
          onClick={() => setIsMapView(!isMapView)}
          className="px-6 py-2.5 rounded-full bg-zinc-950 hover:bg-zinc-800 text-white font-medium text-xs tracking-wide shadow-xl flex items-center gap-2 transition-all duration-200 hover:scale-105 border border-zinc-800"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-400"></span>
          <span>{isMapView ? 'Ver Cuadrícula' : 'Ver en Mapa'}</span>
        </button>
      </div>

      {/* Advanced Filter Modal */}
      <FilterModal
        isOpen={isFilterModalOpen}
        initialFilters={activeFilters}
        totalResultsCount={filteredListings.length}
        onClose={() => setIsFilterModalOpen(false)}
        onApplyFilters={handleApplyAdvancedFilters}
        onResetFilters={handleResetAdvancedFilters}
      />

      {/* Property Detail Modal */}
      {selectedListing && (
        <PropertyDetailModal
          listing={selectedListing}
          currentUser={currentUser}
          reviews={reviews}
          onClose={() => setSelectedListing(null)}
          onBookingSuccess={(booking: BookingSummary) => {
            setToastMessage(`Reserva #${booking.id} creada para ${booking.listingTitle}`);
            void fetchCatalogData();
          }}
          onReviewAdded={() => {
            void fetchCatalogData();
          }}
        />
      )}
    </div>
  );
};
