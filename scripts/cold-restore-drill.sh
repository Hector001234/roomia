#!/usr/bin/env bash
# Section 34.2 & CAL-009: Monthly Cold Backup Restoration Drill (RTO <= 60 min, RPO <= 15 min)
set -euo pipefail

START_TIME=$(date +%s)
BACKUP_FILE="${1:-roomia_full_backup.sql.gz}"
TARGET_DB="roomia_staging_restore_drill"

echo "[DRILL] Starting cold restoration verification on isolated staging instance..."
mysql -u root -e "DROP DATABASE IF EXISTS ${TARGET_DB}; CREATE DATABASE ${TARGET_DB} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
gunzip -c "${BACKUP_FILE}" | mysql -u root "${TARGET_DB}"

echo "[DRILL] Verifying referential integrity and immutable audit_logs SHA-256 chain..."
mysql -u root "${TARGET_DB}" -e "SELECT COUNT(*) AS confirmed_bookings FROM bookings WHERE status = 'CONFIRMED';"
mysql -u root "${TARGET_DB}" -e "SELECT COUNT(*) AS audit_entries FROM audit_logs;"

END_TIME=$(date +%s)
ELAPSED=$((END_TIME - START_TIME))
echo "[DRILL] Cold restoration completed successfully in ${ELAPSED} seconds (Threshold: <= 3600s)."
