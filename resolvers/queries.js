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
                'UPDATE query SET title = $1, folder_id = $2, initiator = $3, updated_at = NOW() WHERE id = $4 RETURNING *',
                [body.title, body.folder_id, body.initiator, params.id]
            );
        } else {
            return pool.query(
                'INSERT INTO query VALUES (DEFAULT, $1, $2, NOW(), NOW(), $3) RETURNING *',
                [body.title, body.folder_id, body.initiator]
            );
        }
    },
    deleteQuery: ({ params }) =>
        pool.query('DELETE FROM query WHERE id = $1', [params.id]),
    // The following functions return data that is based on a query,
    // as such they don't receive the request object from the API
    initiators: (query_ids) => {
        const placeholders = query_ids.map(
            (param, idx) => `$${idx + 1}`
        ).join(', ');
        const sql = `SELECT id, initiator FROM query WHERE id IN (${placeholders})`;
        return pool.query(sql, query_ids);
    },
    participants: (query_ids) => {
        const placeholders = query_ids.map(
            (param, idx) => `$${idx + 1}`
        ).join(', ');
        const sql = `SELECT query_id, creator_id FROM message WHERE query_id IN (${placeholders}) GROUP BY query_id, creator_id`; 
        return pool.query(sql, query_ids);
    },
    latestMessages: (query_ids) => {
        const placeholders = query_ids.map(
            (param, idx) => `$${idx + 1}`
        ).join(', ');
        const sql = `SELECT * from message WHERE id IN (SELECT MAX(id) FROM message WHERE query_id IN (${placeholders}) GROUP BY query_id)`;
        return pool.query(sql, query_ids);
    }
};

module.exports = queryResolvers;
