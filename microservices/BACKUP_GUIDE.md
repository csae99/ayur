# Database Backup and Restore Guide

## Automatic Backups

### Create a Backup

**Windows (PowerShell):**
```powershell
.\backup-db.ps1
```

**Linux/Mac:**
```bash
chmod +x backup-db.sh
./backup-db.sh
```

**With custom name:**
```powershell
.\backup-db.ps1 -BackupName "before_sprint3"
```

### Backup Location
All backups are stored in: `./backups/`

**Files created:**
- `backup_YYYYMMDD_HHMMSS.sql.zip` - PostgreSQL backup
- `mongo_backup_YYYYMMDD_HHMMSS.archive.zip` - MongoDB backup

### Retention Policy
- Automatically keeps last 10 backups
- Older backups are deleted automatically

---

## Manual Backup (via Docker)

### PostgreSQL
```powershell
# Create backup
docker compose exec postgres-db pg_dump -U user ayur_db > backups/manual_backup.sql

# Compress
Compress-Archive backups/manual_backup.sql backups/manual_backup.sql.zip
```

### MongoDB
```powershell
# Create backup
docker compose exec mongo-db mongodump --archive > backups/mongo_manual.archive

# Compress
Compress-Archive backups/mongo_manual.archive backups/mongo_manual.archive.zip
```

---

## Restore from Backup

### PostgreSQL

**Stop services first:**
```powershell
docker compose down
```

**Restore database:**
```powershell
# Extract backup if compressed
Expand-Archive backups/backup_YYYYMMDD_HHMMSS.sql.zip -DestinationPath backups/

# Start only database
docker compose up -d postgres-db

# Wait for database to start (5-10 seconds)
Start-Sleep -Seconds 10

# Restore
Get-Content backups/backup_YYYYMMDD_HHMMSS.sql | docker compose exec -T postgres-db psql -U user -d ayur_db

# Start all services
docker compose up -d
```

### MongoDB

```powershell
# Extract backup if compressed
Expand-Archive backups/mongo_backup_YYYYMMDD_HHMMSS.archive.zip -DestinationPath backups/

# Start only database
docker compose up -d mongo-db

# Wait for database to start
Start-Sleep -Seconds 5

# Restore
Get-Content backups/mongo_backup_YYYYMMDD_HHMMSS.archive | docker compose exec -T mongo-db mongorestore --archive

# Start all services
docker compose up -d
```

---

## Scheduled Backups (Optional)

### Windows Task Scheduler

1. Open Task Scheduler
2. Create Basic Task
3. Name: "Ayurveda DB Backup"
4. Trigger: Daily at 2:00 AM
5. Action: Start a program
   - Program: `powershell.exe`
   - Arguments: `-File "C:\Path\To\ayur\microservices\backup-db.ps1"`
6. Finish

### Linux/Mac Cron

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * cd /path/to/ayur/microservices && ./backup-db.sh
```

---

## Best Practices

1. **Before Major Changes**: Always create a backup before:
   - Database migrations
   - Major updates
   - Testing new features

2. **Regular Schedule**: 
   - Daily backups for production
   - Before each deployment

3. **Off-site Storage**: 
   - Copy backups to cloud storage (Google Drive, S3, etc.)
   - Keep backups in multiple locations

4. **Test Restores**: 
   - Periodically test backup restoration
   - Verify data integrity

5. **Monitor Disk Space**:
   - Check `./backups/` folder size
   - Clean up old backups if needed

---

## Quick Commands

```powershell
# Create backup
.\backup-db.ps1

# List backups
Get-ChildItem ./backups/ | Sort-Object LastWriteTime -Descending

# Check backup size
(Get-ChildItem ./backups/*.zip | Measure-Object -Property Length -Sum).Sum / 1MB

# Remove old backups manually
Get-ChildItem ./backups/*.zip | Sort-Object LastWriteTime -Descending | Select-Object -Skip 10 | Remove-Item
```

---

## Troubleshooting

**Backup fails with "permission denied":**
- Ensure Docker containers are running: `docker compose ps`
- Check backups directory exists: `mkdir -p backups`

**Restore fails:**
- Verify backup file is not corrupted
- Check database is running: `docker compose ps postgres-db`
- Ensure database credentials match

**Out of disk space:**
- Clean old backups: Keep only essential backups
- Compress backups before archiving
