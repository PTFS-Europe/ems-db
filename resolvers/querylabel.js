const pool = require('../config');

const querylabelResolvers = {
    addLabelToQuery: ({ params }) =>
        pool.query(
            'INSERT INTO querylabel VALUES ($1, $2, NOW(), NOW()) RETURNING *',
            [params.query_id, params.label_id]
        ),
    removeLabelFromQuery: ({ params }) =>
        pool.query(
            'DELETE FROM querylabel WHERE query_id = $1 AND label_id = $2',
            [params.query_id, params.label_id]
        )
};

module.exports = querylabelResolvers;
