// The thing we're testing
const queryuser = require('../../resolvers/queryuser');

// The module that queryuser.js depends on (which we're about to mock)
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

describe('UserQuery', () => {
    describe('addUserToQuery', () => {
        queryuser.addUserToQuery({
            params: { query_id: 1, user_id: 2 }
        });
        it('should be called', (done) => {
            expect(pool.query).toHaveBeenCalled();
            done();
        });
        it('should be called with correct parameters', (done) => {
            expect(
                pool.query
            ).toBeCalledWith(
                'INSERT INTO queryuser VALUES ($1, $2, NOW(), NOW(), 0) RETURNING *',
                [1, 2]
            );
            done();
        });
    });
    describe('updateMostRecentSeen', () => {
        queryuser.updateMostRecentSeen({
            params: { query_id: 1, user_id: 2 },
            body: { most_recent_seen: 100 }
        });
        it('should be called', (done) => {
            expect(pool.query).toHaveBeenCalled();
            done();
        });
        it('should be called with correct parameters', (done) => {
            expect(
                pool.query
            ).toBeCalledWith(
                'UPDATE queryuser SET most_recent_seen = $1 WHERE query_id=$2 AND user_id=$3 RETURNING *',
                [100, 1, 2]
            );
            done();
        });
    });
});
