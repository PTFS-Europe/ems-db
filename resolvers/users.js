const pool = require('../config');

const encryption = require('../helpers/encryption');
const roleResolvers = require('./roles');

const userResolvers = {
    allUsers: ({ query }) => {
        let where = [];
        let placeholders = [];
        let params = [];
        // If we're supplied with some user IDs, we must use those to filter
        // our requested records
        if (query.user_ids) {
            // user_ids should be a underscore delimited string of IDs
            params = query.user_ids.split('_').map((param) => parseInt(param));
            placeholders = params.map((param, idx) => `$${idx + 1}`);
            where.push(`eu.id IN (${placeholders})`);
        }
        // If we're passed a role code we should filter on that
        if (query.role_code) {
            params.push(query.role_code);
            where.push(`r.code = $${params.length}`);
        }
        let sql =
            'SELECT eu.*, r.code AS role_code FROM ems_user eu, role r WHERE eu.role_id = r.id';
        if (where.length > 0) {
            sql += ' AND ' + where.join(' AND ');
        }
        sql += ' ORDER BY name ASC';
        return pool.query(sql, params);
    },
    allStaff: () => {
        return userResolvers.allUsers({ query: { role_code: 'STAFF' } });
    },
    getUser: ({ params }) =>
        pool.query(
            'SELECT u.*, r.code AS role_code FROM ems_user u INNER JOIN role r ON r.id = u.role_id WHERE u.id = $1',
            [params.id]
        ),
    getUserEmail: async (encrypted) => await encryption.decrypt(encrypted),
    getUserByProvider: ({ params }) =>
        pool.query(
            'SELECT * FROM ems_user WHERE provider = $1 AND provider_id = $2',
            [params.provider, params.providerId]
        ),
    upsertUser: ({ params, body }) => {
        // If we have an ID, we're updating
        if (params && params.id) {
            return pool.query(
                'UPDATE ems_user SET name = $1, email = $2, role_id = $3, provider_meta = $4, avatar = $5, updated_at = NOW() WHERE id = $6 RETURNING *',
                [
                    body.name,
                    body.email,
                    body.role_id,
                    body.provider_meta,
                    body.avatar,
                    params.id
                ]
            );
        } else {
            // Give the new user the CUSTOMER role
            return roleResolvers
                .getRoleByCode({ params: { code: 'CUSTOMER' } })
                .then((roles) => {
                    if (roles.rowCount === 1) {
                        const role = roles.rows[0].id;
                        return pool.query(
                            'INSERT INTO ems_user (id, name, email, role_id, created_at, updated_at, provider, provider_id, provider_meta, avatar) VALUES (default, $1, $2, $3, NOW(), NOW(), $4, $5, $6, $7) RETURNING *',
                            [
                                body.name,
                                body.email,
                                role,
                                body.provider,
                                body.provider_id,
                                body.provider_meta,
                                body.avatar
                            ]
                        );
                    }
                });
        }
    },
    upsertUserByProviderId: async ({
        provider,
        providerId,
        providerMeta,
        name,
        email,
        avatar
    }) => {
        // If we've been provided with an email, we need to encrypt it
        if (email) {
            email = await encryption.encrypt(email);
        }
        // Check if this user already exists
        return userResolvers
            .getUserByProvider({ params: { provider, providerId } })
            .then((result) => {
                if (result.rowCount === 1) {
                    // User exists, update them
                    const user = result.rows[0];
                    return userResolvers.upsertUser({
                        params: {
                            id: user.id
                        },
                        body: {
                            name,
                            email,
                            role_id: user.role_id,
                            provider_meta: providerMeta,
                            avatar,
                            provider_id: user.provider_id
                        }
                    });
                } else {
                    return userResolvers.upsertUser({
                        body: {
                            name,
                            email,
                            provider,
                            provider_id: providerId,
                            provider_meta: providerMeta,
                            avatar
                        }
                    });
                }
            })
            .catch((err) => err);
    },
    deleteUser: ({ params }) =>
        pool.query('DELETE FROM ems_user WHERE id = $1', [params.id])
};

module.exports = userResolvers;
