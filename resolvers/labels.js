const pool = require('../config');
const queries = require('./queries');
const querylabel = require('./querylabel');

const labelResolvers = {
    allLabels: () => {
        const sql = 'SELECT * FROM label l ORDER BY name ASC';
        return pool.query(sql);
    },
    getLabel: ({ params }) =>
        pool.query('SELECT * FROM label WHERE id = $1', [params.id]),
    upsertLabel: ({ params, body }) => {
        // If we have an ID, we're updating
        if (Object.prototype.hasOwnProperty.call(params, 'id') && params.id) {
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
    // If we're being tested, the testing function will pass in mocked
    // versions of allLabels, allQueries & allLabelsForQueries
    // so we accept those, or fall back to the real ones if they are not passed
    // See https://github.com/magicmark/jest-how-do-i-mock-x/blob/master/src/function-in-same-module/README.md
    // for details on this DI approach
    labelCounts: async (
        { user },
        _allLabels = labelResolvers.allLabels,
        _allQueries = queries.allQueries,
        _allLabelsForQueries = querylabel.allLabelsForQueries
    ) => {
        try {
            // Fetch all the labels and all this user's queries
            const [allLabelsRes, allQueriesRes] = await Promise.all([
                _allLabels(),
                _allQueries({ query: {}, user })
            ]);
            // Now retrieve all the label associations for this user's
            // queries
            const queryLabelsResult = await _allLabelsForQueries(
                allQueriesRes.rows.map((row) => row.id)
            );
            const queryLabels = queryLabelsResult.rows;
            // Iterate each label and determine how many queries are
            // assigned to it. We're going to create an object keyed on label
            // ID, with a value of the associated query count
            const toSend = {};
            allLabelsRes.rows.forEach((label) => {
                const labelId = label.id;
                const count = queryLabels.filter(
                    (queryLabel) => queryLabel.label_id === label.id
                ).length;
                toSend[labelId] = count;
            });
            return toSend;
        } catch(err) {
            return Promise.reject(err);
        }
    }
};

module.exports = labelResolvers;
