const DBMigrate = require('db-migrate');
const resolvers = require('./resolvers');

const mig = DBMigrate.getInstance(true, {
    cwd: __dirname,
    config: __dirname + '/database.json'
});

const emsDb = {
    reset: () => mig.reset(),
    update: () => mig.up(),
    resolvers
};

module.exports = emsDb;
