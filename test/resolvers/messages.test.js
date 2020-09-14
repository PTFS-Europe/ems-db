// The thing we're testing
const messages = require('../../resolvers/messages');

// The module that messages.js depends on (which we're about to mock)
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

describe('Messages', () => {
    describe('allMessages', () => {
        // Make the call with no parameters
        messages.allMessages({ query: {} });
        it('should be called', (done) => {
            expect(pool.query).toHaveBeenCalled();
            done();
        });
        it('should be passed correct SQL', (done) => {
            expect(pool.query).toBeCalledWith(
                'SELECT * FROM message ORDER BY created_at ASC',
                []
            );
            done();
        });
        // Pass offset and limit parameters
        messages.allMessages({ query: { offset: 20, limit: 10 } });
        it('should be passed correct SQL including paramters', (done) => {
            expect(
                pool.query
            ).toBeCalledWith(
                'SELECT * FROM message ORDER BY created_at ASC OFFSET $1 LIMIT $2',
                [20, 10]
            );
            done();
        });
        // Pass query_id parameter
        messages.allMessages({ query: { query_id: 1 } });
        it('should be passed correct SQL including query_id paramter', (done) => {
            expect(
                pool.query
            ).toBeCalledWith(
                'SELECT * FROM message WHERE query_id = $1 ORDER BY created_at ASC',
                [1]
            );
            done();
        });
    });
    describe('getMessage', () => {
        // Pass id parameter
        messages.getMessage({ params: { id: 1 } });
        it('should be passed correct SQL including id paramter', (done) => {
            expect(
                pool.query
            ).toBeCalledWith('SELECT * FROM message WHERE id = $1', [1]);
            done();
        });
    });
    describe('upsertMessage', () => {
        // Make the call *with an ID*
        messages.upsertMessage({
            params: { id: 1 },
            body: { content: 'Fred' }
        });
        it('should be called', (done) => {
            expect(pool.query).toHaveBeenCalled();
            done();
        });
        it('should be called as an UPDATE when ID is passed', (done) => {
            expect(
                pool.query
            ).toBeCalledWith(
                'UPDATE message SET content = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
                ['Fred', 1]
            );
            done();
        });
        // Make the call *without an ID*
        messages.upsertMessage({
            params: {},
            body: { query_id: 1, creator_id: 1, content: 'Fred' }
        });
        it('should be called as an INSERT when ID is not passed', (done) => {
            expect(
                pool.query
            ).toBeCalledWith(
                'INSERT INTO message VALUES (DEFAULT, $1, $2, $3, NOW(), NOW()) RETURNING *',
                [1, 1, 'Fred']
            );
            done();
        });
    });
    describe('deleteMessage', () => {
        // Make the call
        messages.deleteMessage({ params: { id: 1 } });
        it('should be called', (done) => {
            expect(pool.query).toHaveBeenCalled();
            done();
        });
        it('should be passed correct parameters', (done) => {
            expect(
                pool.query
            ).toBeCalledWith('DELETE FROM message WHERE id = $1', [1]);
            done();
        });
    });
    describe('insertUpload', () => {
        // Make the call
        messages.insertUpload({
            filename: 'myfile-1234.txt',
            originalName: 'myfile.txt',
            queryId: 1,
            userId: 1
        });
        it('should be called', (done) => {
            expect(pool.query).toHaveBeenCalled();
            done();
        });
        it('should be passed correct parameters', (done) => {
            expect(
                pool.query
            ).toBeCalledWith(
                'INSERT INTO message (query_id, creator_id, updated_at, filename, originalname) VALUES ($1, $2, NOW(), $3, $4) RETURNING *',
                [1, 1, 'myfile-1234.txt', 'myfile.txt']
            );
            done();
        });
    });
});
