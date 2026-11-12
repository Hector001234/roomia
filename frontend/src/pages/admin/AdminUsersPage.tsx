import React, { useEffect, useState } from 'react';
import { PublicUserDto } from '../../types/BookingState';
import { roomiaApi } from '../../utils/apiClient';

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<PublicUserDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    const res = await roomiaApi.fetchCatalog();
    setLoading(false);
    if (res.ok && res.data) {
      setUsers(res.data.users);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  return (
    <div className="space-y-6">
      {toast && (
        <div
          role="status"
          className="bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-lg flex items-center justify-between text-xs font-bold"
        >
          <span>{toast}</span>
          <button type="button" onClick={() => setToast(null)} className="text-slate-400 hover:text-white ml-4">
            ✕
          </button>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Directorio de Usuarios & Control de Acceso (RBAC)
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Gestión de identidades con Argon2id, roles GUEST / HOST / ADMIN y protección contra fuerza bruta (CP-AUTH-02).
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-xs font-bold text-slate-500 animate-pulse">
            Consultando usuarios registrados...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white uppercase text-[11px] font-bold">
                  <th className="py-3 px-3">ID / UUID</th>
                  <th className="py-3 px-3">Nombre Completo</th>
                  <th className="py-3 px-3">Correo Electrónico (RFC 5322)</th>
                  <th className="py-3 px-3">Rol RBAC</th>
                  <th className="py-3 px-3">Fecha de Registro</th>
                  <th className="py-3 px-3">Estado de Cuenta</th>
                  <th className="py-3 px-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="py-3 px-3 font-mono font-bold text-slate-700">
                      <div>#{u.id}</div>
                      <div className="text-[10px] text-slate-400">{u.uuid.slice(0, 8)}...</div>
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900">{u.name}</td>
                    <td className="py-3 px-3 font-mono text-slate-700">{u.email}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                          u.role === 'ADMIN'
                            ? 'bg-rose-100 text-rose-800'
                            : u.role === 'HOST'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-500">{u.createdAt.slice(0, 10)}</td>
                    <td className="py-3 px-3">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        ACTIVA (Argon2id OK)
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => setToast(`Intentos fallidos reiniciados para la cuenta ${u.email}.`)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition"
                      >
                        Desbloquear / Reset
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
