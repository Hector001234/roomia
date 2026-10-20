<?php

declare(strict_types=1);

namespace Database\Migrations;

/**
 * Data Store D5: Immutable Audit Trail (RQ-AUD-01).
 * Includes BEFORE UPDATE and BEFORE DELETE triggers blocking any tampering.
 */
final class CreateAuditLogsTable
{
    public function upSql(): string
    {
        return <<<'SQL'
CREATE TABLE audit_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    uuid CHAR(36) NOT NULL UNIQUE,
    user_id BIGINT UNSIGNED NULL,
    event_type VARCHAR(80) NOT NULL,
    entity_type VARCHAR(80) NOT NULL,
    entity_id VARCHAR(64) NOT NULL,
    ip_anonymized VARCHAR(45) NOT NULL,
    previous_state_json JSON NULL,
    new_state_json JSON NOT NULL,
    previous_hash CHAR(64) NOT NULL,
    current_hash CHAR(64) NOT NULL UNIQUE,
    created_at_utc TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_audit_event_type (event_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TRIGGER trg_audit_logs_prevent_update
BEFORE UPDATE ON audit_logs
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'SECURITY VIOLATION: audit_logs table is immutable (RQ-AUD-01)';
END;

CREATE TRIGGER trg_audit_logs_prevent_delete
BEFORE DELETE ON audit_logs
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'SECURITY VIOLATION: audit_logs records cannot be deleted (RQ-AUD-01)';
END;
SQL;
    }
}
