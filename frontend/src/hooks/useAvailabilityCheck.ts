import { useState, useCallback } from 'react';
import { ListingItem } from '../types/BookingState';

/**
 * Section 14.1 Compliance: Custom React hook prefixed with 'use' in camelCase.
 */
export function useAvailabilityCheck() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [results, setResults] = useState<ListingItem[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const checkAvailability = useCallback(async (city: string, checkIn: string, checkOut: string, guests: number): Promise<void> => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const query = new URLSearchParams({ city, check_in: checkIn, check_out: checkOut, guests: String(guests) });
      const response = await fetch(`/api/v1/listings/search?${query.toString()}`);
      const payload = (await response.json()) as { data: ListingItem[] };
      setResults(payload.data);
    } catch {
      setErrorMessage('Unable to verify availability at this time.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { isLoading, results, errorMessage, checkAvailability };
}
