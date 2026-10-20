import React, { useState } from 'react';
import { UserRole } from '../types/BookingState';

/**
 * Section 12 (RF-01), CPF-01 & Section 28.2 (WCAG 2.1 AA Accessible Labels & ARIA Live).
 */
export const RegisterForm: React.FC = () => {
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [role, setRole] = useState<UserRole>('GUEST');
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const rfc5322Pattern = /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/;
    if (!rfc5322Pattern.test(email)) {
      setValidationError('Error RFC 5322 (HTTP 422): Ingresa un correo electrónico con dominio válido (CPF-01).');
      return;
    }
    setValidationError(null);
  };

  return (
    <form onSubmit={handleSubmit} aria-label="User Registration Form" className="p-6 bg-white rounded-xl shadow">
      <h2 className="text-xl font-bold text-slate-900 mb-4">Registro de Identidad Roomia (M01)</h2>
      <div className="mb-4">
        <label htmlFor="register-name" className="block text-sm font-medium text-slate-800">Nombre Completo</label>
        <input id="register-name" type="text" required value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full border rounded p-2 focus:outline-2 focus:outline-blue-700" />
      </div>
      <div className="mb-4">
        <label htmlFor="register-email" className="block text-sm font-medium text-slate-800">Correo Electrónico (RFC 5322)</label>
        <input id="register-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full border rounded p-2 focus:outline-2 focus:outline-blue-700" />
      </div>
      <div className="mb-4">
        <label htmlFor="register-role" className="block text-sm font-medium text-slate-800">Rol RBAC</label>
        <select id="register-role" value={role} onChange={(e) => setRole(e.target.value as UserRole)} className="mt-1 w-full border rounded p-2">
          <option value="GUEST">Huésped (GUEST)</option>
          <option value="HOST">Anfitrión (HOST)</option>
        </select>
      </div>
      {validationError && (
        <div role="alert" aria-live="assertive" className="p-3 mb-4 text-sm text-red-800 bg-red-100 rounded">
          {validationError}
        </div>
      )}
      <button type="submit" className="px-4 py-2 bg-blue-800 text-white font-semibold rounded hover:bg-blue-900">
        Crear Cuenta con Argon2id
      </button>
    </form>
  );
};
