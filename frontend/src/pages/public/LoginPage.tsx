import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
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
      setErrorMsg(res.error || 'Credenciales inválidas.');
      return;
    }

    navigate('/');
  };

  return (
    <div className="max-w-md mx-auto my-14 bg-white p-8 rounded-3xl shadow-sm border border-zinc-200/80 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-10 h-10 rounded-xl bg-zinc-950 text-white font-medium text-sm flex items-center justify-center mx-auto tracking-widest shadow-xs">
          R
        </div>
        <h1 className="text-lg font-semibold tracking-tight text-zinc-950 pt-1">Iniciar Sesión</h1>
        <p className="text-xs text-zinc-500 font-light">
          Acceso a tu cuenta personal con credenciales seguras Argon2id
        </p>
      </div>

      <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4">
        <div>
          <label htmlFor="login-email" className="block text-xs font-normal text-zinc-600 mb-1">
            Correo Electrónico
          </label>
          <input
            id="login-email"
            type="email"
            autoComplete="off"
            placeholder="correo@ejemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-2xl border border-zinc-200 px-3.5 py-2.5 text-xs text-zinc-900 focus:outline-none focus:border-zinc-950 bg-zinc-50/50"
          />
        </div>

        <div>
          <label htmlFor="login-password" className="block text-xs font-normal text-zinc-600 mb-1">
            Contraseña
          </label>
          <input
            id="login-password"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded-2xl border border-zinc-200 px-3.5 py-2.5 text-xs font-mono text-zinc-900 focus:outline-none focus:border-zinc-950 bg-zinc-50/50"
          />
        </div>

        {errorMsg && (
          <div role="alert" className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-normal">
            {errorMsg}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 rounded-full bg-zinc-950 hover:bg-zinc-800 text-white font-medium text-xs tracking-wider uppercase shadow-xs transition duration-150 disabled:opacity-60"
        >
          {submitting ? 'Verificando...' : 'Acceder'}
        </button>
      </form>

      <div className="pt-2 border-t border-zinc-100 text-center text-xs text-zinc-500">
        <p>
          ¿No tienes cuenta?{' '}
          <Link to="/register" className="text-zinc-900 font-medium hover:underline">
            Crear cuenta de Huésped
          </Link>
        </p>
      </div>
    </div>
  );
};
