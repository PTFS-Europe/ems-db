const pool = require('../config');

const labelResolvers = {
    allLabels: () => {
        const sql = 'SELECT l.*, (SELECT COUNT(*) FROM querylabel ql WHERE ql.label_id = l.id) AS count FROM label l ORDER BY name ASC';
        return pool.query(sql);
    },
    upsertLabel: ({ params, body }) => {
        // If we have an ID, we're updating
        if (params.hasOwnProperty('id') && params.id) {
            return pool.query(
                'UPDATE label SET name = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
                [body.name, params.id]
            );
        } else {
            return pool.query(
                'INSERT INTO label VALUES (DEFAULT, $1, NOW(), NOW()) RETURNING *',
                [body.name]
            );
        }
    },
    deleteLabel: ({ params }) =>
        pool.query('DELETE FROM label WHERE id = $1', [params.id])
};

module.exports = labelResolvers;
