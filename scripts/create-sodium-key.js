const _sodium = require('libsodium-wrappers');

(async () => {
    
    await _sodium.ready;

    const sodium = _sodium;

    const key = sodium.crypto_secretbox_keygen();

    console.log(sodium.to_base64(key));

})();

