// The thing we're testing
const users = require('../../resolvers/users');

// The modules that users.js depends on (which we're about to mock)
const pool = require('../../config');
const roleResolvers = require('../../resolvers/roles');
const encryption = require('../../helpers/encryption');

// Mock pool
jest.mock('../../config', () => ({
    // A mock query function
    query: jest.fn(
        () =>
            new Promise((resolve) =>
                resolve({ rowCount: 1, rows: [{ id: 1 }] })
            )
    )
}));

// Mock encryption
jest.mock('../../helpers/encryption', () => ({
    decrypt: jest.fn(() => 'decrypted')
}));

describe('Users', () => {
    beforeEach(() => jest.clearAllMocks());
    describe('allUsers', () => {
        it('should be called', (done) => {
            users.allUsers({ query: {} });
            expect(pool.query).toHaveBeenCalled();
            done();
        });
        it('should be passed correct SQL with no parameters', (done) => {
            users.allUsers({ query: {} });
            expect(pool.query).toBeCalledWith(
                'SELECT eu.*, r.code AS role_code FROM ems_user eu, role r WHERE eu.role_id = r.id ORDER BY name ASC',
                []
            );
            done();
        });
        // Pass user_ids parameter
        // If we're supplied with some user IDs, we must use those to filter
        // our requested records
        it('should be passed correct SQL including id parameter', (done) => {
            users.allUsers({ query: { user_ids: '1_2_3' } });
            expect(
                pool.query
            ).toBeCalledWith(
                'SELECT eu.*, r.code AS role_code FROM ems_user eu, role r WHERE eu.role_id = r.id AND eu.id IN ($1,$2,$3) ORDER BY name ASC',
                [1, 2, 3]
            );
            done();
        });
        // Pass a role code
        it('should be passed correct SQL including role_code parameter', (done) => {
            users.allUsers({ query: { role_code: 'STAFF' } });
            expect(
                pool.query
            ).toBeCalledWith(
                'SELECT eu.*, r.code AS role_code FROM ems_user eu, role r WHERE eu.role_id = r.id AND r.code = $1 ORDER BY name ASC',
                ['STAFF']
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
            ).toBeCalledWith(
                'SELECT u.*, r.code AS role_code FROM ems_user u INNER JOIN role r ON r.id = u.role_id WHERE u.id = $1',
                [1]
            );
            done();
        });
    });
    describe('getUserEmail', () => {
        it('should call decrypt', async (done) => {
            await users.getUserEmail();
            expect(encryption.decrypt).toHaveBeenCalled();
            done();
        });
    });
    describe('getUserByProvider', () => {
        it('should be called', (done) => {
            users.getUserByProvider({
                params: { provider: 'Imperial Navy', providerId: 'TK-421' }
            });
            expect(pool.query).toHaveBeenCalled();
            done();
        });
        it('should be passed correct parameters', (done) => {
            users.getUserByProvider({
                params: { provider: 'Imperial Navy', providerId: 'TK-421' }
            });
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
                body: {
                    name: 'Wilhuff Tarkin',
                    email: 'wil@deathstar.com',
                    role_id: 1,
                    provider_meta: 'So meta',
                    avatar: 'I see you'
                }
            });
            expect(
                pool.query
            ).toBeCalledWith(
                'UPDATE ems_user SET name = $1, email = $2, role_id = $3, provider_meta = $4, avatar = $5, updated_at = NOW() WHERE id = $6 RETURNING *',
                ['Wilhuff Tarkin', 'wil@deathstar.com', 1, 'So meta', 'I see you', 1]
            );
            done();
        });
        it('should be called as an INSERT when ID is not passed', async (done) => {
            const stormy = {
                name: 'Stormtrooper',
                role_id: 1,
                provider: 'Imperial Navy',
                provider_id: 'TK-421',
                provider_meta: 'Terrible shot',
                avatar: 'stormtrooper.jpg'
            };
            await users.upsertUser({
                body: stormy,
                _getRoleByCode: jest.fn(
                    () => Promise.resolve({ rowCount: 1, rows: [{ id: 20 }] })
                )
            });
            expect(pool.query).toBeCalledWith(
                'INSERT INTO ems_user (id, name, email, role_id, created_at, updated_at, provider, provider_id, provider_meta, avatar) VALUES (default, $1, $2, $3, NOW(), NOW(), $4, $5, $6, $7) RETURNING *',
                [
                    stormy.name,
                    stormy.email,
                    20,
                    stormy.provider,
                    stormy.provider_id,
                    stormy.provider_meta,
                    stormy.avatar
                ]
            );
            jest.clearAllMocks();
            await users.upsertUser({
                body: stormy,
                _getRoleByCode: jest.fn(
                    () => Promise.resolve({ rowCount: 0, rows: [] })
                )
            });
            expect(pool.query).not.toBeCalled();
            done();
        });
    });
    describe('upsertUserByProviderId', () => {
        let sheev = {};
        let mocks = {};
        beforeEach(() => {
            sheev = {
                id: 66,
                role_id: 99,
                name: 'Sheev Palpatine',
                provider: 'Imperial Navy',
                providerId: 50,
                providerMeta: {},
                email: 'sheev@thedarkside.com',
                avatar: 'https://i.kym-cdn.com/entries/icons/original/000/019/930/1421657233490.jpg'
            };
            mocks = {
                upsertUser: jest.fn(() =>
                    new Promise((resolve) => resolve())
                ),
                getUserByProviderExist: jest.fn(() =>
                    Promise.resolve({
                        rowCount: 1,
                        rows: [{
                            id: sheev.id,
                            role_id: sheev.role_id,
                            provider_id: sheev.providerId
                        }]
                    })
                ),
                getUserByProviderNoExist: jest.fn(() =>
                    Promise.resolve({
                        rowCount: 0,
                        rows: []
                    })
                ),
                getUserByProviderError: jest.fn(() => Promise.reject('fail')),
                encryption: {
                    encrypt: jest.fn((passed) => Promise.resolve(passed))
                }
            };
        });
        it('should not call encrypt if no email passed', async (done) => {
            const incognitoSheev = {
                ...sheev,
                email: null
            };
            await users.upsertUserByProviderId({
                ...incognitoSheev,
                _getUserByProvider: mocks.getUserByProviderExist,
                _encryption: mocks.encryption,
                _upsertUser: mocks.upsertUser
            });
            expect(mocks.encryption.encrypt).not.toBeCalled();
            done();
        });
        it('should follow the update path', async (done) => {
            await users.upsertUserByProviderId({
                ...sheev,
                _getUserByProvider: mocks.getUserByProviderExist,
                _encryption: mocks.encryption,
                _upsertUser: mocks.upsertUser
            });
            expect(mocks.encryption.encrypt).toBeCalledWith(sheev.email);
            expect(mocks.getUserByProviderExist).toBeCalledWith({
                params: {
                    provider: sheev.provider,
                    providerId: sheev.providerId
                }
            });
            expect(mocks.upsertUser).toBeCalledWith({
                params: {
                    id: sheev.id
                },
                body: {
                    name: sheev.name,
                    email: sheev.email,
                    role_id: sheev.role_id,
                    provider_meta: sheev.providerMeta,
                    avatar: sheev.avatar,
                    provider_id: sheev.providerId
                }
            });
            done();
        });
        it('should follow the insert path', async (done) => {
            await users.upsertUserByProviderId({
                ...sheev,
                _getUserByProvider: mocks.getUserByProviderNoExist,
                _encryption: mocks.encryption,
                _upsertUser: mocks.upsertUser
            });
            expect(mocks.getUserByProviderNoExist).toBeCalledWith({
                params: {
                    provider: sheev.provider,
                    providerId: sheev.providerId
                }
            });
            expect(mocks.upsertUser).toBeCalledWith({
                body: {
                    name: sheev.name,
                    email: sheev.email,
                    provider: sheev.provider,
                    provider_id: sheev.providerId,
                    provider_meta: sheev.providerMeta,
                    avatar: sheev.avatar
                }
            });
            done();
        });
        it('should catch errors', async (done) => {
            const result = await users.upsertUserByProviderId({
                ...sheev,
                _getUserByProvider: mocks.getUserByProviderError,
                _encryption: mocks.encryption,
                _upsertUser: mocks.upsertUser
            });
            expect(result).toEqual('fail');
            done();
        });
    });
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
