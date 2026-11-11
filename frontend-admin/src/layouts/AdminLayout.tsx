import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { roomiaApi } from '../utils/apiClient';

export const AdminLayout: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [chainVerified, setChainVerified] = useState(true);
  const [totalAuditLogs, setTotalAuditLogs] = useState(0);

  useEffect(() => {
    void (async () => {
      const res = await roomiaApi.fetchAuditLogs(5, 0);
      if (res.ok && res.data) {
        setChainVerified(res.data.chain_integrity_verified);
        setTotalAuditLogs(res.data.total_entries);
      }
    })();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { to: '/', label: 'Resumen Ejecutivo', end: true },
    { to: '/listings', label: 'Catálogo de Residencias' },
    { to: '/bookings', label: 'Libro de Reservaciones' },
    { to: '/users', label: 'Directorio de Identidad' },
    { to: '/audit', label: 'Bitácora Criptográfica' },
    { to: '/settings', label: 'Parámetros Financieros' },
  ];

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col md:flex-row text-zinc-900 font-sans antialiased">
      {/* Sidebar Navigation - Obsidian Minimalist */}
      <aside className="w-full md:w-64 bg-zinc-950 text-white flex flex-col justify-between p-5 shrink-0 border-r border-zinc-800/80">
        <div className="space-y-6">
          {/* Brand */}
          <div className="flex items-center gap-3 px-2 py-2 border-b border-zinc-800/80">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-center text-white font-medium text-xs tracking-widest">
              R
            </div>
            <div>
              <span className="text-sm font-semibold tracking-[0.18em] text-white block uppercase leading-tight">
                ROOMIA
              </span>
              <span className="text-[9px] font-mono tracking-wider text-zinc-400 uppercase">
                Consola Central
              </span>
            </div>
          </div>

          {/* Navigation Links without Emojis */}
          <nav aria-label="Menú del Administrador" className="space-y-1">
            {navLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition duration-150 ${
                    isActive
                      ? 'bg-zinc-900 text-white font-medium border border-zinc-800'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'
                  }`
                }
              >
                <span>{item.label}</span>
                <span className="text-zinc-600 font-mono text-[10px]">→</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="pt-6 border-t border-zinc-800/80 space-y-3">
          <a
            href="http://127.0.0.1:5174"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-full border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 text-zinc-300 text-xs font-normal transition"
          >
            <span>Ver Portal Clientes (5174) ↗</span>
          </a>

          <div className="p-3 bg-zinc-900/60 rounded-2xl border border-zinc-800/60 flex items-center justify-between gap-2">
            <div>
              <div className="text-xs font-medium text-white line-clamp-1">
                {currentUser?.name || 'Administrador'}
              </div>
              <div className="text-[9px] text-zinc-400 font-mono">
                {currentUser?.role || 'ADMIN'}
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              title="Cerrar Sesión de Administrador"
              aria-label="Cerrar Sesión de Administrador"
              className="text-zinc-400 hover:text-white text-xs px-2.5 py-1 rounded-full border border-zinc-800 bg-zinc-900 transition"
            >
              Salir
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="bg-white/90 backdrop-blur-md border-b border-zinc-200/80 px-8 py-4 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">
              Backoffice
            </span>
            <span className="text-zinc-300">/</span>
            <span className="text-xs font-semibold tracking-wide text-zinc-900 uppercase">
              Operaciones & Auditoría
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-zinc-50 px-3 py-1.5 rounded-full border border-zinc-200 text-xs font-mono text-zinc-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>PostgreSQL 16 3NF</span>
            </div>

            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-mono ${
                chainVerified
                  ? 'bg-zinc-50 text-zinc-900 border-zinc-300'
                  : 'bg-rose-50 text-rose-900 border-rose-300'
              }`}
            >
              <span>{chainVerified ? 'Cadena SHA-256 Verificada' : 'Alerta de Integridad'}</span>
              <span className="text-[10px] opacity-60">({totalAuditLogs})</span>
            </div>
          </div>
        </header>

        {/* Dynamic Admin View */}
        <main className="p-8 space-y-8 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
