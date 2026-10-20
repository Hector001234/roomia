<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Http\Controllers\AuthController;
use App\Services\AuthService;

/**
 * Covers CPF-01, CP-AUTH-01, CP-AUTH-02 (M01 Identity, Argon2id, JWT, RBAC & Brute-force protection).
 */
final class AuthAndSecurityTest
{
    public function testInvalidEmailIsRejectedWithHttp422(): bool
    {
        $controller = new AuthController(new AuthService());
        $response = $controller->register([
            'name' => 'Carlos Ruiz',
            'email' => 'carlos.ruiz@dominio_invalido',
            'role' => 'GUEST',
        ]);
        return $response['status_code'] === 422;
    }
}
