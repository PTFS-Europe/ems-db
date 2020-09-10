const pool = require('../config');
const queries = require('./queries');
const querylabel = require('./querylabel');

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
        pool.query('DELETE FROM label WHERE id = $1', [params.id]),
    labelCounts: async ({ user }) => {
        // Fetch all the labels and all this user's queries
        const [allLabels, allQueries] = await Promise.all([
            labelResolvers.allLabels(),
            queries.allQueries({ query: {}, user }),
        ]);
        // Now retrieve all the label associations for this user's
        // queries
        const queryLabelsResult = await querylabel.allLabelsForQueries(
            allQueries.rows.map((row) => row.id)
        );
        const queryLabels = queryLabelsResult.rows;
        // Iterate each label and determine how many queries are
        // assigned to it. We're going to create an object keyed on label
        // ID, with a value of the associated query count
        const toSend = {};
        allLabels.rows.forEach((label) => {
            const labelId = label.id;
            const count = queryLabels.filter(
                (queryLabel) => queryLabel.label_id === label.id
            ).length;
            toSend[labelId] = count;
        });
        return toSend;
    }
};

module.exports = labelResolvers;
