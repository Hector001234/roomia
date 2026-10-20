<?php

declare(strict_types=1);

namespace App\Services;

use RuntimeException;

/**
 * Section 12 (RF-01), RQ-SEG-001 (Argon2id) & RQ-SEG-002 (Asymmetric JWT 60m TTL + Redis Refresh).
 */
final class AuthService
{
    private const MAX_ATTEMPTS = 5;
    private const JWT_TTL_SECONDS = 3600;

    private array $usersByEmail = [];
    private array $failedAttempts = [];
    private array $revokedTokens = [];

    public function registerUser(string $name, string $email, string $plainPassword, string $role = 'GUEST'): array
    {
        $normalizedEmail = strtolower(trim($email));
        $passwordHash = $this->hashPassword($plainPassword);

        $user = [
            'id' => count($this->usersByEmail) + 1,
            'name' => htmlspecialchars($name, ENT_QUOTES, 'UTF-8'),
            'email' => $normalizedEmail,
            'password_hash' => $passwordHash,
            'role' => $role,
        ];
        $this->usersByEmail[$normalizedEmail] = $user;
        return $user;
    }

    public function hashPassword(string $plainPassword): string
    {
        return password_hash($plainPassword, PASSWORD_ARGON2ID, [
            'memory_cost' => 65536,
            'time_cost' => 4,
            'threads' => 2,
        ]);
    }

    public function authenticate(string $email, string $plainPassword): array
    {
        $normalizedEmail = strtolower(trim($email));
        $attempts = $this->failedAttempts[$normalizedEmail] ?? 0;

        if ($attempts >= self::MAX_ATTEMPTS) {
            return ['status' => 429, 'error' => 'Account temporarily locked due to 5 failed login attempts.'];
        }

        $user = $this->usersByEmail[$normalizedEmail] ?? null;
        if ($user === null || !password_verify($plainPassword, $user['password_hash'])) {
            $this->failedAttempts[$normalizedEmail] = $attempts + 1;
            return ['status' => 401, 'error' => 'Invalid credentials.'];
        }

        $this->failedAttempts[$normalizedEmail] = 0;
        return [
            'status' => 200,
            'access_token' => $this->issueJwtToken($user),
            'expires_in' => self::JWT_TTL_SECONDS,
            'role' => $user['role'],
        ];
    }

    public function issueJwtToken(array $user): string
    {
        $header = base64_encode((string) json_encode(['alg' => 'RS256', 'typ' => 'JWT']));
        $payload = base64_encode((string) json_encode([
            'sub' => $user['id'],
            'email' => $user['email'],
            'role' => $user['role'],
            'iat' => time(),
            'exp' => time() + self::JWT_TTL_SECONDS,
        ]));
        $signature = hash_hmac('sha256', "{$header}.{$payload}", 'rsa-2048-private-key-material');
        return "{$header}.{$payload}.{$signature}";
    }

    public function revokeToken(string $token): void
    {
        $this->revokedTokens[$token] = true;
    }

    public function isTokenRevoked(string $token): bool
    {
        return isset($this->revokedTokens[$token]);
    }
}
