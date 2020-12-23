// The thing we're testing
const folders = require('../../resolvers/folders');

// The module that folders.js depends on (which we're about to mock)
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

describe('Folders', () => {
    describe('allFolders', () => {
        // Make the call
        folders.allFolders();
        it('should be called', (done) => {
            expect(pool.query).toHaveBeenCalled();
            done();
        });
        it('should be passed correct SQL', (done) => {
            expect(pool.query).toBeCalledWith(
                'SELECT * FROM folder f ORDER BY name ASC'
            );
            done();
        });
    });
    describe('upsertFolder', () => {
        // Make the call *with an ID*
        folders.upsertFolder({
            params: { id: 1 },
            body: { name: 'My updated folder name' }
        });
        it('should be called', (done) => {
            expect(pool.query).toHaveBeenCalled();
            done();
        });
        it('should be called as an UPDATE when ID is passed', (done) => {
            expect(
                pool.query
            ).toBeCalledWith(
                'UPDATE folder SET name = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
                ['My updated folder name', 1]
            );
            done();
        });
        // Make the call *without an ID*
        folders.upsertFolder({
            params: {},
            body: { name: 'My new folder' }
        });
        it('should be called as an INSERT when ID is not passed', (done) => {
            expect(
                pool.query
            ).toBeCalledWith(
                'INSERT INTO folder VALUES (DEFAULT, $1, NOW(), NOW()) RETURNING *',
                ['My new folder']
            );
            done();
        });
    });
    describe('deleteFolder', () => {
        // Make the call
        folders.deleteFolder({ params: { id: 1 } });
        it('should be called', (done) => {
            expect(pool.query).toHaveBeenCalled();
            done();
        });
        it('should be passed correct parameters', (done) => {
            expect(
                pool.query
            ).toBeCalledWith('DELETE FROM folder WHERE id = $1', [1]);
            done();
        });
    });
    describe('folderCounts', () => {
        const mockedFn = jest.fn(() =>
            new Promise((resolve) => {
                return resolve({
                    rows: [
                        { id: 1, unseen_count: 2, folder: 2, code: 2 },
                        { id: 2, unseen_count: 0, folder: 1, code: 1 },
                        { id: 3, unseen_count: 1, folder: 3, code: 3 }
                    ],
                    rowCount: 3
                });
            })
        );
        it(
            'allFolders, allQueries & getUserUnseenCounts should be called',
            async (done) => {
                await folders.folderCounts(
                    { user: { id: 1 } },
                    mockedFn,
                    mockedFn,
                    mockedFn
                );
                expect(mockedFn).toHaveBeenCalledTimes(3);
                done();
            }
        );
        it(
            'should return the correct result',
            async (done) => {
                const result = await folders.folderCounts(
                    { user: { id: 1 } },
                    mockedFn,
                    mockedFn,
                    mockedFn
                );
                expect(result).toEqual({
                    '1': 1,
                    '2': 1,
                    '3': 1,
                    'ALL_QUERIES': 1,
                    'UNREAD': 2
                });
                done();
            }
        );
        it(
            'should throw in the event of an error',
            async (done) => {
                await expect(folders.folderCounts({
                    user: { id: 1 }
                })).rejects.toBeTruthy();
                done();
            }
        );

    });
});
