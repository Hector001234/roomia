<?php

declare(strict_types=1);

/**
 * RQ-SEG-001 Compliance: Mandatory Argon2id key derivation parameters.
 * Memory: 65536 KiB (64 MB), Time/Iterations: 4, Parallelism/Threads: 2.
 */
return [
    'driver' => 'argon2id',
    'argon' => [
        'memory' => (int) (getenv('ARGON2_MEMORY') ?: 65536),
        'threads' => (int) (getenv('ARGON2_THREADS') ?: 2),
        'time' => (int) (getenv('ARGON2_TIME') ?: 4),
    ],
];
