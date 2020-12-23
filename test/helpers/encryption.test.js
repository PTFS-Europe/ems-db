// The thing we're testing
const { encrypt, decrypt } = require('../../helpers/encryption');

process.env.KEY = 'B4QEGpy_Ad_MjuEIAoSNWhegBHrNBItN2aV1Ua1g2A4';

describe('encypt', () => {
    // For a given key, we receive something not null
    // back. This is about as meaningful as we can hope to get with
    // this test as what we get back is not predictable
    it('should return a correctly encrpypted string', async (done) => {
        const result = await encrypt('Death Star Plans');
        expect(result).not.toBeNull();
        done();
    });
});

describe('decrypt', () => {
    // For a given cipher text, check we get back what we expect
    it('should return a correctly decrpypted string', async (done) => {
        const result = await decrypt('9ec-OZZ6HZzE8gG9VheeNYlMT_rrvTD8Lg1LPjUjD1fyjq1F-4LcM4ufiqdlVCfzoW3k4sSp-O0');
        expect(result).toEqual('Death Star Plans');
        done();
    });
    it('should throw when passed an invalid cipher text', async (done) => {
        await expect(
            decrypt('9ac-OZZ6HZzE8gG9VheeNYlMT_rrvTD8Lg1LPjUjD1fyjq1F-4LcM4ufiqdlVCfzoW3k4sSp-O0')
        ).rejects.toBeTruthy();
        done();
    });
});