import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, token, isAdmin } = useAuth();
  const location = useLocation();

  if (!token || !currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6 text-white">
        <div className="max-w-md w-full bg-zinc-900 p-8 rounded-2xl border border-rose-500/30 text-center space-y-4 shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto text-2xl font-bold font-mono">
            403
          </div>
          <h1 className="text-lg font-bold text-white">Acceso Denegado (RBAC)</h1>
          <p className="text-xs text-zinc-400 font-light leading-relaxed">
            Tu sesión actual está autenticada como <strong>{currentUser.name}</strong> con rol{' '}
            <span className="px-2 py-0.5 rounded bg-zinc-800 font-mono text-[11px] text-amber-400">
              {currentUser.role}
            </span>
            . La Consola Administrativa requiere privilegios de rol <strong>ADMIN</strong>.
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <a
              href="/login"
              className="w-full py-2.5 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs transition"
            >
              Iniciar Sesión con Cuenta Admin
            </a>
            <a
              href="http://127.0.0.1:5174"
              className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium text-xs transition"
            >
              ← Ir al Portal Público (5174)
            </a>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
