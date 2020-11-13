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
    getMessage: ({ params }) =>
        pool.query('SELECT * FROM message WHERE id = $1', [params.id]),
    upsertMessage: async ({ params, body, user }) => {
        // If we have an ID, we're updating
        if (Object.prototype.hasOwnProperty.call(params, 'id') && params.id) {
            return pool.query(
                'UPDATE message SET content = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
                [body.content, params.id]
            );
        } else {
            const newMessage = await pool.query(
                'INSERT INTO message VALUES (DEFAULT, $1, $2, $3, NOW(), NOW()) RETURNING *',
                [body.query_id, body.creator_id, body.content]
            );
            // Add / update queryuser relationships for those
            // that need it
            await queryuser.upsertQueryUsers({
                query_id: body.query_id,
                creator: user.id
            });
            return newMessage;
        }
    },
    deleteMessage: async ({ params }, message) => {
        const ret = await pool.query('DELETE FROM message WHERE id = $1', [
            params.id
        ]);
        // Decrement the unseen count as appropriate
        await queryuser.decrementMessageDelete({ message });
        return ret;
    },
    insertUpload: async ({ filename, originalName, queryId, userId }) => {
        const ret = await pool
            .query(
                'INSERT INTO message (query_id, creator_id, updated_at, filename, originalname) VALUES ($1, $2, NOW(), $3, $4) RETURNING *',
                [queryId, userId, filename, originalName]
            );
            // Add / update queryuser relationships for those
            // that need it
            await queryuser.upsertQueryUsers({
                query_id: queryId,
                creator: userId
            });
            return ret;
    }
};

module.exports = messageResolvers;
