import React, { useState } from 'react';
import { RegisterForm } from './components/RegisterForm';
import { CreateListing } from './components/CreateListing';
import { SearchFilters } from './components/SearchFilters';
import { PropertyCard } from './components/PropertyCard';
import { Checkout } from './components/Checkout';
import { ReviewForm } from './components/ReviewForm';
import { AdminLogs } from './components/AdminLogs';
import { ListingItem } from './types/BookingState';

export const App: React.FC = () => {
  const [selectedListing, setSelectedListing] = useState<ListingItem | null>(null);

  const sampleListing: ListingItem = {
    id: 42,
    uuid: '550e8400-e29b-41d4-a716-446655440000',
    title: 'Modern Mountain Loft in Toluca',
    city: 'Toluca',
    latitude: '19.2826000',
    longitude: '-99.6557000',
    pricePerNight: '1450.00',
    maxGuests: 4,
    photoUrl: 'https://s3.us-east-1.amazonaws.com/roomia-listings-media/photo_1.webp',
    photoAlt: 'Verified property view #1 in WebP format',
  };

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-8">
      <header className="border-b pb-4">
        <h1 className="text-3xl font-extrabold text-slate-900">Roomia Platform (v3.1.0)</h1>
        <p className="text-sm text-slate-600">Clean Architecture • ISO/IEC 25010 • ISO/IEC 27001 • WCAG 2.1 AA</p>
      </header>
      <SearchFilters onSearch={() => undefined} />
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PropertyCard listing={sampleListing} onSelect={setSelectedListing} />
        <RegisterForm />
      </section>
      {selectedListing && <Checkout />}
      <CreateListing />
      <ReviewForm />
      <AdminLogs entries={[]} chainVerified={true} />
    </main>
  );
};
