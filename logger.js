const winston = require("winston");
var expressWinston = require('express-winston');
require('winston-daily-rotate-file');
var fs = require('fs')
var path = require('path');
const common = require("./common_functions");

var logDirectory = path.join(__dirname, 'log')

// ensure log directory exists
fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory)

// Log formats
const appFormat = winston.format.printf(({ level, message, timestamp, label }) => {
    return `${timestamp} ${level}: \u001b[33m${label}:\u001b[0m ${message}`;
});
const webFormat = winston.format.printf(({ level, message, timestamp }) => {
    return `${timestamp} ${level}: \u001b[33mWeb:\u001b[0m ${message}`;
});

// Console logger options
var loggerOptions = {
    console: {
        level: 'debug'
    }
}

var fileTransport = new (winston.transports.DailyRotateFile)({
    filename: path.join(logDirectory, 'app_%DATE%.log'),
    zippedArchive: false,
    maxSize: "1m",
    datePattern: "MM",
    maxFiles: "10",
    createSymlink: true,
    symlinkName: "app_current.log"
});

var appLogger = function (basename) {
    return winston.createLogger({
        level: "info",
        format: winston.format.combine(
            winston.format.label({ label: basename }),
            winston.format.timestamp({
                format: 'YYYY-MM-DD HH:mm:ss:SS'
            }),
            winston.format.errors({ stack: true }),
            winston.format.splat(),
            winston.format.colorize(),
            appFormat
        ),
        json: false,
        defaultMeta: { service: 'Smartled' },
        transports: [
            fileTransport,
            new winston.transports.Console(loggerOptions.console)
        ]
    })
}

// Logger instance for web
var expressLogger = expressWinston.logger({
    transports: [
        fileTransport,
        //new winston.transports.Console(loggerOptions.console)
    ],
    format: winston.format.combine(
        winston.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss:SS'
        }),
        winston.format.colorize(),
        webFormat
    ),
    level: "info",
    meta: false,
    msg: "{{req.connection.remoteAddress}} > {{req.method}} {{res.statusCode}} > {{req.url}} ({{res.responseTime}} ms)",
    colorize: true, // Color the text and status code
    skip: function (req, res) {
        // Skip 304 statuscode because that floods the log
        if (res.statusCode == 304) {
            return true;
        }
    }
})

module.exports = {
    app: appLogger,
    express: expressLogger
}