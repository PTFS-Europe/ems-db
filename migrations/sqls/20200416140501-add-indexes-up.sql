/* This index allows for more efficient ORDER BY on this column */
CREATE INDEX message_created_at_idx ON message(created_at);
CREATE INDEX query_updated_at_idx ON query(updated_at);