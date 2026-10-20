<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\RegisterRequest;
use App\Services\AuthService;

final class AuthController
{
    public function __construct(private readonly AuthService $authService)
    {
    }

    public function register(array $requestPayload): array
    {
        $validation = RegisterRequest::validate($requestPayload);
        if (!$validation['valid']) {
            return $validation;
        }

        $user = $this->authService->registerUser(
            (string) $requestPayload['name'],
            (string) $requestPayload['email'],
            (string) ($requestPayload['password'] ?? 'DefaultStrongP@ss1!'),
            (string) ($requestPayload['role'] ?? 'GUEST')
        );

        return ['status_code' => 201, 'data' => $user];
    }

    public function login(string $email, string $password): array
    {
        return $this->authService->authenticate($email, $password);
    }
}
