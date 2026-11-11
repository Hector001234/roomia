import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types/BookingState';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('SecurePass#2026');
  const [role, setRole] = useState<UserRole>('GUEST');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    const res = await register(name, email, password, role);
    setSubmitting(false);

    if (!res.ok) {
      setErrorMsg(res.error || 'Error al procesar el registro.');
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
        <h1 className="text-lg font-semibold tracking-tight text-zinc-950 pt-1">Crear Cuenta</h1>
        <p className="text-xs text-zinc-500 font-light">
          Registro seguro con credenciales encriptadas en Argon2id
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="reg-name" className="block text-xs font-normal text-zinc-600 mb-1">
            Nombre Completo
          </label>
          <input
            id="reg-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Mariana Morales"
            required
            className="w-full rounded-2xl border border-zinc-200 px-3.5 py-2.5 text-xs text-zinc-900 focus:outline-none focus:border-zinc-950 bg-zinc-50/50"
          />
        </div>

        <div>
          <label htmlFor="reg-email" className="block text-xs font-normal text-zinc-600 mb-1">
            Correo Electrónico (RFC 5322)
          </label>
          <input
            id="reg-email"
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ejemplo@dominio.com"
            required
            className="w-full rounded-2xl border border-zinc-200 px-3.5 py-2.5 text-xs text-zinc-900 focus:outline-none focus:border-zinc-950 bg-zinc-50/50"
          />
        </div>

        <div>
          <label htmlFor="reg-password" className="block text-xs font-normal text-zinc-600 mb-1">
            Contraseña (Mínimo 8 caracteres)
          </label>
          <input
            id="reg-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded-2xl border border-zinc-200 px-3.5 py-2.5 text-xs font-mono text-zinc-900 focus:outline-none focus:border-zinc-950 bg-zinc-50/50"
          />
        </div>

        <div>
          <label htmlFor="reg-role" className="block text-xs font-normal text-zinc-600 mb-1">
            Tipo de Perfil
          </label>
          <select
            id="reg-role"
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className="w-full rounded-2xl border border-zinc-200 px-3.5 py-2.5 text-xs text-zinc-900 focus:outline-none focus:border-zinc-950 bg-zinc-50/50"
          >
            <option value="GUEST">Huésped (Buscar y Reservar estancias)</option>
            <option value="HOST">Anfitrión (Publicar residencias)</option>
          </select>
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
          {submitting ? 'Creando cuenta...' : 'Registrarme'}
        </button>
      </form>

      <div className="pt-2 border-t border-zinc-100 text-center text-xs text-zinc-500">
        ¿Ya tienes cuenta?{' '}
        <Link to="/login" className="text-zinc-900 font-medium hover:underline">
          Iniciar Sesión
        </Link>
      </div>
    </div>
  );
};
