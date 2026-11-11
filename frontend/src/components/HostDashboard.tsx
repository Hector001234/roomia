import React, { useEffect, useState } from 'react';
import {
  ListingItem,
  ListingStatus,
  PublicUserDto,
  UserRole,
} from '../types/BookingState';
import { roomiaApi } from '../utils/apiClient';

interface HostDashboardProps {
  allListings: ListingItem[];
  currentUser: PublicUserDto;
  initialEditingListing?: ListingItem | null;
  onRefresh: () => void;
}

export const HostDashboard: React.FC<HostDashboardProps> = ({
  allListings,
  currentUser,
  initialEditingListing,
  onRefresh,
}) => {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('Toluca');
  const [category, setCategory] = useState<ListingItem['category']>('Lofts');
  const [pricePerNight, setPricePerNight] = useState('1650.00');
  const [maxGuests, setMaxGuests] = useState('4');
  const [bedrooms, setBedrooms] = useState('2');
  const [bathrooms, setBathrooms] = useState('2');
  const [latitude, setLatitude] = useState('19.2826');
  const [longitude, setLongitude] = useState('-99.6557');
  const [status, setStatus] = useState<ListingStatus>('ACTIVE');
  const [photoUrl, setPhotoUrl] = useState(
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=900&q=80'
  );
  const [roleSim, setRoleSim] = useState<UserRole>(
    currentUser.role === 'GUEST' ? 'HOST' : currentUser.role
  );
  const [feedback, setFeedback] = useState<{ error: boolean; message: string } | null>(null);

  useEffect(() => {
    if (initialEditingListing) {
      loadListingIntoForm(initialEditingListing);
    }
  }, [initialEditingListing]);

  const loadListingIntoForm = (item: ListingItem) => {
    setEditingId(item.id);
    setTitle(item.title);
    setDescription(item.description || '');
    setCity(item.city);
    setCategory(item.category || 'Lofts');
    setPricePerNight(item.pricePerNight);
    setMaxGuests(String(item.maxGuests));
    setBedrooms(String(item.bedrooms || 2));
    setBathrooms(String(item.bathrooms || 2));
    setLatitude(item.latitude);
    setLongitude(item.longitude);
    setStatus(item.status || 'ACTIVE');
    setPhotoUrl(item.photoUrl);
    setFeedback(null);
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setDescription('');
    setCity('Toluca');
    setCategory('Lofts');
    setPricePerNight('1650.00');
    setMaxGuests('4');
    setBedrooms('2');
    setBathrooms('2');
    setLatitude('19.2826');
    setLongitude('-99.6557');
    setStatus('ACTIVE');
    setPhotoUrl(
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=900&q=80'
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (editingId !== null) {
      // CAMBIOS / EDICIÓN (UPDATE)
      const res = await roomiaApi.updateListing(editingId, {
        title,
        description,
        city,
        category,
        pricePerNight: Number(pricePerNight),
        maxGuests: Number(maxGuests),
        bedrooms: Number(bedrooms),
        bathrooms: Number(bathrooms),
        latitude: Number(latitude),
        longitude: Number(longitude),
        status,
        photoUrl,
      });

      if (!res.ok || !res.data) {
        setFeedback({ error: true, message: res.error || 'Error al actualizar el alojamiento.' });
        return;
      }

      setFeedback({ error: false, message: res.data.message });
      resetForm();
      onRefresh();
      return;
    }

    // ALTA DE ALOJAMIENTO (CREATE)
    const res = await roomiaApi.createListing({
      role: roleSim,
      hostId: currentUser.id,
      hostName: currentUser.name,
      title,
      description,
      category,
      city,
      latitude: Number(latitude),
      longitude: Number(longitude),
      pricePerNight: Number(pricePerNight),
      maxGuests: Number(maxGuests),
      bedrooms: Number(bedrooms),
      bathrooms: Number(bathrooms),
      photoUrl,
      photosCount: 15,
    });

    if (!res.ok || !res.data) {
      setFeedback({ error: true, message: res.error || 'Error al dar de alta el alojamiento.' });
      return;
    }

    setFeedback({
      error: false,
      message: `¡Alta exitosa! El alojamiento "${res.data.data.title}" (#${res.data.data.id}) ya está publicado en el catálogo de Roomia.`,
    });
    resetForm();
    onRefresh();
  };

  const handleSoftDelete = async (id: number) => {
    const res = await roomiaApi.softDeleteListing(id);
    if (res.ok && res.data) {
      setFeedback({ error: false, message: res.data.message });
      onRefresh();
    }
  };

  const handleRestore = async (id: number) => {
    const res = await roomiaApi.restoreListing(id);
    if (res.ok && res.data) {
      setFeedback({ error: false, message: res.data.message });
      onRefresh();
    }
  };

  const activeCount = allListings.filter((l) => l.deletedAt === null && l.status === 'ACTIVE').length;
  const inactiveCount = allListings.length - activeCount;

  return (
    <div className="space-y-8">
      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <div className="text-xs font-bold uppercase text-slate-500">Alojamientos Activos</div>
          <div className="text-3xl font-black text-emerald-600 mt-1">{activeCount}</div>
          <div className="text-xs text-slate-500 mt-1">Visibles en el catálogo tipo Airbnb</div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <div className="text-xs font-bold uppercase text-slate-500">Dados de Baja / Pausados</div>
          <div className="text-3xl font-black text-rose-600 mt-1">{inactiveCount}</div>
          <div className="text-xs text-slate-500 mt-1">Con borrado lógico (deleted_at)</div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <div className="text-xs font-bold uppercase text-slate-500">Total en Base de Datos</div>
          <div className="text-3xl font-black text-slate-900 mt-1">{allListings.length}</div>
          <div className="text-xs text-slate-500 mt-1">CRUD Completo: Altas, Bajas y Cambios</div>
        </div>
      </div>

      {/* Form: ALTA o EDICIÓN / CAMBIOS */}
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-2xl shadow-md border border-slate-200 space-y-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-rose-600">
              {editingId ? `Modo Edición — Alojamiento #${editingId}` : 'Alta de Nuevo Alojamiento'}
            </span>
            <h2 className="text-xl font-extrabold text-slate-900">
              {editingId
                ? 'Modificar Datos del Alojamiento (Cambios)'
                : 'Publicar Nuevo Alojamiento en Roomia (Altas)'}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {!editingId && (
              <select
                value={roleSim}
                onChange={(e) => setRoleSim(e.target.value as UserRole)}
                aria-label="Rol para prueba RBAC"
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-800"
              >
                <option value="HOST">Rol: Anfitrión (HOST - Permitido)</option>
                <option value="GUEST">Rol: Huésped (GUEST - Probar bloqueo 403)</option>
              </select>
            )}
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
              >
                Cancelar Edición (+ Crear Nuevo)
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label htmlFor="crud-title" className="block text-xs font-bold text-slate-700 mb-1">
              Título del Alojamiento *
            </label>
            <input
              id="crud-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. Cabaña Panorámica en el Bosque con Jacuzzi"
              required
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900"
            />
          </div>

          <div>
            <label htmlFor="crud-category" className="block text-xs font-bold text-slate-700 mb-1">
              Categoría *
            </label>
            <select
              id="crud-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as ListingItem['category'])}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900"
            >
              <option value="Cabañas">Cabañas</option>
              <option value="Lofts">Lofts</option>
              <option value="Colonial">Colonial</option>
              <option value="Alberca">Alberca</option>
              <option value="Montaña">Montaña</option>
              <option value="Urbano">Urbano</option>
            </select>
          </div>

          <div>
            <label htmlFor="crud-city" className="block text-xs font-bold text-slate-700 mb-1">
              Ciudad / Destino *
            </label>
            <input
              id="crud-city"
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900"
            />
          </div>

          <div>
            <label htmlFor="crud-price" className="block text-xs font-bold text-slate-700 mb-1">
              Precio por Noche (MXN) *
            </label>
            <input
              id="crud-price"
              type="number"
              step="0.01"
              value={pricePerNight}
              onChange={(e) => setPricePerNight(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900"
            />
          </div>

          <div>
            <label htmlFor="crud-guests" className="block text-xs font-bold text-slate-700 mb-1">
              Capacidad Máxima (Huéspedes) *
            </label>
            <input
              id="crud-guests"
              type="number"
              min={1}
              max={16}
              value={maxGuests}
              onChange={(e) => setMaxGuests(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900"
            />
          </div>

          <div>
            <label htmlFor="crud-bedrooms" className="block text-xs font-bold text-slate-700 mb-1">
              Habitaciones
            </label>
            <input
              id="crud-bedrooms"
              type="number"
              min={1}
              max={12}
              value={bedrooms}
              onChange={(e) => setBedrooms(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900"
            />
          </div>

          <div>
            <label htmlFor="crud-lat" className="block text-xs font-bold text-slate-700 mb-1">
              Latitud [-90 a 90]
            </label>
            <input
              id="crud-lat"
              type="number"
              step="0.0000001"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900"
            />
          </div>

          <div>
            <label htmlFor="crud-lng" className="block text-xs font-bold text-slate-700 mb-1">
              Longitud [-180 a 180]
            </label>
            <input
              id="crud-lng"
              type="number"
              step="0.0000001"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900"
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="crud-photo" className="block text-xs font-bold text-slate-700 mb-1">
              URL de Fotografía Principal (WebP)
            </label>
            <input
              id="crud-photo"
              type="text"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900"
            />
          </div>

          {editingId && (
            <div>
              <label htmlFor="crud-status" className="block text-xs font-bold text-slate-700 mb-1">
                Estado del Anuncio
              </label>
              <select
                id="crud-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as ListingStatus)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900"
              >
                <option value="ACTIVE">ACTIVE (Visible)</option>
                <option value="PAUSED">PAUSED (Oculto temporalmente)</option>
                <option value="DRAFT">DRAFT (Borrador)</option>
              </select>
            </div>
          )}

          <div className="md:col-span-3">
            <label htmlFor="crud-desc" className="block text-xs font-bold text-slate-700 mb-1">
              Descripción Completa del Espacio
            </label>
            <textarea
              id="crud-desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe las amenidades, vista, conectividad y experiencia del alojamiento..."
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900"
            />
          </div>
        </div>

        {feedback && (
          <div
            role="alert"
            className={`p-3.5 rounded-xl text-xs font-bold border ${
              feedback.error
                ? 'bg-rose-50 text-rose-900 border-rose-300'
                : 'bg-emerald-50 text-emerald-900 border-emerald-300'
            }`}
          >
            {feedback.message}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow transition"
          >
            {editingId
              ? '💾 Guardar Cambios del Alojamiento'
              : '+ Dar de Alta Alojamiento en Catálogo'}
          </button>
        </div>
      </form>

      {/* CRUD Management Table: Consultas, Cambios, Bajas y Reactivaciones */}
      <section className="bg-white p-6 rounded-2xl shadow-md border border-slate-200 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">
              Inventario de Alojamientos del Anfitrión (Altas, Bajas y Cambios)
            </h3>
            <p className="text-xs text-slate-500">
              Edita tarifas o detalles en tiempo real, aplica bajas lógicas (<code className="bg-slate-100 px-1 rounded">deleted_at</code>) o reactiva anuncios dados de baja.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 text-white uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3 rounded-tl-xl">ID / Foto</th>
                <th className="py-3 px-3">Alojamiento & Categoría</th>
                <th className="py-3 px-3">Ciudad</th>
                <th className="py-3 px-3">Precio / Noche</th>
                <th className="py-3 px-3">Capacidad</th>
                <th className="py-3 px-3">Estado</th>
                <th className="py-3 px-3 rounded-tr-xl text-right">Acciones CRUD</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {allListings.map((item) => {
                const isDeleted = item.deletedAt !== null;
                return (
                  <tr
                    key={item.id}
                    className={isDeleted ? 'bg-rose-50/40 text-slate-400' : 'hover:bg-slate-50'}
                  >
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <img
                          src={item.photoUrl}
                          alt={item.title}
                          className="w-12 h-9 rounded-lg object-cover border border-slate-200"
                        />
                        <span className="font-mono font-bold text-slate-700">#{item.id}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{item.title}</div>
                      <div className="text-[11px] text-slate-500">{item.category}</div>
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-700">{item.city}</td>
                    <td className="py-3 px-3 font-extrabold text-slate-900">
                      ${Number(item.pricePerNight).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                    </td>
                    <td className="py-3 px-3 text-slate-700">
                      {item.maxGuests} huéspedes · {item.bedrooms || 2} hab.
                    </td>
                    <td className="py-3 px-3">
                      {isDeleted ? (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">
                          BAJA LÓGICA
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                          {item.status}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => loadListingIntoForm(item)}
                        className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold transition"
                      >
                        ✏️ Editar
                      </button>
                      {!isDeleted ? (
                        <button
                          type="button"
                          onClick={() => handleSoftDelete(item.id)}
                          className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold transition"
                        >
                          🗑️ Dar de Baja
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleRestore(item.id)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition"
                        >
                          ♻️ Reactivar
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
