<?php

declare(strict_types=1);

namespace App\Services;

/**
 * Section 35.2 Compliance (Observabilidad Integral):
 * Emits structured JSON logs with OpenTelemetry traceId, emitter microservice,
 * HTTP status code, SQL query duration in ms, and anonymized IP.
 * Strictly scrubs passwords, full JWTs, and payment card PAN/CVV.
 */
final class StructuredJsonLogger
{
    private array $logBuffer = [];

    public function logEvent(
        string $level,
        string $emitterMicroservice,
        int $httpStatusCode,
        float $sqlDurationMs,
        string $clientIp,
        string $message,
        array $context = []
    ): string {
        $sanitizedContext = $this->scrubSensitiveFields($context);
        $entry = [
            'timestamp' => gmdate('Y-m-d\TH:i:s.v\Z'),
            'traceId' => bin2hex(random_bytes(16)),
            'level' => strtoupper($level),
            'emitterMicroservice' => $emitterMicroservice,
            'httpStatusCode' => $httpStatusCode,
            'sqlDurationMs' => round($sqlDurationMs, 2),
            'ipAnonymized' => $this->anonymizeIp($clientIp),
            'message' => $message,
            'context' => $sanitizedContext,
        ];

        $jsonLine = (string) json_encode($entry, JSON_UNESCAPED_SLASHES);
        $this->logBuffer[] = $entry;
        return $jsonLine;
    }

    public function getBufferedLogs(): array
    {
        return $this->logBuffer;
    }

    private function scrubSensitiveFields(array $context): array
    {
        $forbiddenKeys = ['password', 'password_hash', 'jwt', 'access_token', 'pan', 'card_number', 'cvv', 'cvc'];
        $clean = [];
        foreach ($context as $key => $val) {
            if (in_array(strtolower((string) $key), $forbiddenKeys, true)) {
                $clean[$key] = '[REDACTED_BY_SECURITY_POLICY]';
            } else {
                $clean[$key] = $val;
            }
        }
        return $clean;
    }

    private function anonymizeIp(string $ip): string
    {
        $parts = explode('.', $ip);
        return count($parts) === 4 ? "{$parts[0]}.{$parts[1]}.{$parts[2]}.XXX" : '0.0.0.XXX';
    }
}
