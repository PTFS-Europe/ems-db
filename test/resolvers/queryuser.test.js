// The thing we're testing
const queryuser = require('../../resolvers/queryuser');

// The module that queryuser.js depends on (which we're about to mock)
const pool = require('../../config');

// Mock pool
jest.mock('../../config', () => ({
    // A mock query function
    query: jest.fn(() => 
        new Promise((resolve) => {
            return resolve({ rows: [{ rowCount: 0 }]});
        })
    )
}));

describe('UserQuery', () => {
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
