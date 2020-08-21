// The thing we're testing
const users = require('../../resolvers/users');

// The modules that users.js depends on (which we're about to mock)
const pool = require('../../config');
const roleResolvers = require('../../resolvers/roles');

// Mock pool
jest.mock('../../config', () => ({
    // A mock query function
    query: jest.fn((sql, params) =>
        new Promise((resolve) => resolve({ rowCount: 1, rows: [{ id: 1 }] }))
    )
}));

// Mock roleResolvers
jest.mock('../../resolvers/roles', () => ({
    getRoleByCode: jest.fn((sql, params) =>
        new Promise((resolve) => resolve({ rowCount: 1, rows: [{ id: 1 }] }))
    )
}));

describe('Users', () => {
    beforeEach(() => jest.clearAllMocks());
    describe('allUsers', () => {
        it('should be called', (done) => {
            users.allUsers({ query: {} });
            expect(pool.query).toHaveBeenCalled();
            done();
        });
        it('should be passed correct SQL', (done) => {
            users.allUsers({ query: {} });
            expect(pool.query).toBeCalledWith(
                'SELECT * FROM ems_user ORDER BY name ASC',
                []
            );
            done();
        });
        // Pass user_ids parameter
        // If we're supplied with some user IDs, we must use those to filter
        // our requested records
        it('should be passed correct SQL including id parameter', (done) => {
            users.allUsers({ query: { user_ids: '1_2_3' } });
            expect(pool.query).toBeCalledWith(
                'SELECT * FROM ems_user WHERE id IN ($1, $2, $3) ORDER BY name ASC',
                [1, 2, 3]
            );
            done();
        });
    });
    describe('getUser', () => {
        it('should be called', (done) => {
            users.getUser({ params: { id: 1 } });
            expect(pool.query).toHaveBeenCalled();
            done();
        });
        it('should be passed correct parameters', (done) => {
            users.getUser({ params: { id: 1 } });
            expect(
                pool.query
            ).toBeCalledWith('SELECT u.*, r.code AS role_code FROM ems_user u INNER JOIN role r ON r.id = u.role_id WHERE u.id = $1', [1]);
            done();
        });
    });
    describe('getUserByProvider', () => {
        it('should be called', (done) => {
            users.getUserByProvider({ params: { provider: 'Imperial Navy', providerId: 'TK-421' } });
            expect(pool.query).toHaveBeenCalled();
            done();
        });
        it('should be passed correct parameters', (done) => {
            users.getUserByProvider({ params: { provider: 'Imperial Navy', providerId: 'TK-421' } });
            expect(
                pool.query
            ).toBeCalledWith(
                'SELECT * FROM ems_user WHERE provider = $1 AND provider_id = $2',
                ['Imperial Navy', 'TK-421']
            );
            done();
        });
    });
    describe('upsertUser', () => {
        it('should be called', (done) => {
            users.upsertUser({
                params: { id: 1 },
                body: { name: 'Mon Mothma', role_id: 1 }
            });
            expect(pool.query).toHaveBeenCalled();
            done();
        });
        it('should be called as an UPDATE when ID is passed', (done) => {
            users.upsertUser({
                params: { id: 1 },
                body: { name: 'Wilhuff Tarkin', role_id: 1, provider_meta: 'So meta', avatar: 'I see you' }
            });
            expect(
                pool.query
            ).toBeCalledWith(
                'UPDATE ems_user SET name = $1, role_id = $2, provider_meta = $3, avatar = $4, updated_at = NOW() WHERE id = $5 RETURNING *',
                ['Wilhuff Tarkin', 1, 'So meta', 'I see you', 1]
            );
            done();
        });
        it('should be called as an INSERT when ID is not passed', async (done) => {
            await users.upsertUser({
                body: { name: 'Stormtrooper', role_id: 1, provider: 'Imperial Navy', provider_id: 'TK-421', provider_meta: 'Terrible shot', avatar: 'stormtrooper.jpg' }
            });
            expect(roleResolvers.getRoleByCode).toBeCalledTimes(1);
            expect(pool.query).toBeCalledTimes(1);
            done();
        });
    });
    /*
    TODO:
    Testing nested calls is much harder than it looks, really need to 
    revisit this
    describe('upsertUserByProviderId', () => {
        // Mock roleResolvers
        jest.mock('../../resolvers/users', () => ({
            upsertUser: jest.fn((sql, params) =>
                new Promise((resolve) => resolve())
            ),
            getUserByProvider: jest.fn((sql, params) => 
                new Promise((resolve) => resolve({rowCount: 1, rows: [{id: 1}]}))
            )
        }));
        it('should follow the update path', async (done) => {
            const result = await users.upsertUserByProviderId({
                name: 'Sheev Palpatine',
                provider: 'Imperial Navy',
                providerId: 1
            });
            expect(users.upsertUser).toBeCalled();
            done();
        });
        it('should follow the create path', async (done) => {
            pool.query.mockImplementationOnce(() =>
                new Promise((resolve) => resolve({ rowCount: 0, rows: [] })));
            await users.upsertUserByProviderId({
                name: 'Sheev Palpatine',
                provider: 'Imperial Navy',
                providerId: 1
            });
            expect(users.getUserByProvider).toBeCalled();
            expect(users.upsertUser).toBeCalledWith();
            done();
        });
    });
    */
    describe('deleteUser', () => {
        it('should be called', (done) => {
            users.deleteUser({ params: { id: 1 } });
            expect(pool.query).toHaveBeenCalled();
            done();
        });
        it('should be passed correct parameters', (done) => {
            users.deleteUser({ params: { id: 1 } });
            expect(
                pool.query
            ).toBeCalledWith('DELETE FROM ems_user WHERE id = $1', [1]);
            done();
        });
    });
});
