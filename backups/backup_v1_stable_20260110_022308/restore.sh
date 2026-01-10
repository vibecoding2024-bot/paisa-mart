#!/bin/bash
# Restore script for backup: v1_stable_20260110_022308

BACKUP_DIR="backups/backup_v1_stable_20260110_022308"

if [ ! -d "$BACKUP_DIR" ]; then
    echo "Error: Backup not found at $BACKUP_DIR"
    exit 1
fi

echo "Restoring from backup: v1_stable_20260110_022308"

# Remove current src folder and restore from backup
rm -rf src
cp -r "$BACKUP_DIR/src" ./src

# Restore package.json
cp "$BACKUP_DIR/package.json" ./package.json

# Restore README if exists
if [ -f "$BACKUP_DIR/README.md" ]; then
    cp "$BACKUP_DIR/README.md" ./README.md
fi

echo "Restore complete! Your app has been restored to v1_stable version."
