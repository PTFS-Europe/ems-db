// The thing we're testing
const users = require('../../resolvers/users');

// The module that users.js depends on (which we're about to mock)
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

describe('Users', () => {
    describe('allUsers', () => {
        // Make the call
        users.allUsers({ query: {} });
        it('should be called', (done) => {
            expect(pool.query).toHaveBeenCalled();
            done();
        });
        it('should be passed correct SQL', (done) => {
            expect(pool.query).toBeCalledWith(
                'SELECT * FROM ems_user ORDER BY name ASC',
                []
            );
            done();
        });
        // Pass user_ids parameter
        // If we're supplied with some user IDs, we must use those to filter
        // our requested records
        users.allUsers({ query: { user_ids: '1_2_3' } });
        it('should be passed correct SQL including id parameter', (done) => {
            expect(pool.query).toBeCalledWith(
                'SELECT * FROM ems_user WHERE id IN ($1, $2, $3) ORDER BY name ASC',
                [1,2,3]
            );
            done();
        });
    });
    describe('getUser', () => {
        // Make the user
        users.getUser({ params: { id: 1 } });
        it('should be called', (done) => {
            expect(pool.query).toHaveBeenCalled();
            done();
        });
        it('should be passed correct parameters', (done) => {
            expect(
                pool.query
            ).toBeCalledWith('SELECT * FROM ems_user WHERE id = $1', [1]);
            done();
        });
    });
    describe('upsertUser', () => {
        // Make the call *with an ID*
        users.upsertUser({
            params: { id: 1 },
            body: { name: 'Jeff Bloggs', role_id: 1 }
        });
        it('should be called', (done) => {
            expect(pool.query).toHaveBeenCalled();
            done();
        });
        it('should be called as an UPDATE when ID is passed', (done) => {
            expect(
                pool.query
            ).toBeCalledWith(
                'UPDATE ems_user SET name = $1, role_id = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
                ['Jeff Bloggs', 1, 1]
            );
            done();
        });
        // Make the call *without an ID*
        users.upsertUser({
            params: {},
            body: { name: 'Jane Bloggs', role_id: 1 }
        });
        it('should be called as an INSERT when ID is not passed', (done) => {
            expect(
                pool.query
            ).toBeCalledWith(
                'INSERT INTO ems_user VALUES (DEFAULT, $1, $2, NOW(), NOW()) RETURNING *',
                ['Jane Bloggs', 1]
            );
            done();
        });
    });
    describe('deleteUser', () => {
        // Make the call
        users.deleteUser({ params: { id: 1 } });
        it('should be called', (done) => {
            expect(pool.query).toHaveBeenCalled();
            done();
        });
        it('should be passed correct parameters', (done) => {
            expect(
                pool.query
            ).toBeCalledWith('DELETE FROM ems_user WHERE id = $1', [1]);
            done();
        });
    });
});
