var session = require('express-session');
var MemoryStore = require('memorystore')(session)

// Define storage for sessions
const store = new MemoryStore({ checkPeriod: 86400000 })

// Define session settings
exports.handler = session({
    key: 'user_sid',
    secret: "thisisaverysecretphrasejusttodosomethings",
    httpOnly: true,
    secure: true,
    resave: false,
    saveUninitialized: false,
    cookie: {
        expires: 86400000
    },
    store
});