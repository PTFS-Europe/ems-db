const { Pool, types } = require('pg');

// Do not parse TIMESTAMP{TZ} columns into JS Date objects,
// it messes with the OpenAPI validator
const TYPE_TIMESTAMP = 1114;
const TYPE_TIMESTAMPTZ = 1184;
const noParse = (v) => v;
types.setTypeParser(TYPE_TIMESTAMP, noParse);
types.setTypeParser(TYPE_TIMESTAMPTZ, noParse);

const pool = new Pool();

module.exports = pool;
