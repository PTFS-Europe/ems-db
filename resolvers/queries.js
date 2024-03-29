const pool = require('../config');

const userResolvers = require('./users');

// We refactor this out of the resolvers object so we can reference it
// from queryResolvers.upsertQuery & queryResolvers.updateBulk
const upsertQuery = ({ params, body }) => {
    // If we have an ID, we're updating
    if (Object.prototype.hasOwnProperty.call(params, 'id') && params.id) {
        return pool.query(
            'UPDATE query SET title = $1, folder = $2, initiator = $3, updated_at = NOW() WHERE id = $4 RETURNING *',
            [body.title, body.folder, body.initiator, params.id]
        );
    } else {
        return pool.query(
            'INSERT INTO query VALUES (DEFAULT, $1, NOW(), NOW(), $2, $3) RETURNING *',
            [body.title, body.initiator, body.folder]
        );
    }
};

const queryResolvers = {
    allQueries: ({ query, user }) => {
        let sql = 'SELECT q.* FROM query q';
        let params = [];
        let where = [];
        if (query.label) {
            params.push(query.label);
            sql += ', querylabel ql';
            where.push('q.id = ql.query_id');
            where.push(`ql.label_id = $${params.length}`);
        }
        // If we're filtering based on a calculated folder
        if (
            query.folder &&
            ['ALL_QUERIES', 'UNREAD'].indexOf(query.folder) > -1
        ) {
            params.push(user.id);
            sql += ', queryuser qu';
            where.push('q.id = qu.query_id');
            where.push(`qu.user_id = $${params.length}`);
            if (query.folder === 'ALL_QUERIES') {
                where.push('qu.unseen_count = 0');
            } else {
                where.push('qu.unseen_count > 0');
            }
        }
        // If we're filtering based on a non-calculated folder
        if (
            query.folder &&
            ['ALL_QUERIES', 'UNREAD'].indexOf(query.folder) === -1
        ) {
            params.push(query.folder);
            where.push(`folder = $${params.length}`);
        }
        if (query.title) {
            params.push(query.title);
            where.push(`title ILIKE '%' || $${params.length} || '%'`);
        }
        // Only return a user's own queries if they're not STAFF
        if (user.role_code !== 'STAFF') {
            params.push(user.id);
            where.push(`initiator = $${params.length}`);
        }
        if (where.length > 0) {
            sql += ' WHERE ' + where.join(' AND ');
        }
        sql += ' ORDER BY updated_at DESC';
        if (query.offset && query.offset !== null) {
            params.push(query.offset);
            sql += ` OFFSET $${params.length}`;
        }
        if (query.limit && query.limit !== null) {
            params.push(query.limit);
            sql += ` LIMIT $${params.length}`;
        }
        return pool.query(sql, params);
    },
    getQuery: ({ params }) =>
        pool.query('SELECT * FROM query WHERE id = $1', [params.id]),
    upsertQuery,
    deleteQuery: ({ params }) =>
        pool.query('DELETE FROM query WHERE id = $1', [params.id]),
    updateBulk: ({ body }) => {
        const out = [];
        body.forEach((query) => {
            const response = upsertQuery({
                params: { id: query.id },
                body: query
            });
            out.push(response);
        });
        return out;
    },
    // The following functions return data that is based on a query,
    // as such they don't receive the request object from the API
    //
    // Associated is all users who can access the passed queries, either people
    // who are directly connected with them or staff, who can see any query.
    // Returns a promise resolving to an array of user IDs
    associated: async (query_ids) => {
        const participants = await queryResolvers.participants(query_ids);
        const initiators = await queryResolvers.initiators(query_ids);
        const allStaff = await userResolvers.allStaff();
        let deDup = {};
        participants.rows.forEach((pRow) => (deDup[pRow.creator_id] = 1));
        initiators.rows.forEach((iRow) => (deDup[iRow.initiator] = 1));
        allStaff.rows.forEach((sRow) => (deDup[sRow.id] = 1));
        return Object.keys(deDup).map((key) => parseInt(key));
    },
    initiators: (query_ids) => {
        const placeholders = query_ids
            .map((param, idx) => `$${idx + 1}`)
            .join(', ');
        const sql = `SELECT id, initiator FROM query WHERE id IN (${placeholders})`;
        return pool.query(sql, query_ids);
    },
    participants: (query_ids) => {
        const placeholders = query_ids
            .map((param, idx) => `$${idx + 1}`)
            .join(', ');
        const sql = `SELECT query_id, creator_id FROM message WHERE query_id IN (${placeholders}) GROUP BY query_id, creator_id`;
        return pool.query(sql, query_ids);
    },
    latestMessages: (query_ids) => {
        const placeholders = query_ids
            .map((param, idx) => `$${idx + 1}`)
            .join(', ');
        const sql = `SELECT * from message WHERE id IN (SELECT MAX(id) FROM message WHERE query_id IN (${placeholders}) GROUP BY query_id)`;
        return pool.query(sql, query_ids);
    },
    labels: (query_ids) => {
        const placeholders = query_ids
            .map((param, idx) => `$${idx + 1}`)
            .join(', ');
        const sql = `SELECT ql.* FROM querylabel ql INNER JOIN label l ON ql.label_id = l.id WHERE ql.query_id IN (${placeholders}) ORDER BY l.name ASC`;
        return pool.query(sql, query_ids);
    },
    // Return queries that have only been contributed to by one user
    unhandledQueries: () => {
        return pool.query(
            'SELECT * FROM query WHERE id IN (SELECT query_id FROM (SELECT query_id, creator_id FROM message GROUP BY query_id, creator_id) AS nested GROUP BY query_id HAVING COUNT(*) = 1)'
        );
    }
};

module.exports = queryResolvers;
