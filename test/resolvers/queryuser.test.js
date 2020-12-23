// The thing we're testing
const queryuser = require('../../resolvers/queryuser');
const queries = require('../../resolvers/queries');

// The module that queryuser.js depends on (which we're about to mock)
const pool = require('../../config');

// Mock pool
jest.mock('../../config', () => ({
    query: jest.fn(
        () => Promise.resolve({ rows: [{ rowCount: 10 }] })
    )
}));

describe('UserQuery', () => {
    beforeEach(() => jest.clearAllMocks());
    describe('allUserQueries', () => {
        beforeEach(() => queryuser.allUserQueries());
        it('should be called', (done) => {
            expect(pool.query).toHaveBeenCalled();
            done();
        });
        it('should be passed correct SQL', (done) => {
            expect(pool.query).toBeCalledWith(
                'SELECT * FROM queryuser'
            );
            done();
        });
    });
    describe('updateMostRecentSeen', () => {
        beforeEach(() => queryuser.updateMostRecentSeen({
            params: { query_id: 1, user_id: 2 },
            body: { most_recent_seen: 100 }
        }));
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
    describe('getMostRecentSeen', () => {
        beforeEach(() => queryuser.getMostRecentSeen({ id: 1 }));
        it('should be called', (done) => {
            expect(pool.query).toHaveBeenCalled();
            done();
        });
        it('should be called with correct parameters', (done) => {
            expect(
                pool.query
            ).toBeCalledWith(
                'SELECT query_id, most_recent_seen FROM queryuser WHERE user_id = $1',
                [1]
            );
            done();
        });
    });
    describe('getUnseenCounts', () => {
        beforeEach(() => queryuser.getUnseenCounts({
            query_id: 1,
            user_id: 2,
            mostRecentSeen: 100
        }));
        it('should be called', (done) => {
            expect(pool.query).toHaveBeenCalled();
            done();
        });
        it('should be called with correct parameters', (done) => {
            expect(
                pool.query
            ).toBeCalledWith(
                'SELECT count(*) AS rowcount FROM message WHERE query_id  = $1 AND creator_id != $2 AND id > $3',
                [1, 2, 100]
            );
            done();
        });
    });
    describe('calculateUnseenCount', () => {
        beforeEach(() => {
            const _getUnseenCounts = jest.fn(
                () => Promise.resolve({ rows: [{ rowcount: 99 }] })
            );
            queryuser.calculateUnseenCount({
                query_id: 1,
                user_id: 2,
                mostRecentSeen: 10,
                _getUnseenCounts
            });
        });
        it('should be called', (done) => {
            expect(pool.query).toHaveBeenCalled();
            done();
        });
        it('should be called with correct parameters', (done) => {
            expect(
                pool.query
            ).toHaveBeenCalledWith(
                'UPDATE queryuser SET unseen_count = $1 WHERE query_id = $2 AND user_id = $3 RETURNING *',
                [99, 1, 2]
            );
            done();
        });
    });
    describe('upsertQueryUser', () => {
        beforeEach(() => {
            queryuser.upsertQueryUser({ query_id: 1, user_id: 2 });
        });
        it('should be called', (done) => {
            expect(pool.query).toHaveBeenCalled();
            done();
        });
        it('should be called with correct parameters', (done) => {
            expect(
                pool.query
            ).toHaveBeenCalledWith(
                'INSERT INTO queryuser VALUES ($1, $2, NOW(), NOW(), 0, 0, 0) ON CONFLICT ON CONSTRAINT userquery_pkey DO UPDATE SET unseen_count = queryuser.unseen_count + 1 WHERE queryuser.query_id = $3 AND queryuser.user_id = $4',
                [1, 2, 1, 2]
            );
            done();
        });
    });
    describe('upsertQueryUsers', () => {
        beforeEach(() => {
            queryuser.upsertQueryUsers({
                query_id: 4,
                creator: 2,
                _associated: () => Promise.resolve([1, 2, 3])
            });
        });
        it('should be called twice', (done) => {
            expect(pool.query).toHaveBeenCalledTimes(2);
            done();
        });
        it('should be called with correct parameters', (done) => {
            expect(
                pool.query
            ).toHaveBeenNthCalledWith(
                1,
                'INSERT INTO queryuser VALUES ($1, $2, NOW(), NOW(), 0, 0, 0) ON CONFLICT ON CONSTRAINT userquery_pkey DO UPDATE SET unseen_count = queryuser.unseen_count + 1 WHERE queryuser.query_id = $3 AND queryuser.user_id = $4',
                [4, 1, 4, 1]
            );
            expect(
                pool.query
            ).toHaveBeenNthCalledWith(
                2,
                'INSERT INTO queryuser VALUES ($1, $2, NOW(), NOW(), 0, 0, 0) ON CONFLICT ON CONSTRAINT userquery_pkey DO UPDATE SET unseen_count = queryuser.unseen_count + 1 WHERE queryuser.query_id = $3 AND queryuser.user_id = $4',
                [4, 3, 4, 3]
            );
            done();
        });
    });
    describe('updateMostRecentDigests', () => {
        beforeEach(() => {
            queryuser.updateMostRecentDigests([
                {
                    query: {
                        id: 1,
                        userId: 2,
                        highMark: 100
                    }
                },
                {
                    query: {
                        id: 3,
                        userId: 4,
                        highMark: 200
                    }
                }
            ]);
        });
        it('should be called twice', (done) => {
            expect(pool.query).toHaveBeenCalledTimes(2);
            done();
        });
        it('should be called with correct parameters', (done) => {
            expect(
                pool.query
            ).toHaveBeenNthCalledWith(
                1,
                'INSERT INTO queryuser VALUES ($4, $5, NOW(), NOW(), $1, $2, $3) ON CONFLICT ON CONSTRAINT userquery_pkey DO UPDATE SET most_recent_seen = $1, unseen_count = $2, most_recent_digest = $3 WHERE queryuser.query_id = $4 AND queryuser.user_id = $5',
                [0, 0, 100, 1, 2]
            );
            expect(
                pool.query
            ).toHaveBeenNthCalledWith(
                2,
                'INSERT INTO queryuser VALUES ($4, $5, NOW(), NOW(), $1, $2, $3) ON CONFLICT ON CONSTRAINT userquery_pkey DO UPDATE SET most_recent_seen = $1, unseen_count = $2, most_recent_digest = $3 WHERE queryuser.query_id = $4 AND queryuser.user_id = $5',
                [0, 0, 200, 3, 4]
            );
            done();
        });
    });
    describe('upsertCounts', () => {
        it('should be called with correct parameters', (done) => {
            queryuser.upsertCounts({ query_id: 1, user_id: 2 });
            expect(
                pool.query
            ).toHaveBeenCalledWith(
                'INSERT INTO queryuser VALUES ($4, $5, NOW(), NOW(), $1, $2, $3) ON CONFLICT ON CONSTRAINT userquery_pkey DO UPDATE SET most_recent_seen = $1, unseen_count = $2, most_recent_digest = $3 WHERE queryuser.query_id = $4 AND queryuser.user_id = $5',
                [0, 0, 0, 1, 2]
            );
            done();
        });
    });
    describe('decrementUnseenCount', () => {
        beforeEach(() => {
            queryuser.decrementUnseenCount({ query_id: 1, user_id: 2 });
        });
        it('should be called', (done) => {
            expect(pool.query).toHaveBeenCalled();
            done();
        });
        it('should be called with correct parameters', (done) => {
            expect(
                pool.query
            ).toHaveBeenCalledWith(
                'UPDATE queryuser SET unseen_count = unseen_count - 1 WHERE query_id = $1 AND user_id = $2',
                [1, 2]
            );
            done();
        });
    });
    describe('decrementMessageDelete', () => {
        const getUsersToDecrement = jest.fn(() => Promise.resolve([1, 2, 3]));
        const decrementUnseenCount = jest.fn();
        beforeEach(() => {
            queryuser.decrementMessageDelete({
                message: {
                    query_id: 1,
                    creator_id: 2,
                    id: 3
                },
                _getUsersToDecrement: getUsersToDecrement,
                _decrementUnseenCount: decrementUnseenCount
            });
        });
        it('getUsersToDecrement mock should be called', (done) => {
            expect(getUsersToDecrement).toHaveBeenCalled();
            done();
        });
        it('decrementUnseenCount mock should be called 3 times with the correct parameters', (done) => {
            expect(
                decrementUnseenCount
            ).toHaveBeenNthCalledWith(1, { query_id: 1, user_id: 1 });
            expect(
                decrementUnseenCount
            ).toHaveBeenNthCalledWith(2, { query_id: 1, user_id: 2 });
            expect(
                decrementUnseenCount
            ).toHaveBeenNthCalledWith(3, { query_id: 1, user_id: 3 });
            done();
        });
    });
    describe('getUsersToDecrement', () => {
        it('should return the correct value', async (done) => {
            const body = {
                rows: [
                    {
                        user_id: 1,
                        most_recent_seen: 50
                    },
                    {
                        user_id: 2,
                        most_recent_seen: 80

                    },
                    {
                        user_id: 3,
                        most_recent_seen: 80
                    },
                    {
                        user_id: 4,
                        most_recent_seen: 120
                    }
                ]
            };
            const getParticipantCounts = jest.fn(
                () => Promise.resolve(body)
            );
            const result1 = await queryuser.getUsersToDecrement({
                query_id: 1,
                exclude: [2],
                most_recent_seen: 100,
                _getParticipantCounts: getParticipantCounts
            });
            expect(result1).toEqual([1, 3]);
            const result2 = await queryuser.getUsersToDecrement({
                query_id: 1,
                most_recent_seen: 100,
                _getParticipantCounts: getParticipantCounts
            });
            expect(result2).toEqual([1, 2, 3]);
            const result3 = await queryuser.getUsersToDecrement({
                query_id: 1,
                _getParticipantCounts: getParticipantCounts
            });
            expect(result3).toEqual([1, 2, 3, 4]);
            done();
        });
    });
    describe('getUserUnseenCounts', () => {
        it('should be called with correct parameters', (done) => {
            queryuser.getUserUnseenCounts({ query_ids: [1, 2], user_id: 3 });
            expect(
                pool.query
            ).toHaveBeenCalledWith(
                'SELECT query_id, unseen_count FROM queryuser WHERE query_id IN ($1, $2) AND user_id = $3',
                [1, 2, 3]
            );
            done();
        });
        it('should be called with correct parameters', (done) => {
            queryuser.getUserUnseenCounts({ user_id: 3 });
            expect(
                pool.query
            ).toHaveBeenCalledWith(
                'SELECT query_id, unseen_count FROM queryuser WHERE user_id = $1',
                [3]
            );
            done();
        });
    });
});
