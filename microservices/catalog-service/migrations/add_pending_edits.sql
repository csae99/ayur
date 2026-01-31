-- Add pending_edits columns to items table
ALTER TABLE items ADD COLUMN IF NOT EXISTS pending_edits JSONB DEFAULT NULL;
ALTER TABLE items ADD COLUMN IF NOT EXISTS has_pending_edits BOOLEAN DEFAULT FALSE NOT NULL;
