#!/bin/bash
# ============================================================
# convert_dump.sh
# Converts a Supabase pg_dump custom-format backup into a
# clean plain-SQL file for use with postgres:15-alpine.
#
# This script is designed to run INSIDE a postgres:17 container
# that already has a running PostgreSQL instance.
# ============================================================
set -e

INPUT_FILE="/backups/dump-postgres-202603252314.sql"
OUTPUT_FILE="/backups/postgres_backup_20260325_utf8.sql"
DB_NAME="ayur_db"

echo "=== Step 1: Creating database and stub roles ==="
psql -U postgres -c "CREATE DATABASE \"$DB_NAME\";" 2>/dev/null || true
psql -U postgres -c "CREATE ROLE \"user\" WITH LOGIN PASSWORD 'password' SUPERUSER;" 2>/dev/null || true

# Create Supabase stub roles so pg_restore doesn't fail
for role in anon authenticated service_role supabase supabase_admin supabase_auth_admin supabase_storage_admin dashboard_user pgbouncer pgsodium_keyholder pgsodium_keyiduser pgsodium_keymaker; do
    psql -U postgres -c "CREATE ROLE \"$role\" WITH NOLOGIN;" 2>/dev/null || true
done
echo "Roles created."

echo "=== Step 2: Restoring custom-format dump ==="
pg_restore -U postgres \
    --no-owner \
    --no-privileges \
    --role=postgres \
    --dbname="$DB_NAME" \
    --schema=public \
    "$INPUT_FILE" 2>&1 || echo "(Some non-fatal warnings above are expected for Supabase dumps)"

echo "=== Step 3: Exporting clean plain SQL ==="
pg_dump -U postgres \
    --no-owner \
    --no-privileges \
    --no-acl \
    --schema=public \
    --encoding=UTF8 \
    "$DB_NAME" > "$OUTPUT_FILE"

echo "=== Step 4: Verification ==="
TABLE_COUNT=$(psql -U postgres -d "$DB_NAME" -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE';")
echo "Tables in public schema: $TABLE_COUNT"
psql -U postgres -d "$DB_NAME" -c "\dt public.*"

echo ""
echo "=== Row counts ==="
for tbl in patients practitioners admins appointments availabilities orders order_items coupons addresses categories products refresh_tokens; do
    COUNT=$(psql -U postgres -d "$DB_NAME" -t -c "SELECT count(*) FROM public.\"$tbl\";" 2>/dev/null | tr -d ' ' || echo "N/A")
    printf "  %-20s %s\n" "$tbl" "$COUNT"
done

OUTPUT_SIZE=$(wc -c < "$OUTPUT_FILE")
echo ""
echo "=== DONE ==="
echo "Output: $OUTPUT_FILE ($OUTPUT_SIZE bytes)"
