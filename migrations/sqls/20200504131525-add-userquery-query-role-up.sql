/* User / Query / Role relationship. If the user attempts to delete
a role, we should not allow it if query / user relationships are using it */
ALTER TABLE queryuser ADD COLUMN query_role INTEGER NOT NULL REFERENCES role(id) ON DELETE RESTRICT;