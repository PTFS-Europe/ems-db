const pool = require('../config');

const labelResolvers = {
    allLabels: () => {
        const sql = 'SELECT * FROM label l ORDER BY name ASC';
        return pool.query(sql);
    },
    upsertLabel: ({ params, body }) => {
        // If we have an ID, we're updating
        if (params.hasOwnProperty('id') && params.id) {
            return pool.query(
                'UPDATE label SET name = $1, colour = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
                [body.name, body.colour, params.id]
            );
        } else {
            return pool.query(
                'INSERT INTO label VALUES (DEFAULT, $1, NOW(), NOW(), $2) RETURNING *',
                [body.name, body.colour]
            );
        }
    },
    deleteLabel: ({ params }) =>
        pool.query('DELETE FROM label WHERE id = $1', [params.id])
};

module.exports = labelResolvers;
