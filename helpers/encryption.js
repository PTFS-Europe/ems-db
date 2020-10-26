const _sodium = require('libsodium-wrappers');

const encryption = {
    encrypt: async (toEncrypt) => {
        await _sodium.ready;
        const sodium = _sodium;

        // Get the key
        const key = sodium.from_base64(process.env.KEY);

        // Generate a nonce and the cipher text
        const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
        const ciphertext = sodium.crypto_secretbox_easy(toEncrypt, nonce, key);
        
        // Prepend the nonce to the cipher text, they're stored
        // together
        let merged = new Uint8Array(nonce.length + ciphertext.length);
        merged.set(nonce);
        merged.set(ciphertext, nonce.length);

        return sodium.to_base64(merged);
    },
    decrypt: async (toDecryptWithNonce) => {
        await _sodium.ready;
        const sodium = _sodium;

        const key = sodium.from_base64(process.env.KEY);
        toDecryptWithNonce = sodium.from_base64(toDecryptWithNonce);

        if (toDecryptWithNonce.length < sodium.crypto_secretbox_NONCEBYTES + sodium.crypto_secretbox_MACBYTES) {
            throw 'Invalid cyphertext and/or nonce';
        }

        const nonce = toDecryptWithNonce.slice(0, sodium.crypto_secretbox_NONCEBYTES);
        const ciphertext = toDecryptWithNonce.slice(sodium.crypto_secretbox_NONCEBYTES);
        return sodium.crypto_secretbox_open_easy(ciphertext, nonce, key);
    }
};

module.exports = encryption;