const pool = require('../config');

const folderResolvers = {
    allFolders: () => {
        const sql = 'SELECT f.*, (SELECT COUNT (*) FROM query q WHERE q.folder = f.code) AS count FROM folder f ORDER BY name ASC';
        return pool.query(sql);
    },
    upsertFolder: ({ params, body }) => {
        // If we have an ID, we're updating
        if (params.hasOwnProperty('id') && params.id) {
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
        pool.query('DELETE FROM folder WHERE id = $1', [params.id])
};

module.exports = folderResolvers;
