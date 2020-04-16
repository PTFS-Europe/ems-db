CREATE TABLE folder (
    id          SERIAL PRIMARY KEY,
    name        TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ 
);

CREATE TABLE label (
    id          SERIAL PRIMARY KEY,
    name        TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ 
);

CREATE TABLE role (
    id          SERIAL PRIMARY KEY,
    name        TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ 
);

CREATE TABLE ems_user (
    id          SERIAL PRIMARY KEY,
    name        TEXT,
    role_id     INTEGER REFERENCES role (id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ 
);

CREATE TABLE query (
    id          SERIAL PRIMARY KEY,
    title       TEXT,
    folder_id   INTEGER REFERENCES folder (id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ 
);

CREATE TABLE message (
    id          SERIAL PRIMARY KEY,
    query_id    INTEGER REFERENCES query (id) ON DELETE CASCADE,
    creator_id  INTEGER REFERENCES ems_user (id) ON DELETE CASCADE,
    content     TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ 
);

CREATE TABLE attachment (
    id          SERIAL PRIMARY KEY,
    query_id    INTEGER REFERENCES query (id) ON DELETE CASCADE,
    creator_id  INTEGER REFERENCES ems_user (id) ON DELETE CASCADE,
    filename    TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ 
);

CREATE TABLE userquery (
    query_id    INTEGER REFERENCES query (id) ON DELETE CASCADE,
    user_id     INTEGER REFERENCES ems_user (id) ON DELETE CASCADE,
    filename    TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY(query_id, user_id)
);

CREATE TABLE querylabel (
    query_id    INTEGER REFERENCES query (id) ON DELETE CASCADE,
    label_id    INTEGER REFERENCES label (id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);