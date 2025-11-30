#!/bin/bash
set -e

echo "Checking for MongoDB backup archive..."
if [ -f "/backups/latest_mongo_backup.archive" ]; then
    echo "Restoring MongoDB from archive..."
    mongorestore --archive=/backups/latest_mongo_backup.archive --nsInclude="ayurbot_db.*"
    echo "MongoDB restoration complete."
else
    echo "No backup archive found at /backups/latest_mongo_backup.archive"
fi
