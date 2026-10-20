<?php

declare(strict_types=1);

namespace Database\Migrations;

/**
 * Data Store D1: Users and Credentials (3NF / InnoDB).
 * Enforces RFC 5322 unique email, Argon2id password_hash, and RBAC role ENUM.
 */
final class CreateUsersTable
{
    public function upSql(): string
    {
        return <<<'SQL'
CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    uuid CHAR(36) NOT NULL UNIQUE,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(191) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('GUEST', 'HOST', 'ADMIN') NOT NULL DEFAULT 'GUEST',
    two_factor_secret VARCHAR(255) NULL,
    failed_login_attempts TINYINT UNSIGNED NOT NULL DEFAULT 0,
    locked_until TIMESTAMP(3) NULL,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
SQL;
    }
}
