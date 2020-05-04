const pool = require('../config');

const messageResolvers = {
    allMessages: ({ query }) => {
        let params = [];
        let sql = 'SELECT * FROM message';
        if (query.query_id) {
            params.push(query.query_id);
            sql += ` WHERE query_id = $${params.length}`;
        }
        sql += ' ORDER BY created_at ASC';
        if (query.offset) {
            params.push(query.offset);
            sql += ` OFFSET $${params.length}`;
        }
        if (query.limit) {
            params.push(query.limit);
            sql += ` LIMIT $${params.length}`;
        }
        return pool.query(sql, params);
    },
    upsertMessage: ({ params, body }) => {
        // If we have an ID, we're updating
        if (params.hasOwnProperty('id') && params.id) {
            return pool.query(
                'UPDATE message SET content = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
                [body.content, params.id]
            );
        } else {
            return pool.query(
                'INSERT INTO message VALUES (DEFAULT, $1, $2, $3, NOW(), NOW()) RETURNING *',
                [body.query_id, body.creator_id, body.content]
            );
        }
    },
    deleteMessage: ({ params }) =>
        pool.query('DELETE FROM message WHERE id = $1', [params.id])
};

module.exports = messageResolvers;
