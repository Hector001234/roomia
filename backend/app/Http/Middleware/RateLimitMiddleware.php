<?php

declare(strict_types=1);

namespace App\Http\Middleware;

/**
 * Pillar 7 & Section 18.1 Compliance:
 * Enforces rate limiting on creation and authentication routes (POST /api/v1/*).
 */
final class RateLimitMiddleware
{
    private array $requestCounters = [];

    public function checkQuota(string $clientIp, string $routeKey, int $maxRequests = 30): array
    {
        $bucket = "{$clientIp}:{$routeKey}";
        $current = $this->requestCounters[$bucket] ?? 0;

        if ($current >= $maxRequests) {
            return [
                'allowed' => false,
                'status_code' => 429,
                'error' => 'Too Many Requests: Rate limit exceeded for this endpoint.',
            ];
        }

        $this->requestCounters[$bucket] = $current + 1;
        return ['allowed' => true, 'status_code' => 200, 'remaining' => $maxRequests - ($current + 1)];
    }
}
