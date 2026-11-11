<?php

declare(strict_types=1);

namespace App\Repositories;

use RuntimeException;

/**
 * Section 12 (RF-06), RQ-AUD-01 & Pillar 3 (Bounded Pagination) Compliance:
 * Append-only immutable audit log with SHA-256 hash chain and bounded retrieval.
 */
final class AuditRepository
{
    private const MAX_PAGE_SIZE = 100;
    private array $entries = [];

    public function appendLog(
        ?int $userId,
        string $eventType,
        string $entityType,
        string $entityId,
        string $clientIp,
        ?array $previousState,
        array $newState
    ): array {
        $previousHash = $this->getLastHash();
        $uuid = $this->generateUuidV4();
        $timestampUtc = gmdate('Y-m-d\TH:i:s.v\Z');
        $anonymizedIp = $this->anonymizeIp($clientIp);
        $payloadString = json_encode([$uuid, $userId, $eventType, $entityId, $timestampUtc, $previousHash, $newState]);
        $currentHash = hash('sha256', (string) $payloadString);

        $entry = [
            'id' => count($this->entries) + 1,
            'uuid' => $uuid,
            'user_id' => $userId,
            'event_type' => $eventType,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'ip_anonymized' => $anonymizedIp,
            'previous_state_json' => $previousState,
            'new_state_json' => $newState,
            'previous_hash' => $previousHash,
            'current_hash' => $currentHash,
            'created_at_utc' => $timestampUtc,
        ];
        $this->entries[] = $entry;
        return $entry;
    }

    public function updateEntry(int $id, array $changes): void
    {
        throw new RuntimeException('SQLSTATE[45000]: SECURITY VIOLATION: audit_logs table is immutable (RQ-AUD-01)');
    }

    public function deleteEntry(int $id): void
    {
        throw new RuntimeException('SQLSTATE[45000]: SECURITY VIOLATION: audit_logs records cannot be deleted (RQ-AUD-01)');
    }

    public function verifyChainIntegrity(): bool
    {
        $expectedPrev = str_repeat('0', 64);
        foreach ($this->entries as $entry) {
            if ($entry['previous_hash'] !== $expectedPrev) {
                return false;
            }
            $payload = json_encode([
                $entry['uuid'], $entry['user_id'], $entry['event_type'],
                $entry['entity_id'], $entry['created_at_utc'], $entry['previous_hash'], $entry['new_state_json'],
            ]);
            if (hash('sha256', (string) $payload) !== $entry['current_hash']) {
                return false;
            }
            $expectedPrev = $entry['current_hash'];
        }
        return true;
    }

    public function getAllEntries(int $limit = 50, int $offset = 0): array
    {
        $safeLimit = max(1, min($limit, self::MAX_PAGE_SIZE));
        $safeOffset = max(0, $offset);
        return array_slice($this->entries, $safeOffset, $safeLimit);
    }

    private function getLastHash(): string
    {
        if (empty($this->entries)) {
            return str_repeat('0', 64);
        }
        return $this->entries[count($this->entries) - 1]['current_hash'];
    }

    private function anonymizeIp(string $ip): string
    {
        $parts = explode('.', $ip);
        return count($parts) === 4 ? "{$parts[0]}.{$parts[1]}.{$parts[2]}.XXX" : '0.0.0.XXX';
    }

    private function generateUuidV4(): string
    {
        $bytes = random_bytes(16);
        $bytes[6] = chr((ord($bytes[6]) & 0x0f) | 0x40);
        $bytes[8] = chr((ord($bytes[8]) & 0x3f) | 0x80);
        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($bytes), 4));
    }
}
