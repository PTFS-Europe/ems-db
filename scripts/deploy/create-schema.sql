CREATE USER insert_db_user PASSWORD 'insert_db_password';
CREATE SCHEMA insert_db_schema;
GRANT CONNECT ON DATABASE ems TO insert_db_user;
GRANT ALL ON SCHEMA insert_db_schema TO insert_db_user;
GRANT ALL ON ALL TABLES IN SCHEMA insert_db_schema TO insert_db_user;
GRANT ALL ON ALL SEQUENCES IN SCHEMA insert_db_schema TO insert_db_user;
ALTER ROLE insert_db_user SET search_path TO insert_db_schema;