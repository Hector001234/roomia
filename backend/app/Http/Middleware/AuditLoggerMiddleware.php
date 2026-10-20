<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Repositories\AuditRepository;

/**
 * Section 12 (RF-06): Automatically records state-mutating operations in the immutable audit trail.
 */
final class AuditLoggerMiddleware
{
    public function __construct(private readonly AuditRepository $auditRepository)
    {
    }

    public function recordHttpTransaction(
        ?int $userId,
        string $method,
        string $uri,
        string $clientIp,
        int $statusCode
    ): array {
        return $this->auditRepository->appendLog(
            $userId,
            "HTTP_{$method}",
            'http_request',
            $uri,
            $clientIp,
            null,
            ['method' => $method, 'uri' => $uri, 'status_code' => $statusCode]
        );
    }
}
