import http from 'k6/http';
import { check, sleep } from 'k6';

// Section 24, Pillar 7 & CAL-005 / CAL-006: Uses __ENV.API_BASE_URL (Zero hardcoded localhost)
const API_BASE_URL = __ENV.API_BASE_URL || 'https://staging.roomia.internal';

export const options = {
  stages: [
    { duration: '2m', target: 50 },  // Nominal load: 50 concurrent virtual users
    { duration: '3m', target: 150 }, // Peak load: 150 RPS
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<=1500'],
    http_req_failed: ['rate<0.001'],
  },
};

export default function () {
  const url = `${API_BASE_URL}/api/v1/listings/search?city=Toluca&guests=2&check_in=2026-12-10&check_out=2026-12-15`;
  const res = http.get(url);

  check(res, {
    'status is 200 OK': (r) => r.status === 200,
    'payload contains data array': (r) => Array.isArray(r.json('data')),
  });

  sleep(0.5);
}
