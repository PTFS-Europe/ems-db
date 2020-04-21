CREATE TABLE attachment (
    id          SERIAL PRIMARY KEY,
    query_id    INTEGER REFERENCES query (id) ON DELETE CASCADE,
    creator_id  INTEGER REFERENCES ems_user (id) ON DELETE CASCADE,
    filename    TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ 
);

ALTER TABLE message DROP COLUMN filename;