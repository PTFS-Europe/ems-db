const pool = require('../config');

const messageResolvers = {
    allMessages: () => pool.query('SELECT * FROM messages'),
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
