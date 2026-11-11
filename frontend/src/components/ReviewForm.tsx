import React, { useState } from 'react';
import { ReviewItem } from '../types/BookingState';
import { roomiaApi } from '../utils/apiClient';

interface ReviewFormProps {
  reviews?: ReviewItem[];
  onReviewCreated?: (review: ReviewItem) => void;
}

export const ReviewForm: React.FC<ReviewFormProps> = ({ reviews = [], onReviewCreated }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('Excelente estancia verificada, limpieza e internet impecables.');
  const [hasCompletedStay, setHasCompletedStay] = useState(true);
  const [feedback, setFeedback] = useState<{ error: boolean; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await roomiaApi.submitReview({
      guestId: 104,
      listingId: 42,
      rating,
      comment,
      forceUnverified: !hasCompletedStay,
    });

    if (!res.ok || !res.data) {
      setFeedback({
        error: true,
        message: res.error || 'Error HTTP 403 al validar estancia completada.',
      });
      return;
    }

    onReviewCreated?.(res.data.review);
    setFeedback({
      error: false,
      message: `HTTP 201 Created: Reseña verificada #${res.data.review.id} (${rating}/5 estrellas) guardada y registrada en audit_logs (CP-REV-01).`,
    });
  };

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleSubmit}
        aria-label="Verified Stay Review Form"
        className="bg-white p-6 rounded-xl shadow-md border border-slate-200 space-y-4"
      >
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-lg font-bold text-slate-900">Calificar Estancia Verificada (M05)</h2>
          <p className="text-xs text-slate-500">
            Trigger PostgreSQL <code className="bg-slate-100 px-1 rounded">trg_reviews_require_completed_stay</code> (CPF-05 / CP-REV-01)
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="review-rating" className="block text-xs font-bold text-slate-700 mb-1">
              Calificación (1 a 5 estrellas)
            </label>
            <input
              id="review-rating"
              type="number"
              min={1}
              max={5}
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
            />
          </div>

          <div className="flex items-center pt-5">
            <input
              id="sim-completed-stay"
              type="checkbox"
              checked={hasCompletedStay}
              onChange={(e) => setHasCompletedStay(e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded border-slate-300"
            />
            <label htmlFor="sim-completed-stay" className="ml-2 text-xs font-semibold text-slate-700">
              Huésped con estancia en estado <strong>COMPLETED</strong> (Desmarca para probar bloqueo HTTP 403)
            </label>
          </div>
        </div>

        <div>
          <label htmlFor="review-comment" className="block text-xs font-bold text-slate-700 mb-1">
            Comentario de Estancia (Sanitizado contra XSS)
          </label>
          <textarea
            id="review-comment"
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
          />
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

        <button
          type="submit"
          className="bg-blue-700 hover:bg-blue-800 text-white font-semibold text-sm py-2.5 px-5 rounded-lg shadow transition"
        >
          Publicar Reseña Verificada
        </button>
      </form>

      {reviews.length > 0 && (
        <section
          aria-label="Published Verified Reviews"
          className="bg-white p-6 rounded-xl shadow-md border border-slate-200 space-y-3"
        >
          <h3 className="text-base font-bold text-slate-900">
            Reseñas Verificadas Registradas ({reviews.length})
          </h3>
          <div className="space-y-3">
            {reviews.map((rev) => (
              <div
                key={rev.uuid}
                className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex items-start justify-between gap-4"
              >
                <div>
                  <span className="text-xs font-bold text-amber-600">
                    {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)} ({rev.rating}/5)
                  </span>
                  <p className="text-sm text-slate-800 mt-1">{rev.comment}</p>
                </div>
                <span className="text-[11px] font-mono text-slate-500 whitespace-nowrap">
                  Booking #{rev.bookingId}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
