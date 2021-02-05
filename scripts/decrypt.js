const readline = require('readline');
const { decrypt } = require('../helpers/encryption');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

(() => {

    rl.question('Enter encryption key: ', async (key) => {
        process.env.KEY = key;
        const decrypted = await decrypt(process.argv[2]);
        console.log(decrypted);
        rl.close();
    });

})();

