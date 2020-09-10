const pool = require('../config');

const querylabelResolvers = {
    // Retrieve all the labels for a provided array of query IDs
    allLabelsForQueries: (query_ids) => {
        const placeholders = query_ids.map((id, idx) => {
            return `$${idx + 1}`;
        });
        return pool.query(
            `SELECT query_id, label_id FROM querylabel WHERE query_id IN (${placeholders})`,
            query_ids
        );
    },
    addLabelToQuery: ({ params }) =>
        pool.query(
            'INSERT INTO querylabel VALUES ($1, $2, NOW(), NOW()) ON CONFLICT DO NOTHING RETURNING *',
            [params.query_id, params.label_id]
        ),
    removeLabelFromQuery: ({ params }) =>
        pool.query(
            'DELETE FROM querylabel WHERE query_id = $1 AND label_id = $2',
            [params.query_id, params.label_id]
        )
};

module.exports = querylabelResolvers;
