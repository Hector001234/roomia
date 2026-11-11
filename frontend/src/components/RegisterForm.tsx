import React, { useState } from 'react';
import { PublicUserDto, UserRole } from '../types/BookingState';
import { roomiaApi } from '../utils/apiClient';

interface RegisterFormProps {
  onAuthenticated?: (user: PublicUserDto, token: string) => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onAuthenticated }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('SecurePass#2026');
  const [role, setRole] = useState<UserRole>('GUEST');
  const [loginEmail, setLoginEmail] = useState('guest.alejandro@roomia.mx');
  const [loginPassword, setLoginPassword] = useState('SecurePass#2026');
  const [feedback, setFeedback] = useState<{ error: boolean; message: string } | null>(null);
  const [jwtPreview, setJwtPreview] = useState<string | null>(null);

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    const res = await roomiaApi.registerUser({ name, email, password, role });
    if (!res.ok || !res.data) {
      setFeedback({
        error: true,
        message: res.error || 'Error HTTP 422 al validar el registro.',
      });
      return;
    }

    const dto = res.data.data;
    setJwtPreview(res.data.access_token);
    if (dto && onAuthenticated) {
      onAuthenticated(dto, res.data.access_token);
    }
    setFeedback({
      error: false,
      message: `HTTP 201 Created: Cuenta "${name}" (${role}) registrada con Argon2id (m=65536, t=4, p=2) y DTO limpio sin exposición de password_hash.`,
    });
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    const res = await roomiaApi.loginUser({ email: loginEmail, password: loginPassword });
    if (!res.ok || !res.data) {
      setFeedback({
        error: true,
        message: res.error || 'Error de autenticación.',
      });
      return;
    }
    setJwtPreview(res.data.access_token);
    if (res.data.user && onAuthenticated) {
      onAuthenticated(res.data.user, res.data.access_token);
    }
    setFeedback({
      error: false,
      message: `HTTP 200 OK: JWT emitido (TTL 3600s) para ${res.data.user?.email} con rol ${res.data.user?.role}.`,
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <form
        onSubmit={handleRegister}
        aria-label="User Registration Form"
        className="bg-white p-6 rounded-xl shadow-md border border-slate-200 space-y-4"
      >
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-lg font-bold text-slate-900">Registro de Identidad Roomia (M01)</h2>
          <p className="text-xs text-slate-500">
            Validación estricta RFC 5322 (CPF-01) y cifrado Argon2id (CP-AUTH-01)
          </p>
        </div>

        <div>
          <label htmlFor="reg-name" className="block text-xs font-bold text-slate-700 mb-1">
            Nombre Completo
          </label>
          <input
            id="reg-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Carlos Ruiz"
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="reg-email" className="block text-xs font-bold text-slate-700 mb-1">
            Correo Electrónico (RFC 5322)
          </label>
          <input
            id="reg-email"
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="carlos.ruiz@roomia.mx o correo inválido para probar 422"
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="reg-password" className="block text-xs font-bold text-slate-700 mb-1">
            Contraseña (Argon2id)
          </label>
          <input
            id="reg-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="reg-role" className="block text-xs font-bold text-slate-700 mb-1">
            Rol RBAC
          </label>
          <select
            id="reg-role"
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
          >
            <option value="GUEST">Huésped (GUEST)</option>
            <option value="HOST">Anfitrión (HOST)</option>
          </select>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold text-sm py-2.5 px-4 rounded-lg shadow transition"
        >
          Crear Cuenta con Argon2id
        </button>
      </form>

      <form
        onSubmit={handleLogin}
        aria-label="User Login and Brute Force Test Form"
        className="bg-white p-6 rounded-xl shadow-md border border-slate-200 space-y-4 flex flex-col justify-between"
      >
        <div className="space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-lg font-bold text-slate-900">Inicio de Sesión JWT & Anti-Fuerza Bruta</h2>
            <p className="text-xs text-slate-500">
              Emite JWT (TTL 60 min) y bloquea con HTTP 429 al 5to intento fallido (CP-AUTH-02)
            </p>
          </div>

          <div>
            <label htmlFor="login-email" className="block text-xs font-bold text-slate-700 mb-1">
              Correo Registrado
            </label>
            <input
              id="login-email"
              type="text"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
            />
          </div>

          <div>
            <label htmlFor="login-password" className="block text-xs font-bold text-slate-700 mb-1">
              Contraseña
            </label>
            <input
              id="login-password"
              type="text"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono text-slate-900"
            />
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={() => setLoginPassword('SecurePass#2026')}
                className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-1 rounded font-semibold"
              >
                Contraseña Correcta
              </button>
              <button
                type="button"
                onClick={() => setLoginPassword('WrongPassword')}
                className="text-xs bg-rose-50 text-rose-800 border border-rose-200 px-2 py-1 rounded font-semibold"
              >
                Probar Fallo (WrongPassword)
              </button>
            </div>
          </div>
        </div>

        {feedback && (
          <div
            role="alert"
            className={`p-3 rounded-lg text-xs font-semibold border ${
              feedback.error
                ? 'bg-rose-50 text-rose-900 border-rose-300'
                : 'bg-emerald-50 text-emerald-900 border-emerald-300'
            }`}
          >
            {feedback.message}
          </div>
        )}

        {jwtPreview && (
          <div className="p-2.5 bg-slate-900 text-emerald-400 rounded-lg font-mono text-[11px] break-all">
            Bearer {jwtPreview}
          </div>
        )}

        <button
          type="submit"
          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm py-2.5 px-4 rounded-lg shadow transition"
        >
          Autenticar y Emitir Token JWT
        </button>
      </form>
    </div>
  );
};
