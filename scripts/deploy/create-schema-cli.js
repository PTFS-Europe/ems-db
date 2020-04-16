const creator = require('./create-schema');

// Grab arguments
const argv = require('yargs')
    .usage('Usage: $0 -i [str] -p [str] -d [str]')
    .alias('i', 'instance')
    .alias('p', 'password')
    .option('d', {
        alias: 'database',
        describe: 'Database name',
        demand: false,
        default: 'ems'
    })
    .describe('i', 'A name for the instance')
    .describe('p', 'A database password for this instance user')
    .demandOption(['i', 'p']).argv;

const result = creator.start(argv);

if (result instanceof Error) {
    console.log(`${result.name}: ${result.message}`);
} else {
    console.log('Schema creation complete');
}
