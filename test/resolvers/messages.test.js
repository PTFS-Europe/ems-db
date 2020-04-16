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
        // Make the call
        messages.allMessages();
        it('should be called', (done) => {
            expect(pool.query).toHaveBeenCalled();
            done();
        });
        it('should be passed correct SQL', (done) => {
            expect(pool.query).toBeCalledWith('SELECT * FROM messages');
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
});
