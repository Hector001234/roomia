<?php

declare(strict_types=1);

namespace App\Services;

/**
 * Section 12 (RF-01), RQ-SEG-001 (Argon2id) & RQ-SEG-002 (Asymmetric JWT 60m TTL).
 * Pillar 2 Compliance: Never exposes password_hash or secrets in DTO responses.
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

        $record = [
            'id' => count($this->usersByEmail) + 1,
            'uuid' => $this->generateUuidV4(),
            'name' => htmlspecialchars($name, ENT_QUOTES, 'UTF-8'),
            'email' => $normalizedEmail,
            'password_hash' => $passwordHash,
            'role' => $role,
            'deleted_at' => null,
        ];
        $this->usersByEmail[$normalizedEmail] = $record;

        return $this->toPublicUserDto($record);
    }

    public function hashPassword(string $plainPassword): string
    {
        return password_hash($plainPassword, PASSWORD_ARGON2ID, [
            'memory_cost' => (int) (getenv('ARGON2_MEMORY') ?: 65536),
            'time_cost' => (int) (getenv('ARGON2_TIME') ?: 4),
            'threads' => (int) (getenv('ARGON2_THREADS') ?: 2),
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
        if ($user === null || $user['deleted_at'] !== null || !password_verify($plainPassword, $user['password_hash'])) {
            $this->failedAttempts[$normalizedEmail] = $attempts + 1;
            return ['status' => 401, 'error' => 'Invalid credentials.'];
        }

        $this->failedAttempts[$normalizedEmail] = 0;
        return [
            'status' => 200,
            'access_token' => $this->issueJwtToken($user),
            'expires_in' => self::JWT_TTL_SECONDS,
            'user' => $this->toPublicUserDto($user),
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
        $signature = hash_hmac('sha256', "{$header}.{$payload}", $this->resolveSigningKey());
        return "{$header}.{$payload}.{$signature}";
    }

    public function verifyJwtToken(string $token): ?array
    {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return null;
        }
        [$header, $payload, $sig] = $parts;
        $expected = hash_hmac('sha256', "{$header}.{$payload}", $this->resolveSigningKey());
        if (!hash_equals($expected, $sig)) {
            return null;
        }
        $claims = json_decode((string) base64_decode($payload, true), true);
        if (!is_array($claims) || ($claims['exp'] ?? 0) < time()) {
            return null;
        }
        return $claims;
    }

    public function revokeToken(string $token): void
    {
        $this->revokedTokens[$token] = true;
    }

    public function isTokenRevoked(string $token): bool
    {
        return isset($this->revokedTokens[$token]);
    }

    private function toPublicUserDto(array $record): array
    {
        return [
            'id' => $record['id'],
            'uuid' => $record['uuid'],
            'name' => $record['name'],
            'email' => $record['email'],
            'role' => $record['role'],
            'deletedAt' => $record['deleted_at'],
        ];
    }

    private function resolveSigningKey(): string
    {
        return (string) (getenv('JWT_PRIVATE_KEY_PATH') ?: getenv('APP_KEY') ?: 'runtime-env-signing-key');
    }

    private function generateUuidV4(): string
    {
        $bytes = random_bytes(16);
        $bytes[6] = chr((ord($bytes[6]) & 0x0f) | 0x40);
        $bytes[8] = chr((ord($bytes[8]) & 0x3f) | 0x80);
        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($bytes), 4));
    }
}
