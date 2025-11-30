# Database Backup Script for Ayurveda Platform (Windows PowerShell)
# Usage: .\backup-db.ps1 [backup_name]

param(
    [string]$BackupName = "backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
)

$BACKUP_DIR = ".\backups"

# Create backups directory if it doesn't exist
if (!(Test-Path -Path $BACKUP_DIR)) {
    New-Item -ItemType Directory -Path $BACKUP_DIR | Out-Null
}

Write-Host "Creating PostgreSQL backup..." -ForegroundColor Yellow

# PostgreSQL Backup
$pgBackupFile = Join-Path $BACKUP_DIR "$BackupName.sql"
docker compose exec -T postgres-db pg_dump -U user ayur_db | Out-File -FilePath $pgBackupFile -Encoding UTF8

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ PostgreSQL backup created: $pgBackupFile" -ForegroundColor Green
    
    # Compress the backup
    Compress-Archive -Path $pgBackupFile -DestinationPath "$pgBackupFile.zip" -Force
    Remove-Item $pgBackupFile
    Write-Host "✓ Backup compressed: $pgBackupFile.zip" -ForegroundColor Green
    
    # Keep only last 10 backups
    Get-ChildItem -Path $BACKUP_DIR -Filter "backup_*.zip" | 
        Sort-Object LastWriteTime -Descending | 
        Select-Object -Skip 10 | 
        Remove-Item -Force
    Write-Host "✓ Old backups cleaned (keeping last 10)" -ForegroundColor Green
} else {
    Write-Host "✗ PostgreSQL backup failed" -ForegroundColor Red
    exit 1
}

Write-Host "`nCreating MongoDB backup..." -ForegroundColor Yellow

# MongoDB Backup
$mongoBackupFile = Join-Path $BACKUP_DIR "mongo_$BackupName.archive"
docker compose exec -T mongo-db mongodump --archive | Out-File -FilePath $mongoBackupFile -Encoding Byte

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ MongoDB backup created: $mongoBackupFile" -ForegroundColor Green
    
    # Compress the backup
    Compress-Archive -Path $mongoBackupFile -DestinationPath "$mongoBackupFile.zip" -Force
    Remove-Item $mongoBackupFile
    Write-Host "✓ Backup compressed: $mongoBackupFile.zip" -ForegroundColor Green
    
    # Keep only last 10 backups
    Get-ChildItem -Path $BACKUP_DIR -Filter "mongo_backup_*.zip" | 
        Sort-Object LastWriteTime -Descending | 
        Select-Object -Skip 10 | 
        Remove-Item -Force
    Write-Host "✓ Old backups cleaned (keeping last 10)" -ForegroundColor Green
} else {
    Write-Host "✗ MongoDB backup failed" -ForegroundColor Red
    exit 1
}

Write-Host "`n=== Backup Complete ===" -ForegroundColor Cyan
Write-Host "PostgreSQL: $pgBackupFile.zip" -ForegroundColor White
Write-Host "MongoDB: $mongoBackupFile.zip" -ForegroundColor White
