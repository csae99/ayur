# Database Auto-Restore Setup

This project is configured to automatically restore both PostgreSQL and MongoDB databases from backups when starting fresh containers.

## How It Works

When you run `docker compose up -d --build` on a new machine (or after `docker compose down -v`), the databases will automatically restore from the backup files in the `backups/` directory.

### PostgreSQL Auto-Restore
- **Backup File**: `backups/postgres_backup_20251130_233427_utf8.sql`
- **Restores**: Users, catalog items, orders, coupons, and all other application data
- **Mechanism**: Mounted to `/docker-entrypoint-initdb.d/99_restore.sql` in the container

### MongoDB Auto-Restore
- **Status**: ⚠️ **DISABLED** - Backup file is corrupted
- **Backup File**: `backups/mongo_backup_20251130_233427.archive` (corrupted - only 1 byte)
- **Restores**: AyurBot conversation history and dosha assessments
- **Mechanism**: Mounted archive + `mongo-init.sh` script in `/docker-entrypoint-initdb.d/`
- **Action Required**: Create a new valid MongoDB backup to enable auto-restore

## Deploying to a New Machine

1. **Copy the entire project folder** to the new machine
2. **Ensure Docker & Docker Compose are installed**
3. **Run the following commands**:
   ```bash
   cd microservices
   docker compose up -d --build
   ```

That's it! The databases will automatically restore from backups.

## Creating New Backups

To update the backup files (e.g., before deploying):

```bash
# Run from microservices directory
./backup-db.sh  # Linux/Mac
./backup-db.ps1  # Windows PowerShell
```

Then update the backup filenames in `docker-compose.yml` to point to the new backup files.

## Important Notes

- Auto-restore only works on **fresh databases** (first startup or after `docker compose down -v`)
- If the database already has data, the restore scripts won't run again
- The backup files are mounted read-only, so they won't be modified during runtime
- Make sure to update backup filenames in `docker-compose.yml` after creating new backups
