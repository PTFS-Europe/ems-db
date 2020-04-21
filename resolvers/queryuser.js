const pool = require('../config');

const queryuserResolvers = {
    addUserToQuery: ({ body }) =>
        pool.query(
            'INSERT INTO queryuser VALUES ($1, $2, NOW(), NOW(), 0) RETURNING *',
            [body.query_id, body.user_id]
        ),
    updateMostRecentSeen: ({ body }) =>
        pool.query(
            'UPDATE queryuser SET most_recent_seen = $1 WHERE query_id=$2 AND user_id=$3 RETURNING *',
            [body.most_recent_seen, body.query_id, body.user_id]
        )
};

module.exports = queryuserResolvers;
