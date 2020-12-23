// The thing we're testing
const querylabel = require('../../resolvers/querylabel');

// The module that querylabel.js depends on (which we're about to mock)
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

describe('QueryLabels', () => {
    describe('allLabelsForQueries', () => {
        querylabel.allLabelsForQueries([1, 2, 3]);
        it('should be called', (done) => {
            expect(pool.query).toHaveBeenCalled();
            done();
        });
        it('should be called with correct parameters', (done) => {
            expect(
                pool.query
            ).toBeCalledWith(
                'SELECT query_id, label_id FROM querylabel WHERE query_id IN ($1,$2,$3)',
                [1, 2, 3]
            );
            done();
        });
    });
    describe('addLabelToQuery', () => {
        querylabel.addLabelToQuery({
            params: { query_id: 1, label_id: 2 }
        });
        it('should be called', (done) => {
            expect(pool.query).toHaveBeenCalled();
            done();
        });
        it('should be called with correct parameters', (done) => {
            expect(
                pool.query
            ).toBeCalledWith(
                'INSERT INTO querylabel VALUES ($1, $2, NOW(), NOW()) ON CONFLICT DO NOTHING RETURNING *',
                [1, 2]
            );
            done();
        });
    });
    describe('removeLabelFromQuery', () => {
        querylabel.removeLabelFromQuery({
            params: { query_id: 1, label_id: 2 }
        });
        it('should be called', (done) => {
            expect(pool.query).toHaveBeenCalled();
            done();
        });
        it('should be called with correct parameters', (done) => {
            expect(
                pool.query
            ).toBeCalledWith(
                'DELETE FROM querylabel WHERE query_id = $1 AND label_id = $2',
                [1, 2]
            );
            done();
        });
    });
});
