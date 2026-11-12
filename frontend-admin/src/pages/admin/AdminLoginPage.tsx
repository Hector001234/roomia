import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const AdminLoginPage: React.FC = () => {
  const { login, currentUser } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    const res = await login(email, password);
    setSubmitting(false);

    if (!res.ok) {
      setErrorMsg(res.error || 'Credenciales de administrador incorrectas.');
      return;
    }

    const storedUserRaw = localStorage.getItem('roomia_auth_user');
    let role = '';
    if (storedUserRaw) {
      try {
        role = JSON.parse(storedUserRaw).role;
      } catch {
        role = '';
      }
    }

    if (role !== 'ADMIN') {
      setErrorMsg(
        `Acceso Denegado (HTTP 403 Forbidden): La cuenta ${email} tiene rol ${role || 'NO_ADMIN'}. Se requiere rol ADMIN para ingresar a la consola.`
      );
      return;
    }

    navigate('/');
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-zinc-100 font-sans antialiased">
      <div className="max-w-md w-full bg-zinc-900/90 p-8 rounded-3xl shadow-2xl border border-zinc-800 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-zinc-950 border border-zinc-700 flex items-center justify-center text-white font-mono text-sm tracking-widest mx-auto">
            R
          </div>
          <h1 className="text-lg font-semibold tracking-wide text-white uppercase pt-1">Roomia Backoffice</h1>
          <p className="text-xs text-zinc-400 font-light">
            Consola de operaciones, bitácora criptográfica y control RBAC
          </p>
        </div>

        {currentUser?.role === 'ADMIN' && (
          <div className="p-3.5 bg-zinc-800/80 border border-zinc-700 rounded-2xl text-xs text-zinc-300 font-medium flex items-center justify-between">
            <span>Sesión activa como {currentUser.name}</span>
            <Link to="/" className="px-3 py-1 bg-white text-zinc-950 rounded-full font-medium text-[11px] tracking-wide uppercase">
              Ir al Panel →
            </Link>
          </div>
        )}

        <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4">
          <div>
            <label htmlFor="admin-email" className="block text-xs font-normal text-zinc-400 mb-1">
              Correo de Administrador
            </label>
            <input
              id="admin-email"
              type="email"
              autoComplete="off"
              placeholder="admin@roomia.mx"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-2xl bg-zinc-950 border border-zinc-800 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-zinc-500 font-mono"
            />
          </div>

          <div>
            <label htmlFor="admin-password" className="block text-xs font-normal text-zinc-400 mb-1">
              Contraseña (Argon2id)
            </label>
            <input
              id="admin-password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-2xl bg-zinc-950 border border-zinc-800 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-zinc-500 font-mono"
            />
          </div>

          {errorMsg && (
            <div
              role="alert"
              className="p-3.5 rounded-2xl bg-rose-950/30 border border-rose-800/50 text-rose-300 text-xs font-normal"
            >
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-full bg-white hover:bg-zinc-200 text-zinc-950 font-medium text-xs tracking-wider uppercase shadow-xs transition disabled:opacity-50"
          >
            {submitting ? 'Verificando...' : 'Acceder al Panel'}
          </button>
        </form>
      </div>
    </div>
  );
};
