import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, token, isAdmin } = useAuth();
  const location = useLocation();

  if (!token || !currentUser) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-white">
        <div className="max-w-md w-full bg-slate-800 p-8 rounded-2xl border border-rose-500/30 text-center space-y-4 shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto text-2xl font-black">
            403
          </div>
          <h1 className="text-xl font-extrabold text-white">Acceso Denegado (RBAC)</h1>
          <p className="text-sm text-slate-300">
            Tu sesión actual está autenticada como <strong>{currentUser.name}</strong> con rol{' '}
            <span className="px-2 py-0.5 rounded bg-slate-700 font-mono text-xs text-amber-400">
              {currentUser.role}
            </span>
            . El Panel de Administración requiere privilegios del rol <strong>ADMIN</strong>.
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <a
              href="/admin/login"
              className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition"
            >
              Iniciar Sesión con Cuenta de Administrador
            </a>
            <a
              href="/"
              className="w-full py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-xs transition"
            >
              ← Volver al Portal Público
            </a>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
