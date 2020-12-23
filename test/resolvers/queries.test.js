// The thing we're testing
const queries = require('../../resolvers/queries');

// The module that queries.js depends on (which we're about to mock)
const pool = require('../../config');

// Mock pool
jest.mock('../../config', () => ({
    // A mock query function
    query: jest.fn(() => {
        new Promise((resolve) => {
            return resolve(true);
        });
    })
}));

describe('Queries', () => {
    beforeEach(() => jest.clearAllMocks());
    describe('allQueries', () => {
        it('should be called', (done) => {
            queries.allQueries({ query: {}, user: {} });
            expect(pool.query).toHaveBeenCalled();
            done();
        });
        it('should be passed correct SQL', (done) => {
            queries.allQueries({ query: {}, user: { id: 1, role_code: 'CUSTOMER'} });
            expect(pool.query).toBeCalledWith(
                'SELECT q.* FROM query q WHERE initiator = $1 ORDER BY updated_at DESC',
                [1]
            );
            done();
        });
        // Pass title, offset, limit, calculated folder and label parameters
        it('should be passed correct SQL including parameters', (done) => {
            queries.allQueries({
                query: {
                    title: 'The Clone Wars',
                    offset: 20,
                    limit: 10,
                    folder: 'ESCALATED',
                    label: 1
                },
                user: {id: 2, role_code: 'CUSTOMER'}
            });
            expect(
                pool.query
            ).toBeCalledWith(
                'SELECT q.* FROM query q, querylabel ql WHERE q.id = ql.query_id AND ql.label_id = $1 AND folder = $2 AND title ILIKE \'%\' || $3 || \'%\' AND initiator = $4 ORDER BY updated_at DESC OFFSET $5 LIMIT $6',
                [1, 'ESCALATED', 'The Clone Wars', 2, 20, 10]
            );
            done();
        });
        // Pass ALL_QUERIES folder parameter
        it('should be passed correct SQL (ALL_QUERIES)', (done) => {
            queries.allQueries({
                query: {
                    title: 'The Clone Wars',
                    folder: 'ALL_QUERIES'
                },
                user: {id: 2, role_code: 'CUSTOMER'}
            });
            expect(
                pool.query
            ).toBeCalledWith(
                'SELECT q.* FROM query q, queryuser qu WHERE q.id = qu.query_id AND qu.user_id = $1 AND qu.unseen_count = 0 AND title ILIKE \'%\' || $2 || \'%\' AND initiator = $3 ORDER BY updated_at DESC',
                [2, 'The Clone Wars', 2]
            );
            done();
        });
        // Pass UNREAD folder parameter
        it('should be passed correct SQL (UNREAD)', (done) => {
            queries.allQueries({
                query: {
                    title: 'The Clone Wars',
                    folder: 'UNREAD'
                },
                user: {id: 2, role_code: 'CUSTOMER'}
            });
            expect(
                pool.query
            ).toBeCalledWith(
                'SELECT q.* FROM query q, queryuser qu WHERE q.id = qu.query_id AND qu.user_id = $1 AND qu.unseen_count > 0 AND title ILIKE \'%\' || $2 || \'%\' AND initiator = $3 ORDER BY updated_at DESC',
                [2, 'The Clone Wars', 2]
            );
            done();
        });
        // No filters
        it('should be passed correct SQL (No filters)', (done) => {
            queries.allQueries({
                user: { id: 2, role_code: 'STAFF' },
                query: {}
            });
            expect(
                pool.query
            ).toBeCalledWith(
                'SELECT q.* FROM query q ORDER BY updated_at DESC',
                []
            );
            done();
        });
    });
    describe('getQuery', () => {
        it('should be called', (done) => {
            queries.getQuery({ params: { id: 1 } });
            expect(pool.query).toHaveBeenCalled();
            done();
        });
        it('should be passed correct parameters', (done) => {
            queries.getQuery({ params: { id: 1 } });
            expect(
                pool.query
            ).toBeCalledWith('SELECT * FROM query WHERE id = $1', [1]);
            done();
        });
    });
    describe('upsertQuery', () => {
        it('should be called', (done) => {
            // Make the call *with an ID*
            queries.upsertQuery({
                params: { id: 1 },
                body: { title: 'Fred', folder: 'ESCALATED', initiator: 1 }
            });
            expect(pool.query).toHaveBeenCalled();
            done();
        });
        it('should be called as an UPDATE when ID is passed', (done) => {
            // Make the call *with an ID*
            queries.upsertQuery({
                params: { id: 1 },
                body: { title: 'Fred', folder: 'ESCALATED', initiator: 1 }
            });
            expect(
                pool.query
            ).toBeCalledWith(
                'UPDATE query SET title = $1, folder = $2, initiator = $3, updated_at = NOW() WHERE id = $4 RETURNING *',
                ['Fred', 'ESCALATED', 1, 1]
            );
            done();
        });
        it('should be called as an INSERT when ID is not passed', (done) => {
            // Make the call *without an ID*
            queries.upsertQuery({
                params: {},
                body: { title: 'Fred', folder: 'ESCALATED', initiator: 1 }
            });
            expect(
                pool.query
            ).toBeCalledWith(
                'INSERT INTO query VALUES (DEFAULT, $1, NOW(), NOW(), $2, $3) RETURNING *',
                ['Fred', 1, 'ESCALATED']
            );
            done();
        });
    });
    describe('deleteQuery', () => {
        it('should be called', (done) => {
            queries.deleteQuery({ params: { id: 1 } });
            expect(pool.query).toHaveBeenCalled();
            done();
        });
        it('should be passed correct parameters', (done) => {
            queries.deleteQuery({ params: { id: 1 } });
            expect(pool.query).toBeCalledWith(
                'DELETE FROM query WHERE id = $1',
                [1]
            );
            done();
        });
    });
    describe('updateBulk', () => {
        it('query should be called twice', (done) => {
            queries.updateBulk({
                body: [
                    {
                        id: 1,
                        title: 'A New Hope',
                        folder: 'ESCALATED',
                        initiator: 1
                    },
                    {
                        id: 2,
                        title: 'The Empire Strikes Back',
                        folder: 'ESCALATED',
                        initiator: 1
                    }
                ]
            });
            expect(pool.query).toHaveBeenCalledTimes(2);
            done();
        });
        it('should be passed correct parameters', (done) => {
            queries.updateBulk({
                body: [
                    {
                        id: 1,
                        title: 'A New Hope',
                        folder: 'ESCALATED',
                        initiator: 1
                    }
                ]
            });
            expect(
                pool.query
            ).toBeCalledWith(
                'UPDATE query SET title = $1, folder = $2, initiator = $3, updated_at = NOW() WHERE id = $4 RETURNING *',
                ['A New Hope', 'ESCALATED', 1, 1]
            );
            done();
        });
    });
    describe('initiators', () => {
        it('should be called', (done) => {
            queries.initiators([1, 2, 3]);
            expect(pool.query).toHaveBeenCalled();
            done();
        });
        it('should be passed correct parameters', (done) => {
            queries.initiators([1, 2, 3]);
            expect(
                pool.query
            ).toBeCalledWith(
                'SELECT id, initiator FROM query WHERE id IN ($1, $2, $3)',
                [1, 2, 3]
            );
            done();
        });
    });
    describe('participants', () => {
        it('should be called', (done) => {
            queries.participants([1, 2, 3]);
            expect(pool.query).toHaveBeenCalled();
            done();
        });
        it('should be passed correct parameters', (done) => {
            queries.participants([1, 2, 3]);
            expect(
                pool.query
            ).toBeCalledWith(
                'SELECT query_id, creator_id FROM message WHERE query_id IN ($1, $2, $3) GROUP BY query_id, creator_id',
                [1, 2, 3]
            );
            done();
        });
    });
    describe('latestMessages', () => {
        it('should be called', (done) => {
            queries.latestMessages([1, 2, 3]);
            expect(pool.query).toHaveBeenCalled();
            done();
        });
        it('should be passed correct parameters', (done) => {
            queries.latestMessages([1, 2, 3]);
            expect(
                pool.query
            ).toBeCalledWith(
                'SELECT * from message WHERE id IN (SELECT MAX(id) FROM message WHERE query_id IN ($1, $2, $3) GROUP BY query_id)',
                [1, 2, 3]
            );
            done();
        });
    });
    describe('labels', () => {
        it('should be called', (done) => {
            queries.labels([1, 2, 3]);
            expect(pool.query).toHaveBeenCalled();
            done();
        });
        it('should be passed correct parameters', (done) => {
            queries.labels([1, 2, 3]);
            expect(
                pool.query
            ).toBeCalledWith(
                'SELECT ql.* FROM querylabel ql INNER JOIN label l ON ql.label_id = l.id WHERE ql.query_id IN ($1, $2, $3) ORDER BY l.name ASC',
                [1, 2, 3]
            );
            done();
        });
    });
    describe('unhandledQueries', () => {
        it('should be called', (done) => {
            queries.unhandledQueries();
            expect(pool.query).toHaveBeenCalled();
            done();
        });
        it('should be called with the correct SQL', (done) => {
            queries.unhandledQueries();
            expect(
                pool.query
            ).toBeCalledWith(
                'SELECT * FROM query WHERE id IN (SELECT query_id FROM (SELECT query_id, creator_id FROM message GROUP BY query_id, creator_id) AS nested GROUP BY query_id HAVING COUNT(*) = 1)'
            );
            done();
        });
    });
});
