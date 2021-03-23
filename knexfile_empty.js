var path = require('path');

var databasePath = path.join(__dirname, "database.db")
module.exports = {

    development: {
        client: 'sqlite3',
        useNullAsDefault: true,
        connection: {
            filename: databasePath
        }
    },

    production: {
        client: 'mysql',
        useNullAsDefault: true,
        connection: {
            host: '127.0.0.1',
            user: 'USERNAME',
            password: 'PASSWORD',
            database: 'DATABASE'
        }
    }
};
