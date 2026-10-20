<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Http\Controllers\ReviewController;
use App\Repositories\AuditRepository;
use App\Services\ReviewService;

/**
 * Covers CPF-05, CP-REV-01, CP-AUD-01, CP-AUD-02 (M05 Verified Reviews & M06 Immutable Audit Trail).
 */
final class ReviewAndAuditTest
{
    public function testUnverifiedStayReviewReturnsHttp403Forbidden(): bool
    {
        $auditRepo = new AuditRepository();
        $controller = new ReviewController(new ReviewService($auditRepo));
        $res = $controller->store(104, 42, 5, 'Unverified stay test');
        return $res['status_code'] === 403 && $auditRepo->verifyChainIntegrity();
    }
}
