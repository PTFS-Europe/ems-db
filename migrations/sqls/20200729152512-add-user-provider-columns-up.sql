ALTER TABLE ems_user
    ADD COLUMN provider TEXT NOT NULL DEFAULT '',
    ADD COLUMN provider_id TEXT NOT NULL DEFAULT '',
    ADD COLUMN provider_meta TEXT,
    ADD COLUMN avatar TEXT;