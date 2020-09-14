const pool = require('../config');
const queries = require('./queries');
const queryuser = require('./queryuser');

const folderResolvers = {
    allFolders: () => {
        const sql = 'SELECT * FROM folder f ORDER BY name ASC';
        return pool.query(sql);
    },
    upsertFolder: ({ params, body }) => {
        // If we have an ID, we're updating
        if (Object.prototype.hasOwnProperty.call(params, 'id') && params.id) {
            return pool.query(
                'UPDATE folder SET name = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
                [body.name, params.id]
            );
        } else {
            return pool.query(
                'INSERT INTO folder VALUES (DEFAULT, $1, NOW(), NOW()) RETURNING *',
                [body.name]
            );
        }
    },
    deleteFolder: ({ params }) =>
        pool.query('DELETE FROM folder WHERE id = $1', [params.id]),
    folderCounts: async ({ user }) => {
        try {
            // Fetch all the folders and all this user's queries
            const [allFolders, allQueries] = await Promise.all([
                folderResolvers.allFolders(),
                queries.allQueries({ query: {}, user })
            ]);
            // We need an array of the user's queries
            const queryIds = allQueries.rows.map((row) => row.id);
            // Get the unseen counts for all of the user's queries
            const unseenCounts = await queryuser.getUserUnseenCounts({
                query_ids: queryIds,
                user_id: user.id
            });
            // Determine which queries have unseen messages
            const queriesWithUnseen = unseenCounts.rows.filter(
                (unseenRow) => unseenRow.unseen_count > 0
            );
            const result = {
                UNREAD: queriesWithUnseen.length,
                ALL_QUERIES: allQueries.rowCount - queriesWithUnseen.length
            };
            allFolders.rows.forEach((folder) => {
                const hasOccurences = allQueries.rows.filter(
                    (query) => query.folder === folder.code
                ).length;
                result[folder.id] = hasOccurences;
            });
            return Promise.resolve(result);
        } catch (err) {
            Promise.reject(err);
        }
    }
};

module.exports = folderResolvers;
