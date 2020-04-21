const pool = require('../config');

const queryuserResolvers = {
    addUserToQuery: ({ params }) =>
        pool.query(
            'INSERT INTO queryuser VALUES ($1, $2, NOW(), NOW(), 0) RETURNING *',
            [params.query_id, params.user_id]
        ),
    updateMostRecentSeen: ({ params, body }) =>
        pool.query(
            'UPDATE queryuser SET most_recent_seen = $1 WHERE query_id=$2 AND user_id=$3 RETURNING *',
            [body.most_recent_seen, params.query_id, params.user_id]
        )
};

module.exports = queryuserResolvers;
