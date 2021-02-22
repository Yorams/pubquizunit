var session = require('express-session');
const database = require("./knexfile");
const knex = require('knex')(database.development);
const KnexSessionStore = require('connect-session-knex')(session);
var MemoryStore = require('memorystore')(session)

// Define storage for sessions
//const store = new KnexSessionStore({ knex });

const store = new MemoryStore({ checkPeriod: 86400000 })

// Define session settings
exports.handler = session({
    key: 'user_sid',
    secret: "blaaaaat",
    resave: false,
    saveUninitialized: false,
    cookie: {
        expires: 99999999999
    },
    store
});
/*
// Session database cleanup functions
setInterval(() => {
    store.length().then((length) => {
        console.log(`There are ${JSON.stringify(length)} sessions`);
    });
}, 2000);

setInterval(() => {
    store.clear().then((length) => {
        console.log(`Cleared ${JSON.stringify(length)} sessions`);
    });
}, 30000);
*/