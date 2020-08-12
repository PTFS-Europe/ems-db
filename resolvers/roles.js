const pool = require('../config');

const roleResolvers = {
    allRoles: () => {
        let sql = 'SELECT * FROM role ORDER BY name ASC';
        return pool.query(sql);
    },
    getRoleByCode: ({ params }) =>
        pool.query('SELECT * FROM role WHERE code = $1', [params.code]),
    upsertRole: ({ params, body }) => {
        // If we have an ID, we're updating
        if (params.hasOwnProperty('id') && params.id) {
            return pool.query(
                'UPDATE role SET name = $1, code = $2, type = $3, updated_at = NOW() WHERE id = $4 RETURNING *',
                [body.name, body.code, body.type, params.id]
            );
        } else {
            return pool.query(
                'INSERT INTO role VALUES (DEFAULT, $1, NOW(), NOW(), $2, $3) RETURNING *',
                [body.name, body.code, body.type]
            );
        }
    },
    deleteRole: ({ params }) =>
        pool.query('DELETE FROM role WHERE id = $1', [params.id])
};

module.exports = roleResolvers;
