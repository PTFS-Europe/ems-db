ALTER TABLE query ADD COLUMN initiator INTEGER REFERENCES ems_user (id) ON DELETE CASCADE;