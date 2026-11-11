<?php

declare(strict_types=1);

namespace App\Database;

use PDO;
use PDOException;
use Throwable;

/**
 * Section 13.1, 19.3 & RQ-FUNC-01 Compliance:
 * PostgreSQL 16 PDO Connection Manager with ACID Pessimistic Locking (SELECT ... FOR UPDATE)
 * and automatic session context propagation to PL/pgSQL data auditing triggers.
 */
final class PostgresConnection
{
    private ?PDO $pdo = null;

    public function __construct(
        private readonly string $host = '127.0.0.1',
        private readonly int $port = 5432,
        private readonly string $database = 'roomia_db',
        private readonly string $username = 'roomia_app_user',
        private readonly string $password = 'local_dev_password_only'
    ) {
    }

    public function getPdo(): PDO
    {
        if ($this->pdo === null) {
            $dsn = sprintf('pgsql:host=%s;port=%d;dbname=%s', $this->host, $this->port, $this->database);
            $this->pdo = new PDO($dsn, $this->username, $this->password, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]);
        }
        return $this->pdo;
    }

    public function isConnected(): bool
    {
        try {
            $this->getPdo()->query('SELECT 1');
            return true;
        } catch (PDOException) {
            return false;
        }
    }

    /**
     * Executes an atomic PostgreSQL transaction with session variables for trg_audit_* PL/pgSQL triggers.
     */
    public function executeAtomicTransaction(
        callable $operation,
        string $microserviceEmitter = 'booking-payment-service',
        string $anonymizedIp = '192.168.1.XXX'
    ): mixed {
        $pdo = $this->getPdo();
        $pdo->beginTransaction();
        try {
            $stmtMs = $pdo->prepare("SELECT set_config('roomia.microservice', :ms, true)");
            $stmtMs->execute([':ms' => $microserviceEmitter]);

            $stmtIp = $pdo->prepare("SELECT set_config('roomia.ip_anonymized', :ip, true)");
            $stmtIp->execute([':ip' => $anonymizedIp]);

            $result = $operation($pdo);
            $pdo->commit();
            return $result;
        } catch (Throwable $exception) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw $exception;
        }
    }

    /**
     * Acquires a PostgreSQL row-level pessimistic lock (SELECT ... FOR UPDATE) on a listing and its date range.
     */
    public function lockListingDatesForUpdate(PDO $pdo, int $listingId, string $checkIn, string $checkOut): array
    {
        $stmtListing = $pdo->prepare('SELECT id, price_per_night, status FROM listings WHERE id = :id FOR UPDATE');
        $stmtListing->execute([':id' => $listingId]);

        $stmtDates = $pdo->prepare(
            "SELECT stay_date FROM booking_dates
             WHERE listing_id = :listing_id
               AND stay_date >= :check_in
               AND stay_date < :check_out
               AND lock_status = 'LOCKED'
             FOR UPDATE"
        );
        $stmtDates->execute([
            ':listing_id' => $listingId,
            ':check_in' => $checkIn,
            ':check_out' => $checkOut,
        ]);

        return $stmtDates->fetchAll();
    }
}
