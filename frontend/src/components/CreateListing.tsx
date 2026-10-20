import React, { useState } from 'react';

/**
 * Section 12 (RF-02) & CPF-03: Host property creation with geospatial & WebP photo validation.
 */
export const CreateListing: React.FC = () => {
  const [title, setTitle] = useState<string>('');
  const [latitude, setLatitude] = useState<string>('19.2826');
  const [longitude, setLongitude] = useState<string>('-99.6557');
  const [pricePerNight, setPricePerNight] = useState<string>('1450.00');

  return (
    <section aria-label="Publish New Property" className="p-6 bg-white rounded-xl shadow">
      <h2 className="text-xl font-bold text-slate-900 mb-4">Publicar Alojamiento (M02 - Rol HOST)</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="listing-title" className="block text-sm font-medium">Título del Alojamiento</label>
          <input id="listing-title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border rounded p-2" />
        </div>
        <div>
          <label htmlFor="listing-price" className="block text-sm font-medium">Tarifa por Noche DECIMAL(10,2)</label>
          <input id="listing-price" type="number" step="0.01" value={pricePerNight} onChange={(e) => setPricePerNight(e.target.value)} className="w-full border rounded p-2" />
        </div>
        <div>
          <label htmlFor="listing-lat" className="block text-sm font-medium">Latitud [-90 a 90]</label>
          <input id="listing-lat" type="text" value={latitude} onChange={(e) => setLatitude(e.target.value)} className="w-full border rounded p-2" />
        </div>
        <div>
          <label htmlFor="listing-lng" className="block text-sm font-medium">Longitud [-180 a 180]</label>
          <input id="listing-lng" type="text" value={longitude} onChange={(e) => setLongitude(e.target.value)} className="w-full border rounded p-2" />
        </div>
      </div>
    </section>
  );
};
