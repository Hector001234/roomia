import React, { useEffect, useState } from 'react';
import { ListingItem, ListingStatus, UserRole } from '../../types/BookingState';
import { roomiaApi } from '../../utils/apiClient';
import { exportToCSV } from '../../utils/csvExport';

export const AdminListingsPage: React.FC = () => {
  const [listings, setListings] = useState<ListingItem[]>([]);
  const [searchFilter, setSearchFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  // Modal State for Alta / Edición
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ListingItem | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState<ListingItem['category']>('Lofts');
  const [formCity, setFormCity] = useState('Toluca');
  const [formPrice, setFormPrice] = useState('1650.00');
  const [formGuests, setFormGuests] = useState('4');
  const [formBedrooms, setFormBedrooms] = useState('2');
  const [formBathrooms, setFormBathrooms] = useState('2');
  const [formLat, setFormLat] = useState('19.2826');
  const [formLng, setFormLng] = useState('-99.6557');
  const [formStatus, setFormStatus] = useState<ListingStatus>('ACTIVE');
  const [formPhoto, setFormPhoto] = useState(
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=900&q=80'
  );
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    const res = await roomiaApi.fetchCatalog(100, 0);
    setLoading(false);
    if (res.ok && res.data) {
      setListings(res.data.allListings || res.data.data);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const openCreateModal = () => {
    setEditingItem(null);
    setFormTitle('');
    setFormDescription('');
    setFormCategory('Lofts');
    setFormCity('Toluca');
    setFormPrice('1650.00');
    setFormGuests('4');
    setFormBedrooms('2');
    setFormBathrooms('2');
    setFormLat('19.2826');
    setFormLng('-99.6557');
    setFormStatus('ACTIVE');
    setFormPhoto(
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=900&q=80'
    );
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: ListingItem) => {
    setEditingItem(item);
    setFormTitle(item.title);
    setFormDescription(item.description || '');
    setFormCategory(item.category || 'Lofts');
    setFormCity(item.city);
    setFormPrice(item.pricePerNight);
    setFormGuests(String(item.maxGuests));
    setFormBedrooms(String(item.bedrooms || 2));
    setFormBathrooms(String(item.bathrooms || 2));
    setFormLat(item.latitude);
    setFormLng(item.longitude);
    setFormStatus(item.status || 'ACTIVE');
    setFormPhoto(item.photoUrl);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError(null);

    if (editingItem) {
      // UPDATE / CAMBIOS
      const res = await roomiaApi.updateListing(editingItem.id, {
        title: formTitle,
        description: formDescription,
        city: formCity,
        category: formCategory,
        pricePerNight: Number(formPrice),
        maxGuests: Number(formGuests),
        bedrooms: Number(formBedrooms),
        bathrooms: Number(formBathrooms),
        latitude: Number(formLat),
        longitude: Number(formLng),
        status: formStatus,
        photoUrl: formPhoto,
      });

      setFormSubmitting(false);
      if (!res.ok || !res.data) {
        setFormError(res.error || 'Error al actualizar el alojamiento.');
        return;
      }

      setToast(res.data.message);
      setIsModalOpen(false);
      void loadData();
    } else {
      // CREATE / ALTA
      const res = await roomiaApi.createListing({
        role: 'ADMIN' as UserRole,
        hostId: 1,
        hostName: 'Elena Rostova (Superanfitriona)',
        title: formTitle,
        description: formDescription,
        category: formCategory,
        city: formCity,
        latitude: Number(formLat),
        longitude: Number(formLng),
        pricePerNight: Number(formPrice),
        maxGuests: Number(formGuests),
        bedrooms: Number(formBedrooms),
        bathrooms: Number(formBathrooms),
        photoUrl: formPhoto,
        photosCount: 15,
      });

      setFormSubmitting(false);
      if (!res.ok || !res.data) {
        setFormError(res.error || 'Error al publicar el alojamiento.');
        return;
      }

      setToast(`Alta exitosa: "${res.data.data.title}" (#${res.data.data.id}) publicado en catálogo.`);
      setIsModalOpen(false);
      void loadData();
    }
  };

  const handleSoftDelete = async (id: number) => {
    const res = await roomiaApi.softDeleteListing(id);
    if (res.ok && res.data) {
      setToast(res.data.message);
      void loadData();
    }
  };

  const handleRestore = async (id: number) => {
    const res = await roomiaApi.restoreListing(id);
    if (res.ok && res.data) {
      setToast(res.data.message);
      void loadData();
    }
  };

  // Filter listings
  const filtered = listings.filter((item) => {
    const isDeleted = item.deletedAt !== null;
    if (statusFilter === 'ACTIVE' && (isDeleted || item.status !== 'ACTIVE')) return false;
    if (statusFilter === 'DELETED' && !isDeleted) return false;
    if (statusFilter === 'PAUSED' && item.status !== 'PAUSED') return false;

    if (categoryFilter !== 'ALL' && item.category !== categoryFilter) return false;

    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      const match =
        item.title.toLowerCase().includes(q) ||
        item.city.toLowerCase().includes(q) ||
        String(item.id).includes(q);
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toast && (
        <div
          role="status"
          className="bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-lg flex items-center justify-between text-xs font-bold"
        >
          <span>✨ {toast}</span>
          <button type="button" onClick={() => setToast(null)} className="text-slate-400 hover:text-white ml-4">
            ✕
          </button>
        </div>
      )}

      {/* Header and Alta Button */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Catálogo & Gestión de Alojamientos
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Módulo integral de Altas, Bajas Lógicas (<code className="font-mono text-rose-600">deleted_at</code>), Cambios y Reactivaciones.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              exportToCSV(
                'roomia_alojamientos',
                filtered as unknown as Record<string, unknown>[],
                [
                  { key: 'id', label: 'ID' },
                  { key: 'title', label: 'Título' },
                  { key: 'city', label: 'Ciudad' },
                  { key: 'category', label: 'Categoría' },
                  { key: 'pricePerNight', label: 'Precio_Noche_MXN' },
                  { key: 'maxGuests', label: 'Huéspedes' },
                  { key: 'status', label: 'Estado' },
                  { key: 'ratingAvg', label: 'Calificación' },
                  { key: 'reviewsCount', label: 'Reseñas' },
                  { key: 'deletedAt', label: 'Baja_Lógica' },
                ]
              )
            }
            className="px-4 py-2 rounded-full border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-800 text-xs font-normal transition"
          >
            Exportar CSV
          </button>
          <button
            type="button"
            onClick={openCreateModal}
            className="px-5 py-2 rounded-full bg-zinc-950 hover:bg-zinc-800 text-white font-medium text-xs tracking-wider uppercase shadow-xs transition"
          >
            + Nueva Residencia
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label htmlFor="filter-search" className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
            Buscar por Título, Ciudad o ID
          </label>
          <input
            id="filter-search"
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Ej. Loft, Toluca, 42..."
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>

        <div>
          <label htmlFor="filter-cat" className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
            Filtrar por Categoría
          </label>
          <select
            id="filter-cat"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
          >
            <option value="ALL">Todas las Categorías</option>
            <option value="Cabañas">Cabañas</option>
            <option value="Lofts">Lofts</option>
            <option value="Colonial">Colonial</option>
            <option value="Alberca">Alberca</option>
            <option value="Montaña">Montaña</option>
            <option value="Urbano">Urbano</option>
          </select>
        </div>

        <div>
          <label htmlFor="filter-stat" className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
            Filtrar por Estado en BD
          </label>
          <select
            id="filter-stat"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
          >
            <option value="ALL">Todos los Estados ({listings.length})</option>
            <option value="ACTIVE">Activos en Catálogo Público</option>
            <option value="DELETED">Dados de Baja (deleted_at no nulo)</option>
            <option value="PAUSED">Pausados</option>
          </select>
        </div>
      </div>

      {/* Listings Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-xs font-bold text-slate-500 animate-pulse">
            Consultando registros de la tabla PostgreSQL listings...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-xs font-semibold text-slate-500 space-y-2">
            <div>No hay alojamientos que coincidan con los criterios de búsqueda.</div>
            <button
              type="button"
              onClick={() => {
                setSearchFilter('');
                setCategoryFilter('ALL');
                setStatusFilter('ALL');
              }}
              className="text-rose-600 font-bold hover:underline"
            >
              Restablecer filtros
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white uppercase text-[11px] font-bold">
                  <th className="py-3 px-3">ID / Foto</th>
                  <th className="py-3 px-3">Título & Categoría</th>
                  <th className="py-3 px-3">Ciudad / Coordenadas</th>
                  <th className="py-3 px-3">Tarifa / Noche</th>
                  <th className="py-3 px-3">Capacidad</th>
                  <th className="py-3 px-3">Estado</th>
                  <th className="py-3 px-3 text-right">Acciones Administrativas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filtered.map((item) => {
                  const isDeleted = item.deletedAt !== null;
                  return (
                    <tr
                      key={item.id}
                      className={isDeleted ? 'bg-rose-50/40 text-slate-400' : 'hover:bg-slate-50/80'}
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
                      <td className="py-3 px-3 font-medium text-slate-700">
                        <div>{item.city}</div>
                        <div className="text-[10px] font-mono text-slate-400">
                          ({item.latitude}, {item.longitude})
                        </div>
                      </td>
                      <td className="py-3 px-3 font-extrabold text-slate-900">
                        ${Number(item.pricePerNight).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                      </td>
                      <td className="py-3 px-3 text-slate-700">
                        {item.maxGuests} huéspedes · {item.bedrooms || 2} hab.
                      </td>
                      <td className="py-3 px-3">
                        {isDeleted ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                            BAJA LÓGICA
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            {item.status}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right space-x-2 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => openEditModal(item)}
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
        )}
      </div>

      {/* Modal para ALTA o EDICIÓN */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-rose-600">
                  {editingItem ? `Alojamiento #${editingItem.id}` : 'Alta de Nuevo Registro'}
                </span>
                <h2 className="text-lg font-black text-slate-900">
                  {editingItem ? 'Modificar Datos de Alojamiento (Cambios)' : 'Publicar Alojamiento en Catálogo (Altas)'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕ Cerrar
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label htmlFor="modal-title" className="block text-xs font-bold text-slate-700 mb-1">
                    Título del Alojamiento *
                  </label>
                  <input
                    id="modal-title"
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-900"
                  />
                </div>

                <div>
                  <label htmlFor="modal-cat" className="block text-xs font-bold text-slate-700 mb-1">
                    Categoría *
                  </label>
                  <select
                    id="modal-cat"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as ListingItem['category'])}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-900"
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
                  <label htmlFor="modal-city" className="block text-xs font-bold text-slate-700 mb-1">
                    Ciudad *
                  </label>
                  <input
                    id="modal-city"
                    type="text"
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-900"
                  />
                </div>

                <div>
                  <label htmlFor="modal-price" className="block text-xs font-bold text-slate-700 mb-1">
                    Precio por Noche (MXN) *
                  </label>
                  <input
                    id="modal-price"
                    type="number"
                    step="0.01"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-900"
                  />
                </div>

                <div>
                  <label htmlFor="modal-guests" className="block text-xs font-bold text-slate-700 mb-1">
                    Capacidad Máxima (Huéspedes) *
                  </label>
                  <input
                    id="modal-guests"
                    type="number"
                    min={1}
                    max={16}
                    value={formGuests}
                    onChange={(e) => setFormGuests(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-900"
                  />
                </div>

                <div>
                  <label htmlFor="modal-lat" className="block text-xs font-bold text-slate-700 mb-1">
                    Latitud [-90 a 90] *
                  </label>
                  <input
                    id="modal-lat"
                    type="number"
                    step="0.0000001"
                    value={formLat}
                    onChange={(e) => setFormLat(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-900"
                  />
                </div>

                <div>
                  <label htmlFor="modal-lng" className="block text-xs font-bold text-slate-700 mb-1">
                    Longitud [-180 a 180] *
                  </label>
                  <input
                    id="modal-lng"
                    type="number"
                    step="0.0000001"
                    value={formLng}
                    onChange={(e) => setFormLng(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-900"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="modal-photo" className="block text-xs font-bold text-slate-700 mb-1">
                    URL de Foto Principal (WebP)
                  </label>
                  <input
                    id="modal-photo"
                    type="text"
                    value={formPhoto}
                    onChange={(e) => setFormPhoto(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="modal-desc" className="block text-xs font-bold text-slate-700 mb-1">
                    Descripción del Espacio
                  </label>
                  <textarea
                    id="modal-desc"
                    rows={2}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900"
                  />
                </div>
              </div>

              {formError && (
                <div role="alert" className="p-3 bg-rose-50 text-rose-900 border border-rose-200 rounded-xl text-xs font-bold">
                  {formError}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow"
                >
                  {formSubmitting ? 'Guardando...' : editingItem ? 'Guardar Cambios' : 'Publicar Alojamiento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
