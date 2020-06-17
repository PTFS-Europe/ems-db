ALTER TABLE folder ADD COLUMN code TEXT UNIQUE;
ALTER TABLE folder ADD COLUMN position INTEGER DEFAULT 0;
ALTER TABLE query DROP COLUMN folder_id;
ALTER TABLE query ADD COLUMN folder TEXT REFERENCES folder (code) ON DELETE SET NULL;
INSERT INTO folder VALUES (default, 'Inbox', now(), now(), 'INBOX', 0);
INSERT INTO folder VALUES (default, 'All queries', now(), now(), 'ALL_QUERIES', 1);
INSERT INTO folder VALUES (default, 'Escalated', now(), now(), 'ESCALATED', 2);
INSERT INTO folder VALUES (default, 'Complete', now(), now(), 'COMPLETE', 3);
INSERT INTO folder VALUES (default, 'Bin', now(), now(), 'BIN', 4);