const pool = require('../config');

const querylabelResolvers = {
    addLabelToQuery: ({ body }) =>
        pool.query(
            'INSERT INTO querylabel VALUES ($1, $2, NOW(), NOW()) RETURNING *',
            [body.query_id, body.label_id]
        ),
    removeLabelFromQuery: ({ body }) =>
        pool.query(
            'DELETE FROM querylabel WHERE query_id = $1 AND label_id = $2',
            [body.query_id, body.label_id]
        )
};

module.exports = querylabelResolvers;
