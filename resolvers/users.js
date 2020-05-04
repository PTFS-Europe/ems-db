const pool = require('../config');

const userResolvers = {
    allUsers: ({ query }) => {
        let params = [];
        let sql = 'SELECT * FROM ems_user';
        // If we're supplied with some user IDs, we must use those to filter
        // our requested records
        if (query.user_ids) {
            // user_ids should be a underscore delimited string of IDs
            params = query.user_ids.split('_').map(param => parseInt(param));
            sql += ' WHERE id IN (' +
                params.map((param, idx) => `$${idx + 1}`).join(', ') +
            ')';
        }
        sql += ' ORDER BY name ASC';
        return pool.query(sql, params);
    },
    getUser: ({ params }) =>
        pool.query('SELECT * FROM ems_user WHERE id = $1', [params.id]),
    upsertUser: ({ params, body }) => {
        // If we have an ID, we're updating
        if (params.hasOwnProperty('id') && params.id) {
            return pool.query(
                'UPDATE ems_user SET name = $1, role_id = $2, updated_at = NOW() WHERE id = $2 RETURNING *',
                [body.name, body.role_id, params.id]
            );
        } else {
            return pool.query(
                'INSERT INTO ems_user VALUES (DEFAULT, $1, $2, NOW(), NOW()) RETURNING *',
                [body.name, body.role_id]
            );
        }
    },
    deleteUser: ({ params }) =>
        pool.query('DELETE FROM ems_user WHERE id = $1', [params.id])
};

module.exports = userResolvers;
