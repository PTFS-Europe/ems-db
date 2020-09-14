const fs = require('fs');

const start = function (argv) {
    // Create an SQL file to create our instance
    const template = './create-schema.sql';
    let dbTpl = fs.readFileSync(`${__dirname}/${template}`, 'utf8');
    const dbOut = `/tmp/create_${argv.i}`;
    dbTpl = dbTpl.replace(/insert_db_user/g, argv.i);
    dbTpl = dbTpl.replace(/insert_db_password/g, argv.p);
    dbTpl = dbTpl.replace(/insert_db_schema/g, argv.i);
    fs.writeFileSync(dbOut, dbTpl, 'utf8');
    if (!fs.existsSync(dbOut)) {
        throw new Error('Unable to create SQL file');
    }

    // Use the file and create the user & schema
    const pgUid = getUserId('postgres');
    const createSchemaOut = doCmd({
        cmd: '/usr/bin/psql',
        params: ['-d', 'ems', '-f', dbOut],
        opts: {
            cwd: '/var/lib/postgresql',
            uid: pgUid
        }
    });
    fs.unlinkSync(dbOut);

    // Check all went well with creating the DB
    if (createSchemaOut instanceof Error || createSchemaOut.match(/exists/)) {
        throw new Error(`Create schema & user failed: ${createSchemaOut}`);
    } else {
        if (createSchemaOut.match(/failed/)) {
            throw new Error('Unable to populate DB user and perms');
        }
    }
    return true;

    function getUserId(user) {
        let u = doCmd({
            cmd: '/usr/bin/id',
            params: ['-u', user]
        });
        u = u.replace(/\D/g, '');
        return parseInt(u);
    }

    function doCmd(args) {
        try {
            const result = require('child_process').spawnSync(
                args.cmd,
                args.params || [],
                args.opts || {}
            );
            if (!result.output) {
                throw new Error(result.error);
            } else {
                return result.output.toString('utf8');
            }
        } catch (e) {
            return new Error(e);
        }
    }
};

module.exports = {
    start: start
};
