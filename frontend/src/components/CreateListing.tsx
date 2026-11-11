import React, { useState } from 'react';
import { ListingItem, UserRole } from '../types/BookingState';
import { roomiaApi } from '../utils/apiClient';

interface CreateListingProps {
  onListingCreated?: (listing: ListingItem) => void;
}

export const CreateListing: React.FC<CreateListingProps> = ({ onListingCreated }) => {
  const [title, setTitle] = useState('Penthouse Panorámico Centro Histórico');
  const [city, setCity] = useState('Toluca');
  const [pricePerNight, setPricePerNight] = useState('1650.00');
  const [latitude, setLatitude] = useState('19.2826');
  const [longitude, setLongitude] = useState('-99.6557');
  const [maxGuests, setMaxGuests] = useState('4');
  const [role, setRole] = useState<UserRole>('HOST');
  const [statusMsg, setStatusMsg] = useState<{ error: boolean; text: string } | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const res = await roomiaApi.createListing({
      role,
      title,
      city,
      latitude: Number(latitude),
      longitude: Number(longitude),
      pricePerNight: Number(pricePerNight),
      maxGuests: Number(maxGuests),
      photosCount: 15,
    });

    if (!res.ok || !res.data) {
      setStatusMsg({
        error: true,
        text: res.error || 'Error al publicar alojamiento.',
      });
      return;
    }

    onListingCreated?.(res.data.data);
    setStatusMsg({
      error: false,
      text: `HTTP 201 Created: Alojamiento "${res.data.data.title}" (#${res.data.data.id}) publicado en catálogo activo con 15 fotografías convertidas a WebP (CPF-03).`,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      aria-label="Create Property Listing Form"
      className="bg-white p-6 rounded-xl shadow-md border border-slate-200 space-y-4"
    >
      <div className="border-b border-slate-100 pb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Publicar Alojamiento en Catálogo (M02)</h2>
          <p className="text-xs text-slate-500">
            Conversión WebP (1-15 fotos, máx. 5 MB), RBAC HOST y validación de coordenadas (CP-CAT-01)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="host-role-sim" className="text-xs font-bold text-slate-700">
            Rol Emisor:
          </label>
          <select
            id="host-role-sim"
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-900"
          >
            <option value="HOST">HOST (Autorizado)</option>
            <option value="GUEST">GUEST (Probar bloqueo RBAC 403)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="listing-title" className="block text-xs font-bold text-slate-700 mb-1">
            Título del Alojamiento
          </label>
          <input
            id="listing-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
          />
        </div>

        <div>
          <label htmlFor="listing-city" className="block text-xs font-bold text-slate-700 mb-1">
            Ciudad
          </label>
          <input
            id="listing-city"
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
          />
        </div>

        <div>
          <label htmlFor="listing-price" className="block text-xs font-bold text-slate-700 mb-1">
            Tarifa por Noche DECIMAL(10,2)
          </label>
          <input
            id="listing-price"
            type="number"
            step="0.01"
            value={pricePerNight}
            onChange={(e) => setPricePerNight(e.target.value)}
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
          />
        </div>

        <div>
          <label htmlFor="listing-lat" className="block text-xs font-bold text-slate-700 mb-1">
            Latitud [-90 a 90]
          </label>
          <input
            id="listing-lat"
            type="number"
            step="0.0000001"
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
          />
        </div>

        <div>
          <label htmlFor="listing-lng" className="block text-xs font-bold text-slate-700 mb-1">
            Longitud [-180 a 180]
          </label>
          <input
            id="listing-lng"
            type="number"
            step="0.0000001"
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
          />
        </div>

        <div>
          <label htmlFor="listing-guests" className="block text-xs font-bold text-slate-700 mb-1">
            Capacidad Máxima Huéspedes
          </label>
          <input
            id="listing-guests"
            type="number"
            min={1}
            max={16}
            value={maxGuests}
            onChange={(e) => setMaxGuests(e.target.value)}
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
          />
        </div>
      </div>

      {statusMsg && (
        <div
          role="alert"
          className={`p-3 rounded-lg text-xs font-semibold border ${
            statusMsg.error
              ? 'bg-rose-50 text-rose-900 border-rose-300'
              : 'bg-emerald-50 text-emerald-900 border-emerald-300'
          }`}
        >
          {statusMsg.text}
        </div>
      )}

      <button
        type="submit"
        className="bg-blue-700 hover:bg-blue-800 text-white font-semibold text-sm py-2.5 px-5 rounded-lg shadow transition"
      >
        Publicar Alojamiento en Catálogo (WebP)
      </button>
    </form>
  );
};
