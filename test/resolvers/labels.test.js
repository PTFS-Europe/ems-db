// The thing we're testing
const labels = require('../../resolvers/labels');

// The module that labels.js depends on (which we're about to mock)
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

describe('Labels', () => {
    describe('allLabels', () => {
        // Make the call
        labels.allLabels();
        it('should be called', (done) => {
            expect(pool.query).toHaveBeenCalled();
            done();
        });
        it('should be passed correct SQL', (done) => {
            expect(pool.query).toBeCalledWith(
                'SELECT l.*, (SELECT COUNT(*) FROM querylabel ql WHERE ql.label_id = l.id) AS count FROM label l ORDER BY name ASC'
            );
            done();
        });
    });
    describe('upsertLabel', () => {
        // Make the call *with an ID*
        labels.upsertLabel({
            params: { id: 1 },
            body: { name: 'My updated label name', colour: '#f00' }
        });
        it('should be called', (done) => {
            expect(pool.query).toHaveBeenCalled();
            done();
        });
        it('should be called as an UPDATE when ID is passed', (done) => {
            expect(
                pool.query
            ).toBeCalledWith(
                'UPDATE label SET name = $1, colour = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
                ['My updated label name', '#f00', 1]
            );
            done();
        });
        // Make the call *without an ID*
        labels.upsertLabel({
            params: {},
            body: { name: 'My new label', colour: '#f00' }
        });
        it('should be called as an INSERT when ID is not passed', (done) => {
            expect(
                pool.query
            ).toBeCalledWith(
                'INSERT INTO label VALUES (DEFAULT, $1, NOW(), NOW(), 0, $2) RETURNING *',
                ['My new label', '#f00']
            );
            done();
        });
    });
    describe('deleteLabel', () => {
        // Make the call
        labels.deleteLabel({ params: { id: 1 } });
        it('should be called', (done) => {
            expect(pool.query).toHaveBeenCalled();
            done();
        });
        it('should be passed correct parameters', (done) => {
            expect(pool.query).toBeCalledWith(
                'DELETE FROM label WHERE id = $1',
                [1]
            );
            done();
        });
    });
});
