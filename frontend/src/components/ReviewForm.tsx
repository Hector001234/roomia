import React, { useState } from 'react';

/**
 * Module M05 & CPF-05: Verified Stay Review Form.
 */
export const ReviewForm: React.FC = () => {
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');

  return (
    <form aria-label="Verified Stay Review Form" className="p-6 bg-white rounded-xl shadow">
      <h2 className="text-xl font-bold text-slate-900 mb-3">Calificar Estancia Verificada (M05)</h2>
      <label htmlFor="review-rating" className="block text-sm font-medium">Calificación (1 a 5 estrellas)</label>
      <input id="review-rating" type="number" min={1} max={5} value={rating} onChange={(e) => setRating(Number(e.target.value))} className="border rounded p-2 w-24" />
      <label htmlFor="review-comment" className="block text-sm font-medium mt-3">Comentario de Estancia</label>
      <textarea id="review-comment" value={comment} onChange={(e) => setComment(e.target.value)} className="w-full border rounded p-2 mt-1" rows={3} />
    </form>
  );
};
