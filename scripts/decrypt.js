const { decrypt }  = require('../helpers/encryption');


(async () => {

    const decrypted = await decrypt(process.argv[2]);
    console.log(decrypted);

})();

