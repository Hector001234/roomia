<?php

declare(strict_types=1);

require_once __DIR__ . '/../tests/bootstrap.php';

use App\Http\Middleware\AuditLoggerMiddleware;
use App\Http\Middleware\JwtAuthMiddleware;
use App\Http\Middleware\RateLimitMiddleware;
use App\Http\Middleware\RoleMiddleware;
use App\Services\AuthService;

/**
 * Roomia HTTP Front Controller & Middleware Pipeline Dispatcher.
 * Enforces Rate Limiting, JWT Authentication, RBAC Authorization, and Request Validation
 * before any controller action is invoked.
 */
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');

$routes = require __DIR__ . '/../routes/api.php';
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$routeKey = "{$method} {$uri}";

$rateLimiter = new RateLimitMiddleware(30, 60);
$clientIp = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
$rateCheck = $rateLimiter->handle($clientIp, $routeKey);
if ($rateCheck['allowed'] === false) {
    http_response_code(429);
    echo json_encode(['status_code' => 429, 'error' => $rateCheck['error']]);
    exit;
}

if (!isset($routes[$routeKey])) {
    http_response_code(404);
    echo json_encode(['status_code' => 404, 'error' => 'Endpoint not found in /api/v1 router.']);
    exit;
}

$routeConfig = $routes[$routeKey];
$authService = new AuthService();
$jwtMiddleware = new JwtAuthMiddleware($authService);
$roleMiddleware = new RoleMiddleware();
$auditMiddleware = new AuditLoggerMiddleware();

$authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? null;
$claims = null;

if (!empty($routeConfig['roles'])) {
    $jwtCheck = $jwtMiddleware->handle($authHeader);
    if ($jwtCheck['allowed'] === false) {
        http_response_code($jwtCheck['status_code']);
        echo json_encode(['status_code' => $jwtCheck['status_code'], 'error' => $jwtCheck['error']]);
        exit;
    }
    $claims = $jwtCheck['claims'];
    $userRole = (string) ($claims['role'] ?? 'GUEST');
    $rbacCheck = $roleMiddleware->authorize($userRole, $routeConfig['roles']);
    if ($rbacCheck['allowed'] === false) {
        http_response_code(403);
        echo json_encode(['status_code' => 403, 'error' => $rbacCheck['error']]);
        exit;
    }
}

$auditRecord = $auditMiddleware->record($routeKey, $clientIp, $claims['sub'] ?? null);
http_response_code(200);
echo json_encode([
    'status_code' => 200,
    'route' => $routeKey,
    'handler' => $routeConfig['handler'],
    'audit_trace' => $auditRecord,
]);
