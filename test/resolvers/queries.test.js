// The thing we're testing
const queries = require('../../resolvers/queries');

// The module that queries.js depends on (which we're about to mock)
const pool = require('../../config');

// Mock pool
jest.mock('../../config', () => ({
    // A mock query function
    query: jest.fn((sql, params) => {
        new Promise((resolve) => {
            return resolve(true);
        });
    })
}));

describe('Queries', () => {
    describe('allQueries', () => {
        // Make the call
        queries.allQueries({ query: {} });
        it('should be called', (done) => {
            expect(pool.query).toHaveBeenCalled();
            done();
        });
        it('should be passed correct SQL', (done) => {
            expect(pool.query).toBeCalledWith(
                'SELECT * FROM query ORDER BY updated_at DESC'
            );
            done();
        });
        // Pass offset and limit parameters
        queries.allQueries({ query: { offset: 20, limit: 10 } });
        it('should be passed correct SQL including paramters', (done) => {
            expect(pool.query).toBeCalledWith(
                'SELECT * FROM query ORDER BY updated_at DESC OFFSET 20 LIMIT 10'
            );
            done();
        });
    });
    describe('getQuery', () => {
        // Make the call
        queries.getQuery({ params: { id: 1 } });
        it('should be called', (done) => {
            expect(pool.query).toHaveBeenCalled();
            done();
        });
        it('should be passed correct parameters', (done) => {
            expect(
                pool.query
            ).toBeCalledWith('SELECT * FROM query WHERE id = $1', [1]);
            done();
        });
    });
    describe('upsertQuery', () => {
        // Make the call *with an ID*
        queries.upsertQuery({
            params: { id: 1 },
            body: { title: 'Fred', folder_id: 1 }
        });
        it('should be called', (done) => {
            expect(pool.query).toHaveBeenCalled();
            done();
        });
        it('should be called as an UPDATE when ID is passed', (done) => {
            expect(
                pool.query
            ).toBeCalledWith(
                'UPDATE query SET title = $1, folder_id = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
                ['Fred', 1, 1]
            );
            done();
        });
        // Make the call *without an ID*
        queries.upsertQuery({
            params: {},
            body: { title: 'Fred', folder_id: 1 }
        });
        it('should be called as an INSERT when ID is not passed', (done) => {
            expect(
                pool.query
            ).toBeCalledWith(
                'INSERT INTO query VALUES (DEFAULT, $1, $2, NOW(), NOW()) RETURNING *',
                ['Fred', 1]
            );
            done();
        });
    });
    describe('deleteQuery', () => {
        // Make the call
        queries.deleteQuery({ params: { id: 1 } });
        it('should be called', (done) => {
            expect(pool.query).toHaveBeenCalled();
            done();
        });
        it('should be passed correct parameters', (done) => {
            expect(pool.query).toBeCalledWith(
                'DELETE FROM query WHERE id = $1',
                [1]
            );
            done();
        });
    });
    describe('initiator', () => {
        // Make the call
        queries.initiator({ query: { query_id: 1 } });
        it('should be called', (done) => {
            expect(pool.query).toHaveBeenCalled();
            done();
        });
        it('should be passed correct parameters', (done) => {
            expect(
                pool.query
            ).toBeCalledWith('SELECT creator_id FROM message WHERE query_id = $1 ORDER BY created_at ASC LIMIT 1', [1]);
            done();
        });
        queries.initiator({ query: {} });
        it('should be passed correct parameters', (done) => {
            expect(
                pool.query
            ).toBeCalledWith('SELECT creator_id FROM message  ORDER BY created_at ASC LIMIT 1', []);
            done();
        });
    });
});
