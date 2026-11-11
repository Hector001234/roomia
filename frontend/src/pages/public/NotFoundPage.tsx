import React from 'react';
import { Link } from 'react-router-dom';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="py-24 flex flex-col items-center justify-center text-center px-6">
      <div className="w-16 h-16 rounded-3xl bg-zinc-100 border border-zinc-200/80 flex items-center justify-center text-zinc-900 font-mono text-xl font-bold mb-6">
        404
      </div>
      <h1 className="text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">
        Página no encontrada
      </h1>
      <p className="mt-3 text-xs sm:text-sm text-zinc-500 font-light max-w-md leading-relaxed">
        La ruta solicitada no existe, ha sido reubicada o requiere un portal de acceso independiente.
      </p>
      <div className="mt-8 flex items-center gap-3">
        <Link
          to="/"
          className="px-6 py-2.5 rounded-full bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold tracking-wide transition shadow-xs"
        >
          Volver a Explorar Residencias
        </Link>
        <Link
          to="/trips"
          className="px-5 py-2.5 rounded-full border border-zinc-200 hover:border-zinc-950 text-zinc-700 text-xs font-medium transition"
        >
          Mis Estancias
        </Link>
      </div>
    </div>
  );
};
