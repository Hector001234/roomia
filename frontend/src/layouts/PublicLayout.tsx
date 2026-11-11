import React, { useEffect, useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { GuestGuaranteeModal } from '../components/public/GuestGuaranteeModal';
import { PciSecurityModal } from '../components/public/PciSecurityModal';
import { PrivacyTermsModal } from '../components/public/PrivacyTermsModal';
import { useAuth } from '../context/AuthContext';

export const PublicLayout: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [activeFooterModal, setActiveFooterModal] = useState<'privacy' | 'pci' | 'guarantee' | null>(null);

  useEffect(() => {
    const updateFavCount = () => {
      try {
        const stored = localStorage.getItem('roomia_favorites');
        if (stored) {
          const ids = JSON.parse(stored);
          setFavoritesCount(Array.isArray(ids) ? ids.length : 0);
        } else {
          setFavoritesCount(0);
        }
      } catch {
        setFavoritesCount(0);
      }
    };

    updateFavCount();
    window.addEventListener('storage', updateFavCount);
    const interval = setInterval(updateFavCount, 1500);
    return () => {
      window.removeEventListener('storage', updateFavCount);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col justify-between text-zinc-900 font-sans antialiased selection:bg-zinc-900 selection:text-white">
      {/* Top Header */}
      <header className="bg-white/85 backdrop-blur-md border-b border-zinc-200/70 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-6">
          {/* Brand Logo - Minimalist Architectural Editorial */}
          <Link to="/" className="flex items-center gap-3 text-left focus:outline-none group">
            <div className="w-8 h-8 rounded-lg bg-zinc-950 flex items-center justify-center text-white font-medium text-sm tracking-widest shadow-xs transition-transform duration-300 group-hover:bg-zinc-800">
              R
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold tracking-[0.22em] text-zinc-950 uppercase leading-tight">
                ROOMIA
              </span>
              <span className="text-[9px] font-normal tracking-[0.16em] text-zinc-400 uppercase">
                Sanctuaries & Stays
              </span>
            </div>
          </Link>

          {/* Central Nav Links - Quiet Luxury Navigation */}
          <nav aria-label="Navegación Pública" className="hidden md:flex items-center gap-1 bg-zinc-100/80 p-1 rounded-full border border-zinc-200/60 text-xs font-medium">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `px-4 py-1.5 rounded-full transition-all duration-200 ${
                  isActive
                    ? 'bg-white text-zinc-950 shadow-xs font-semibold'
                    : 'text-zinc-600 hover:text-zinc-950'
                }`
              }
            >
              Explorar
            </NavLink>
            <NavLink
              to="/trips"
              className={({ isActive }) =>
                `px-4 py-1.5 rounded-full transition-all duration-200 ${
                  isActive
                    ? 'bg-white text-zinc-950 shadow-xs font-semibold'
                    : 'text-zinc-600 hover:text-zinc-950'
                }`
              }
            >
              Mis Estancias
            </NavLink>
            <NavLink
              to="/wishlists"
              className={({ isActive }) =>
                `px-4 py-1.5 rounded-full transition-all duration-200 flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-white text-zinc-950 shadow-xs font-semibold'
                    : 'text-zinc-600 hover:text-zinc-950'
                }`
              }
            >
              <span>Colección</span>
              {favoritesCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-zinc-900 text-white text-[9px] font-mono font-medium">
                  {favoritesCount}
                </span>
              )}
            </NavLink>
          </nav>

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            {/* Language & Currency Minimalist Pill */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full border border-zinc-200/80 text-[11px] font-medium text-zinc-600 bg-white/60">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-400"></span>
              <span>ES</span>
              <span className="text-zinc-300">/</span>
              <span>MXN $</span>
            </div>

            {currentUser ? (
              <div className="flex items-center gap-3 pl-3 border-l border-zinc-200">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-semibold text-zinc-900 line-clamp-1">
                    {currentUser.name}
                  </div>
                  <div className="text-[9px] font-mono uppercase tracking-wider text-zinc-400">
                    {currentUser.role}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={logout}
                  title="Cerrar Sesión"
                  aria-label="Cerrar Sesión"
                  className="px-3 py-1.5 rounded-full border border-zinc-200 hover:bg-zinc-100 text-zinc-700 text-xs font-medium transition duration-150"
                >
                  Salir
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 rounded-full border border-zinc-300 text-xs font-medium text-zinc-700 hover:text-zinc-950 hover:border-zinc-950 transition duration-150"
                >
                  Entrar
                </Link>
                <Link
                  to="/register"
                  className="px-3.5 py-1.5 rounded-full bg-zinc-950 text-xs font-medium text-white hover:bg-zinc-800 transition duration-150 shadow-xs"
                >
                  Registro
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Public Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        <Outlet />
      </main>

      {/* Public Footer - Natural, Cold & Architectural */}
      <footer className="bg-white border-t border-zinc-200/80 mt-20 text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold tracking-widest text-zinc-900 uppercase">ROOMIA</span>
              <span className="text-zinc-300">·</span>
              <span className="text-[11px] text-zinc-500">Arquitectura & Hospitalidad Temporal Verificada</span>
            </div>
            <p className="text-[11px] text-zinc-400 font-light">
              Garantía de integridad transaccional · ISO/IEC 25010 · Cifrado SHA-256 inmutable
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-6 text-zinc-500 text-[11px] font-normal">
            <button
              type="button"
              onClick={() => setActiveFooterModal('privacy')}
              className="hover:text-zinc-950 transition-colors"
            >
              Privacidad & Términos
            </button>
            <span className="text-zinc-300">/</span>
            <button
              type="button"
              onClick={() => setActiveFooterModal('pci')}
              className="hover:text-zinc-950 transition-colors"
            >
              Estándar PCI-DSS 4.0
            </button>
            <span className="text-zinc-300">/</span>
            <button
              type="button"
              onClick={() => setActiveFooterModal('guarantee')}
              className="hover:text-zinc-950 transition-colors"
            >
              Garantía de Huésped
            </button>
            <span className="text-zinc-300">/</span>
            <Link
              to="/legal"
              className="hover:text-zinc-950 text-zinc-800 font-semibold transition-colors flex items-center gap-1"
            >
              <span>Marco Legal & SAT</span>
              <span className="text-[10px] text-zinc-400">↗</span>
            </Link>
          </div>
        </div>
      </footer>

      {/* Footer Informational Modals */}
      <PrivacyTermsModal
        isOpen={activeFooterModal === 'privacy'}
        onClose={() => setActiveFooterModal(null)}
      />
      <PciSecurityModal
        isOpen={activeFooterModal === 'pci'}
        onClose={() => setActiveFooterModal(null)}
      />
      <GuestGuaranteeModal
        isOpen={activeFooterModal === 'guarantee'}
        onClose={() => setActiveFooterModal(null)}
      />
    </div>
  );
};
