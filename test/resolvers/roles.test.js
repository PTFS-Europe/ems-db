// The thing we're testing
const roles = require('../../resolvers/roles');

// The module that roles.js depends on (which we're about to mock)
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

describe('Roles', () => {
    describe('allRoles', () => {
        // Make the call
        roles.allRoles();
        it('should be called', (done) => {
            expect(pool.query).toHaveBeenCalled();
            done();
        });
        it('should be passed correct SQL', (done) => {
            expect(pool.query).toBeCalledWith(
                'SELECT * FROM role ORDER BY name ASC'
            );
            done();
        });
    });
    describe('getRoleByCode', () => {
        // Make the call
        roles.getRoleByCode({ params: { code: '2187' } });
        it('should be called', (done) => {
            expect(pool.query).toHaveBeenCalled();
            done();
        });
        it('should be passed correct SQL', (done) => {
            expect(
                pool.query
            ).toBeCalledWith('SELECT * FROM role WHERE code = $1', ['2187']);
            done();
        });
    });
    describe('upsertRole', () => {
        // Make the call *with an ID*
        roles.upsertRole({
            params: { id: 1 },
            body: {
                name: 'My updated role name',
                code: 'UPDATED_CODE',
                type: 'UPDATED_TYPE'
            }
        });
        it('should be called', (done) => {
            expect(pool.query).toHaveBeenCalled();
            done();
        });
        it('should be called as an UPDATE when ID is passed', (done) => {
            expect(
                pool.query
            ).toBeCalledWith(
                'UPDATE role SET name = $1, code = $2, type = $3, updated_at = NOW() WHERE id = $4 RETURNING *',
                ['My updated role name', 'UPDATED_CODE', 'UPDATED_TYPE', 1]
            );
            done();
        });
        // Make the call *without an ID*
        roles.upsertRole({
            params: {},
            body: { name: 'My new role', code: 'NEW_CODE', type: 'NEW_TYPE' }
        });
        it('should be called as an INSERT when ID is not passed', (done) => {
            expect(
                pool.query
            ).toBeCalledWith(
                'INSERT INTO role VALUES (DEFAULT, $1, NOW(), NOW(), $2, $3) RETURNING *',
                ['My new role', 'NEW_CODE', 'NEW_TYPE']
            );
            done();
        });
    });
    describe('deleteRole', () => {
        // Make the call
        roles.deleteRole({ params: { id: 1 } });
        it('should be called', (done) => {
            expect(pool.query).toHaveBeenCalled();
            done();
        });
        it('should be passed correct parameters', (done) => {
            expect(pool.query).toBeCalledWith(
                'DELETE FROM role WHERE id = $1',
                [1]
            );
            done();
        });
    });
});
