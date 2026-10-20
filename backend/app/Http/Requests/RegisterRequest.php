<?php

declare(strict_types=1);

namespace App\Http\Requests;

/**
 * RQ-DAT-01 & CPF-01: Boundary validation enforcing RFC 5322 email syntax.
 */
final class RegisterRequest
{
    public static function validate(array $input): array
    {
        $errors = [];
        $name = trim((string) ($input['name'] ?? ''));
        $email = trim((string) ($input['email'] ?? ''));
        $role = (string) ($input['role'] ?? 'GUEST');

        if ($name === '' || strlen($name) > 120) {
            $errors['name'] = 'Name is required and must not exceed 120 characters.';
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL) || !preg_match('/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/', $email)) {
            $errors['email'] = 'The email field must comply with RFC 5322 syntax (CPF-01).';
        }
        if (!in_array($role, ['GUEST', 'HOST', 'ADMIN'], true)) {
            $errors['role'] = 'Invalid RBAC role specified.';
        }

        return [
            'valid' => empty($errors),
            'status_code' => empty($errors) ? 200 : 422,
            'errors' => $errors,
        ];
    }
}
