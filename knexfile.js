var path = require('path');

var databasePath = path.join(__dirname, "database.db")


module.exports = {

    development: {
        client: 'mysql',
        useNullAsDefault: true,
        connection: {
            host: '127.0.0.1',
            user: 'develop',
            password: 'pD6xvQ582kBF9sNSxXst',
            database: 'pubquiz_kday'
        }
    },

    production: {
        client: 'mysql',
        useNullAsDefault: true,
        connection: {
            host: '127.0.0.1',
            user: 'develop',
            password: 'pD6xvQ582kBF9sNSxXst',
            database: 'pubquiz_kday'
        }
    }
};