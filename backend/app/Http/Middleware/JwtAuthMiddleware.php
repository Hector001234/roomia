<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Services\AuthService;

/**
 * Pillar 1 & RQ-SEG-002 Compliance:
 * Verifies Bearer JWT signature, expiration (60-min TTL), and revocation list before controller execution.
 */
final class JwtAuthMiddleware
{
    public function __construct(private readonly AuthService $authService)
    {
    }

    public function authenticateToken(string $authorizationHeader): array
    {
        if (!str_starts_with($authorizationHeader, 'Bearer ')) {
            return ['authenticated' => false, 'status_code' => 401, 'error' => 'Unauthorized: Missing Bearer token.'];
        }

        $token = trim(substr($authorizationHeader, 7));
        if ($token === '' || $this->authService->isTokenRevoked($token)) {
            return ['authenticated' => false, 'status_code' => 401, 'error' => 'Unauthorized: Token revoked or empty.'];
        }

        $claims = $this->authService->verifyJwtToken($token);
        if ($claims === null) {
            return ['authenticated' => false, 'status_code' => 401, 'error' => 'Unauthorized: Invalid or expired JWT.'];
        }

        return ['authenticated' => true, 'status_code' => 200, 'claims' => $claims];
    }
}
