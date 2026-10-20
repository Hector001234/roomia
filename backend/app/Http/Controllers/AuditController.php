<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Middleware\RoleMiddleware;
use App\Repositories\AuditRepository;

final class AuditController
{
    public function __construct(private readonly AuditRepository $auditRepository)
    {
    }

    public function index(string $userRole): array
    {
        if (!RoleMiddleware::isAuthorized($userRole, 'GET /api/v1/audit')) {
            return ['status_code' => 403, 'error' => 'Forbidden: Audit trail restricted to ADMIN/AUDITOR.'];
        }

        return [
            'status_code' => 200,
            'chain_integrity_verified' => $this->auditRepository->verifyChainIntegrity(),
            'entries' => $this->auditRepository->getAllEntries(),
        ];
    }
}
