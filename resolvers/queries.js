const pool = require('../config');

const queryResolvers = {
    allQueries: ({ query }) => {
        let sql = 'SELECT * FROM query ORDER BY updated_at DESC';
        if (query.offset) {
            sql += ` OFFSET ${query.offset}`;
        }
        if (query.limit) {
            sql += ` LIMIT ${query.limit}`;
        }
        return pool.query(sql);
    },
    getQuery: ({ params }) =>
        pool.query('SELECT * FROM query WHERE id = $1', [params.id]),
    upsertQuery: ({ params, body }) => {
        // If we have an ID, we're updating
        if (params.hasOwnProperty('id') && params.id) {
            return pool.query(
                'UPDATE query SET title = $1, folder_id = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
                [body.title, body.folder_id, params.id]
            );
        } else {
            return pool.query(
                'INSERT INTO query VALUES (DEFAULT, $1, $2, NOW(), NOW()) RETURNING *',
                [body.title, body.folder_id]
            );
        }
    },
    deleteQuery: ({ params }) =>
        pool.query('DELETE FROM query WHERE id = $1', [params.id])
};

module.exports = queryResolvers;
