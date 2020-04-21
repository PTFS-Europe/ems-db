ALTER TABLE userquery RENAME TO queryuser;
ALTER TABLE queryuser RENAME CONSTRAINT userquery_query_id_fkey TO queryuser_query_id_fkey;
ALTER TABLE queryuser RENAME CONSTRAINT userquery_user_id_fkey TO queryuser_user_id_fkey;