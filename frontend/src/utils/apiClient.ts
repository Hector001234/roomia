/**
 * Section 13.1 & RQ-SEG-002 Compliance: HTTP client injecting asymmetric Bearer JWT.
 */
export async function apiRequest<T>(endpoint: string, options: RequestInit = {}, jwtToken?: string): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  if (jwtToken) {
    headers.set('Authorization', `Bearer ${jwtToken}`);
  }
  const response = await fetch(endpoint, { ...options, headers });
  return (await response.json()) as T;
}
