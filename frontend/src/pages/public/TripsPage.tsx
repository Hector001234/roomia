import React, { useEffect, useState } from 'react';
import { GuestTripsView } from '../../components/GuestTripsView';
import { BookingSummary } from '../../types/BookingState';
import { roomiaApi } from '../../utils/apiClient';

export const TripsPage: React.FC = () => {
  const [bookings, setBookings] = useState<BookingSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = async () => {
    setLoading(true);
    const res = await roomiaApi.fetchCatalog();
    setLoading(false);
    if (res.ok && res.data) {
      setBookings(res.data.bookings);
    }
  };

  useEffect(() => {
    void fetchBookings();
  }, []);

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="p-8 text-center text-sm font-semibold text-slate-500 animate-pulse">
          Cargando tus reservaciones y transacciones...
        </div>
      ) : (
        <GuestTripsView bookings={bookings} onRefresh={fetchBookings} />
      )}
    </div>
  );
};
