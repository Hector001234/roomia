import React, { useEffect, useRef, useState } from 'react';
import { ListingItem } from '../../types/BookingState';

interface InteractiveMapViewProps {
  listings: ListingItem[];
  onSelectListing: (listing: ListingItem) => void;
  showTaxes: boolean;
}

interface LeafletMap {
  remove: () => void;
  panTo: (coords: [number, number], options?: Record<string, unknown>) => void;
  setView: (coords: [number, number], zoom: number) => void;
}

interface LeafletLayerGroup {
  clearLayers: () => void;
  addLayer: (layer: unknown) => void;
}

interface LeafletTileLayer {
  addTo: (map: LeafletMap) => LeafletTileLayer;
  remove: () => void;
}

interface LeafletGlobal {
  map: (element: HTMLElement, options?: Record<string, unknown>) => LeafletMap;
  tileLayer: (url: string, options?: Record<string, unknown>) => LeafletTileLayer;
  control: { zoom: (options?: Record<string, unknown>) => { addTo: (map: LeafletMap) => void } };
  layerGroup: () => LeafletLayerGroup & { addTo: (map: LeafletMap) => LeafletLayerGroup };
  divIcon: (options: Record<string, unknown>) => unknown;
  marker: (
    coords: [number, number],
    options?: Record<string, unknown>
  ) => { on: (event: string, fn: () => void) => void };
}

declare global {
  interface Window {
    L?: LeafletGlobal;
  }
}

type MapProvider = 'streets' | 'satellite' | 'google' | 'waze';

export const InteractiveMapView: React.FC<InteractiveMapViewProps> = ({
  listings,
  onSelectListing,
  showTaxes,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const tileLayerRef = useRef<LeafletTileLayer | null>(null);
  const markersLayerRef = useRef<LeafletLayerGroup | null>(null);

  const [activeProvider, setActiveProvider] = useState<MapProvider>('streets');
  const [selectedListing, setSelectedListing] = useState<ListingItem | null>(listings[0] || null);

  const calculateDisplayPrice = (pricePerNight: string | number) => {
    const base = Number(pricePerNight);
    if (!showTaxes) return base;
    return Math.round(base * 1.28);
  };

  // Center coordinate around Central Mexico (Toluca / Metepec / Valle de Bravo / CDMX)
  const defaultCenter = { lat: 19.2925, lng: -99.6569 };

  const currentFocus = selectedListing
    ? { lat: Number(selectedListing.latitude), lng: Number(selectedListing.longitude) }
    : defaultCenter;

  // Initialize and update Leaflet map with 100% free, reliable tiles without API keys
  useEffect(() => {
    if (activeProvider !== 'streets' && activeProvider !== 'satellite') return;
    if (!mapContainerRef.current) return;

    const L = window.L;
    if (!L) return;

    const isSatellite = activeProvider === 'satellite';
    // OpenStreetMap standard (streets) or Esri World Imagery (high-definition satellite)
    const tileUrl = isSatellite
      ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
      : 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [currentFocus.lat, currentFocus.lng],
        zoom: 10,
        zoomControl: false,
        attributionControl: false,
      });

      L.control.zoom({ position: 'topright' }).addTo(map);

      const tileLayer = L.tileLayer(tileUrl, {
        maxZoom: 19,
      }).addTo(map);
      tileLayerRef.current = tileLayer;

      const markersGroup = L.layerGroup().addTo(map);
      markersLayerRef.current = markersGroup;
      mapInstanceRef.current = map;
    } else {
      // Switch tile layer cleanly when toggling between streets and satellite
      if (tileLayerRef.current) {
        tileLayerRef.current.remove();
      }
      const newTileLayer = L.tileLayer(tileUrl, {
        maxZoom: 19,
      }).addTo(mapInstanceRef.current);
      tileLayerRef.current = newTileLayer;
    }

    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;

    if (markersGroup) {
      markersGroup.clearLayers();

      listings.forEach((item) => {
        const lat = Number(item.latitude);
        const lng = Number(item.longitude);
        if (isNaN(lat) || isNaN(lng)) return;

        const price = calculateDisplayPrice(item.pricePerNight);
        const isSelected = selectedListing?.id === item.id;

        // Custom HTML pill marker
        const customIcon = L.divIcon({
          className: 'custom-roomia-marker',
          html: `
            <div style="
              background: ${isSelected ? '#09090b' : '#ffffff'};
              color: ${isSelected ? '#ffffff' : '#09090b'};
              border: 1.5px solid ${isSelected ? '#ffffff' : '#18181b'};
              padding: 5px 12px;
              border-radius: 9999px;
              font-size: 11px;
              font-weight: 700;
              letter-spacing: -0.01em;
              white-space: nowrap;
              box-shadow: 0 4px 14px rgba(0,0,0,0.25);
              cursor: pointer;
              transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
              display: flex;
              align-items: center;
              gap: 5px;
              transform: ${isSelected ? 'scale(1.12)' : 'scale(1)'};
            ">
              <span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:${isSelected ? '#10b981' : '#09090b'};"></span>
              <span>$${price.toLocaleString('es-MX')} MXN</span>
            </div>
          `,
          iconSize: [95, 30],
          iconAnchor: [47, 15],
        });

        const marker = L.marker([lat, lng], { icon: customIcon });
        marker.on('click', () => {
          setSelectedListing(item);
          map.panTo([lat, lng], { animate: true, duration: 0.5 });
        });
        markersGroup.addLayer(marker);
      });
    }
  }, [activeProvider, listings, selectedListing, showTaxes]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const openInGoogleMaps = (lat: number | string, lng: number | string, title: string) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}&query_place_id=${encodeURIComponent(title)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const openInWaze = (lat: number | string, lng: number | string) => {
    const url = `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="relative w-full h-[720px] bg-zinc-100 rounded-3xl overflow-hidden border border-zinc-200/80 shadow-lg">
      {/* Top Map Toolbar: Mode Selector & Status */}
      <div className="absolute top-4 left-4 z-30 flex flex-wrap items-center gap-1.5 bg-white/95 backdrop-blur-md px-3 py-2 rounded-2xl border border-zinc-200/90 shadow-sm max-w-[90vw]">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mr-1 hidden sm:inline">
          Capa Cartográfica:
        </span>
        <button
          type="button"
          onClick={() => setActiveProvider('streets')}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium transition duration-150 flex items-center gap-1.5 ${
            activeProvider === 'streets'
              ? 'bg-zinc-950 text-white shadow-xs'
              : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          <span>Calles & Poblados</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveProvider('satellite')}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium transition duration-150 flex items-center gap-1.5 ${
            activeProvider === 'satellite'
              ? 'bg-zinc-950 text-white shadow-xs'
              : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
          <span>Satelital HD</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveProvider('google')}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium transition duration-150 flex items-center gap-1.5 ${
            activeProvider === 'google'
              ? 'bg-zinc-950 text-white shadow-xs'
              : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
          <span>Google Maps Multidestino</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveProvider('waze')}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium transition duration-150 flex items-center gap-1.5 ${
            activeProvider === 'waze'
              ? 'bg-zinc-950 text-white shadow-xs'
              : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
          <span>Waze Rutas en Vivo</span>
        </button>
      </div>

      {/* Main Map Canvas Area (Streets or Satellite HD with all 10 pins) */}
      {(activeProvider === 'streets' || activeProvider === 'satellite') && (
        <div ref={mapContainerRef} className="w-full h-full z-10" />
      )}

      {/* Google Maps Multi-Destination View */}
      {activeProvider === 'google' && (
        <div className="w-full h-full relative z-10 flex flex-col md:flex-row bg-zinc-100">
          {/* Side Drawer: Georeferenced Listings List */}
          <div className="w-full md:w-80 h-48 md:h-full bg-white/95 backdrop-blur-md border-r border-zinc-200 overflow-y-auto p-3 space-y-2 shrink-0 z-20">
            <div className="px-2 pt-1 pb-2">
              <div className="text-xs font-bold text-zinc-950 uppercase tracking-wider">
                Residencias Georreferenciadas ({listings.length})
              </div>
              <p className="text-[10px] text-zinc-400 font-light">
                Haz clic en una estancia para centrar el mapa de Google
              </p>
            </div>
            {listings.map((item) => {
              const isSelected = selectedListing?.id === item.id;
              const price = calculateDisplayPrice(item.pricePerNight);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedListing(item)}
                  className={`w-full text-left p-2.5 rounded-xl border transition-all duration-150 flex items-center gap-3 ${
                    isSelected
                      ? 'bg-zinc-950 text-white border-zinc-950 shadow-xs'
                      : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-900 border-zinc-200/80'
                  }`}
                >
                  <img
                    src={item.photoUrl}
                    alt={item.title}
                    className="w-12 h-12 rounded-lg object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold truncate leading-tight">
                      {item.title}
                    </div>
                    <div className={`text-[10px] truncate ${isSelected ? 'text-zinc-300' : 'text-zinc-500'}`}>
                      {item.city}, {item.stateName}
                    </div>
                    <div className="text-[11px] font-mono font-bold mt-0.5">
                      ${price.toLocaleString('es-MX')} MXN
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Centered Google Map Embed */}
          <div className="flex-1 h-full relative">
            <iframe
              title="Google Maps Interactivo Georreferenciado"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              src={`https://maps.google.com/maps?q=${currentFocus.lat},${currentFocus.lng}&z=14&output=embed`}
            />
            <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  openInGoogleMaps(
                    currentFocus.lat,
                    currentFocus.lng,
                    selectedListing?.title || 'Destino Roomia'
                  )
                }
                className="px-4 py-2 rounded-xl bg-white/95 text-zinc-950 text-xs font-semibold shadow-md hover:bg-zinc-100 border border-zinc-200 transition flex items-center gap-2"
              >
                <span>Abrir en Google Maps Oficial</span>
                <span className="text-blue-600">↗</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Waze Live Navigation Area */}
      {activeProvider === 'waze' && (
        <div className="w-full h-full relative z-10 flex flex-col items-center justify-center bg-zinc-950 text-white p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-5 shadow-lg">
            <svg className="w-8 h-8 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
              <circle cx="12" cy="9" r="2.5" />
            </svg>
          </div>
          <h3 className="text-xl font-bold tracking-tight text-white mb-2">
            Rutas y Tráfico en Vivo con Waze
          </h3>
          <p className="text-zinc-400 text-xs max-w-lg mb-6 leading-relaxed">
            Obtén estimación precisa de tiempo de llegada, alertas viales, peajes de autopista y guiado paso a paso por voz para llegar a cualquiera de las 10 residencias de Roomia.
          </p>

          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-6 text-left">
            <label htmlFor="waze-destination-select" className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-2">
              Seleccionar Destino:
            </label>
            <select
              id="waze-destination-select"
              value={selectedListing?.id || ''}
              onChange={(e) => {
                const found = listings.find((item) => item.id === Number(e.target.value));
                if (found) setSelectedListing(found);
              }}
              className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-white text-xs font-medium focus:outline-none focus:border-cyan-400"
            >
              {listings.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.title} — {l.city} (${Number(l.pricePerNight).toLocaleString('es-MX')} MXN)
                </option>
              ))}
            </select>
            {selectedListing && (
              <div className="mt-3 text-[11px] text-zinc-400 font-mono flex items-center justify-between">
                <span>Coordenadas GPS:</span>
                <span className="text-cyan-400 font-bold">{Number(selectedListing.latitude).toFixed(4)}, {Number(selectedListing.longitude).toFixed(4)}</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => openInWaze(currentFocus.lat, currentFocus.lng)}
              className="px-6 py-3 rounded-full bg-cyan-400 text-zinc-950 font-bold text-xs tracking-wide hover:bg-cyan-300 transition duration-150 shadow-xl flex items-center gap-2"
            >
              <span>Navegar Ahora con Waze</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => openInGoogleMaps(currentFocus.lat, currentFocus.lng, selectedListing?.title || 'Destino')}
              className="px-5 py-3 rounded-full border border-zinc-700 bg-zinc-900 text-white font-medium text-xs hover:bg-zinc-800 transition duration-150"
            >
              Abrir en Google Maps
            </button>
          </div>
        </div>
      )}

      {/* Floating Selected Property Card (Available in Streets and Satellite modes) */}
      {(activeProvider === 'streets' || activeProvider === 'satellite') && selectedListing && (
        <div className="absolute bottom-6 left-6 z-30 w-80 sm:w-96 bg-white/95 backdrop-blur-md rounded-2xl border border-zinc-200/90 shadow-2xl p-4 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4">
          <div className="relative h-44 rounded-xl overflow-hidden mb-3.5 group bg-zinc-100">
            <img
              src={selectedListing.photoUrl}
              alt={selectedListing.title}
              className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
            />
            <button
              type="button"
              onClick={() => setSelectedListing(null)}
              className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white/80 hover:bg-white text-zinc-700 flex items-center justify-center text-xs shadow-xs transition"
              title="Cerrar ficha"
            >
              ✕
            </button>
            <div className="absolute bottom-2.5 left-2.5 px-2.5 py-1 rounded-full bg-zinc-950/80 backdrop-blur-sm text-white text-[10px] font-mono">
              {selectedListing.city} · {selectedListing.category}
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-start justify-between gap-2">
              <h4 className="text-sm font-semibold text-zinc-950 line-clamp-1 leading-snug">
                {selectedListing.title}
              </h4>
              <div className="text-xs font-mono font-medium text-zinc-900 shrink-0">
                ★ 4.95
              </div>
            </div>
            <p className="text-xs text-zinc-500 font-light line-clamp-1">
              {selectedListing.city}, {selectedListing.stateName}
            </p>

            <div className="pt-2 flex items-baseline justify-between border-t border-zinc-100">
              <div>
                <span className="text-sm font-bold text-zinc-950 font-mono">
                  ${calculateDisplayPrice(selectedListing.pricePerNight).toLocaleString('es-MX')}
                </span>
                <span className="text-[11px] text-zinc-500 ml-1">MXN / noche</span>
              </div>
              <div className="text-[10px] text-zinc-400 font-mono">
                {selectedListing.bedrooms || 2} rec · {selectedListing.bathrooms || 1} bñ
              </div>
            </div>

            {/* Quick Map Action Links: Google Maps & Waze */}
            <div className="pt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() =>
                  openInGoogleMaps(
                    selectedListing.latitude,
                    selectedListing.longitude,
                    selectedListing.title
                  )
                }
                className="w-full py-2 px-2.5 rounded-xl border border-zinc-300 hover:border-zinc-950 text-zinc-800 hover:text-zinc-950 text-[11px] font-semibold transition flex items-center justify-center gap-1.5 bg-white shadow-2xs"
              >
                <svg className="w-3.5 h-3.5 text-blue-600 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
                <span>Google Maps</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  openInWaze(selectedListing.latitude, selectedListing.longitude)
                }
                className="w-full py-2 px-2.5 rounded-xl border border-zinc-300 hover:border-cyan-600 text-zinc-800 hover:text-cyan-700 text-[11px] font-semibold transition flex items-center justify-center gap-1.5 bg-white shadow-2xs"
              >
                <svg className="w-3.5 h-3.5 text-cyan-500 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z"/>
                </svg>
                <span>Waze</span>
              </button>
            </div>

            {/* Primary Action Button */}
            <button
              type="button"
              onClick={() => onSelectListing(selectedListing)}
              className="w-full mt-2 py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold tracking-wide transition shadow-xs"
            >
              Ver Residencia & Fechas
            </button>
          </div>
        </div>
      )}

      {/* Bottom Bar Indicator */}
      <div className="absolute bottom-4 right-4 z-20 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-zinc-200/80 text-[11px] text-zinc-500 shadow-xs">
        <span className="font-semibold text-zinc-900">{listings.length}</span> residencias en mapa georreferenciado
      </div>
    </div>
  );
};
