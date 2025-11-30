#!/bin/bash
# Database Backup Script for Ayurveda Platform
# Usage: ./backup-db.sh [backup_name]

BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME=${1:-"backup_${TIMESTAMP}"}

# Create backups directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "Creating PostgreSQL backup..."
docker compose exec -T postgres-db pg_dump -U user ayur_db > "${BACKUP_DIR}/${BACKUP_NAME}.sql"

if [ $? -eq 0 ]; then
    echo "✓ PostgreSQL backup created: ${BACKUP_DIR}/${BACKUP_NAME}.sql"
    
    # Compress the backup
    gzip "${BACKUP_DIR}/${BACKUP_NAME}.sql"
    echo "✓ Backup compressed: ${BACKUP_DIR}/${BACKUP_NAME}.sql.gz"
    
    # Keep only last 10 backups
    cd "$BACKUP_DIR"
    ls -t backup_*.sql.gz 2>/dev/null | tail -n +11 | xargs -r rm
    echo "✓ Old backups cleaned (keeping last 10)"
else
    echo "✗ PostgreSQL backup failed"
    exit 1
fi

echo "Creating MongoDB backup..."
docker compose exec -T mongo-db mongodump --archive > "${BACKUP_DIR}/mongo_${BACKUP_NAME}.archive"

if [ $? -eq 0 ]; then
    echo "✓ MongoDB backup created: ${BACKUP_DIR}/mongo_${BACKUP_NAME}.archive"
    
    # Compress the backup
    gzip "${BACKUP_DIR}/mongo_${BACKUP_NAME}.archive"
    echo "✓ Backup compressed: ${BACKUP_DIR}/mongo_${BACKUP_NAME}.archive.gz"
    
    # Keep only last 10 backups
    cd "$BACKUP_DIR"
    ls -t mongo_backup_*.archive.gz 2>/dev/null | tail -n +11 | xargs -r rm
    echo "✓ Old backups cleaned (keeping last 10)"
else
    echo "✗ MongoDB backup failed"
    exit 1
fi

echo ""
echo "=== Backup Complete ==="
echo "PostgreSQL: ${BACKUP_DIR}/${BACKUP_NAME}.sql.gz"
echo "MongoDB: ${BACKUP_DIR}/mongo_${BACKUP_NAME}.archive.gz"
