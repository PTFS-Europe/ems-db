ALTER TABLE queryuser RENAME TO userquery;
ALTER TABLE queryuser RENAME CONSTRAINT queryuser_query_id_fkey TO userquery_query_id_fkey;
ALTER TABLE queryuser RENAME CONSTRAINT queryuser_user_id_fkey TO userquery_user_id_fkey;