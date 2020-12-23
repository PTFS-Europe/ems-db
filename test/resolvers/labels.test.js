// The thing we're testing
const labels = require('../../resolvers/labels');

// The module that labels.js depends on (which we're about to mock)
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
                'SELECT * FROM label l ORDER BY name ASC'
            );
            done();
        });
    });
    describe('getLabel', () => {
        // Make the call
        labels.getLabel({ params: { id: 1 }});
        it('should be called', (done) => {
            expect(pool.query).toHaveBeenCalled();
            done();
        });
        it('should be passed correct SQL', (done) => {
            expect(pool.query).toBeCalledWith(
                'SELECT * FROM label WHERE id = $1',
                [1]
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
                'INSERT INTO label VALUES (DEFAULT, $1, NOW(), NOW(), $2) RETURNING *',
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
    describe('labelCounts', () => {
        const mockedFn = jest.fn(() =>
            new Promise((resolve) => {
                return resolve({
                    rows: [
                        { id: 1, label_id: 2 },
                        { id: 2, label_id: 3 },
                        { id: 3, label_id: 1 }
                    ],
                    rowCount: 3
                });
            })
        );
        it(
            'allLabels, allQueries & allLabelsForQueries should be called',
            async (done) => {
                await labels.labelCounts(
                    { user: { id: 1 } },
                    mockedFn,
                    mockedFn,
                    mockedFn
                );
                expect(mockedFn).toHaveBeenCalledTimes(3);
                done();
            }
        );
        it('should return the correct result', async (done) => {
            const result = await labels.labelCounts(
                { user: { id: 1 } },
                mockedFn,
                mockedFn,
                mockedFn
            );
            expect(result).toEqual({
                '1': 1,
                '2': 1,
                '3': 1
            });
            done();
        });
        it(
            'should throw in the event of an error',
            async (done) => {
                await expect(labels.labelCounts({
                    user: { id: 1 }
                })).rejects.toBeTruthy();
                done();
            }
        );
    });
});
