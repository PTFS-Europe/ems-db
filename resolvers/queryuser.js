const pool = require('../config');
const queries = require('./queries');
const users = require('./users');

const queryuserResolvers = {
    updateMostRecentSeen: async ({ params, body }) => {
        await pool.query(
            'UPDATE queryuser SET most_recent_seen = $1 WHERE query_id=$2 AND user_id=$3 RETURNING *',
            [body.most_recent_seen, params.query_id, params.user_id]
        );
        return queryuserResolvers.calculateUnseenCount({
            query_id: params.query_id,
            user_id: params.user_id,
            mostRecentSeen: body.most_recent_seen
        });
    },
    getMostRecentSeen: ({ id }) =>
        pool.query(
            'SELECT query_id, most_recent_seen FROM queryuser WHERE user_id = $1',
            [id]
        ),
    calculateUnseenCount: async ({ query_id, user_id, mostRecentSeen }) => {
        const unseen = await pool.query(
            'SELECT count(*) AS rowcount FROM message WHERE query_id  = $1 AND creator_id != $2 AND id > $3',
            [query_id, user_id, mostRecentSeen]
        );
        return pool.query(
            'UPDATE queryuser SET unseen_count = $1 WHERE query_id = $2 AND user_id = $3 RETURNING *',
            [unseen.rows[0].rowcount, query_id, user_id]
        );
    },
    // Upsert a queryuser row
    upsertQueryUser: ({ query_id, user_id }) => {
        // This query attempts to insert a new row into queryuser, if it conflicts
        // it increments the existing row
        const sql = 'INSERT INTO queryuser VALUES ($1, $2, NOW(), NOW(), 0, 0) ON CONFLICT ON CONSTRAINT userquery_pkey DO UPDATE SET unseen_count = queryuser.unseen_count + 1 WHERE queryuser.query_id = $3 AND queryuser.user_id = $4';
        return pool.query(sql, [query_id, user_id, query_id, user_id]);
    },
    // Upsert queryuser rows for a  given query for all users except
    // the passed one
    upsertQueryUsers: async ({ query_id, creator }) => {
        // Determine who needs adding / updating. This needs to be anyone
        // who can see this query, i.e. participants & STAFF, except the sender
        const participants = await queries.participants([query_id]);
        const staff = await users.allUsers({ query: { role_code: 'STAFF' } });
        let upsertDeDup = {};
        participants.rows.forEach((pRow) => upsertDeDup[pRow.creator_id] = 1);
        staff.rows.forEach((sRow) => upsertDeDup[sRow.id] = 1);
        // Remove the sender from the list of users needing
        // creating / updating
        delete upsertDeDup[creator];
        const toUpsert = Object.keys(upsertDeDup);
        for (let i = 0; i < toUpsert.length; i++) {
            await queryuserResolvers.upsertQueryUser(
                { query_id, user_id: toUpsert[i] }
            );
        }
    },
    // Decrement the unseen count on a single query / user
    decrementUnseenCount: ({ query_id, user_id }) => {
        const sql = 'UPDATE queryuser SET unseen_count = unseen_count - 1 WHERE query_id = $1 AND user_id = $2';
        return pool.query(sql, [query_id, user_id]);
    },
    // Following the deletion of a message, decrement the unseen_count
    // of the appropriate users
    decrementMessageDelete: async ({ message }) => {
        const toDecrement = await queryuserResolvers.getUsersToDecrement({
            query_id: message.query_id,
            exclude: [message.creator_id],
            most_recent_seen: message.id
        });
        for (let i = 0; i < toDecrement.length; i++) {
            queryuserResolvers.decrementUnseenCount({
                query_id: message.query_id,
                user_id: toDecrement[i]
            });
        }
    },
    // Given a query_id and (optional) exclude list and (optional)
    // most_recent_seen value, return the IDs of users to have their
    // unseen_count decremented
    getUsersToDecrement: async ({ query_id, exclude, most_recent_seen }) => {
        // Get all users involved in this query
        const toDecrement = await queryuserResolvers.getParticipantUnseenCounts(
            { query_id }
        );
        return toDecrement.rows
            .filter(
                (toExclude) => (!exclude || exclude.length === 0) ?
                    toExclude :
                    exclude.indexOf(toExclude.user_id) === -1
            )
            .filter(
                (toRecent) => !most_recent_seen ?
                    toRecent :
                    toRecent.most_recent_seen < most_recent_seen
            )
            .map((row) => row.user_id);
    },
    // Get unseen counts for all a single user's queries
    // optionally limiting by query ID
    getUserUnseenCounts: ({ query_ids, user_id }) => {
        let optionalIn = '';
        let parameters = [];
        if (query_ids && query_ids.length > 0) {
            const placeholders = query_ids.map(
                (param, idx) => `$${idx + 1}`
            ).join(', ');
            optionalIn = `query_id IN (${placeholders}) AND`;
            parameters = [...query_ids];
        }
        parameters.push(user_id);
        return pool.query(
            `SELECT query_id, unseen_count FROM queryuser WHERE ${optionalIn} user_id = $${parameters.length}`,
            parameters
        );
    },
    // Get unseen counts for all participants of a query
    getParticipantUnseenCounts: ({ query_id }) => {
        return pool.query(
            `SELECT user_id, most_recent_seen, unseen_count FROM queryuser WHERE query_id = $1`,
            [query_id]
        );
    }
};

module.exports = queryuserResolvers;
