const pool = require('../config');
const queryuser = require('./queryuser');

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
    getMessage: ({ params }) => pool.query('SELECT * FROM message WHERE id = $1', [params.id]),
    upsertMessage: async ({ params, body, user }) => {
        // If we have an ID, we're updating
        if (params.hasOwnProperty('id') && params.id) {
            return pool.query(
                'UPDATE message SET content = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
                [body.content, params.id]
            );
        } else {
            const newMessage = await pool.query(
                'INSERT INTO message VALUES (DEFAULT, $1, $2, $3, NOW(), NOW()) RETURNING *',
                [body.query_id, body.creator_id, body.content]
            );
            // Increment the unseen count for those who need it
            await queryuser.incrementUnseenCounts(
                { query_id: body.query_id, creator: user.id }
            );
            return newMessage;
        }
    },
    deleteMessage: async ({ params }, message) => {
        const ret = await pool.query('DELETE FROM message WHERE id = $1', [params.id]);
        // Decrement the unseen count as appropriate
        await queryuser.decrementMessageDelete({ message })
        return ret;
    },
    insertUpload: ({ filename, originalName, queryId, userId }) =>
        pool.query(
            'INSERT INTO message (query_id, creator_id, updated_at, filename, originalname) VALUES ($1, $2, NOW(), $3, $4) RETURNING *',
            [queryId, userId, filename, originalName]
        )
};

module.exports = messageResolvers;
