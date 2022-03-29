"use strict";
const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");

// Get template

exports.parseTemplate = function (fileName, data) {
    return new Promise(function (resolve, reject) {
        fs.readFile(path.join(__dirname, "mail_templates", fileName + ".html"), 'utf8', function (err, html) {
            if (err) return reject(err);
            for (key in data) {
                html = html.replaceAll(`{{${key}}}`, data[key]);
            }
            resolve(html);
        });
    })
}

exports.sendMail = function (settings, to, template) {
    return new Promise(function (resolve, reject) {

        let transporter = nodemailer.createTransport(settings);

        // send mail with defined transport object
        transporter.sendMail({
            from: settings.from, // sender address
            to: to, // list of receivers
            subject: template.subject, // Subject line
            text: template.text, // plain text body
            html: template.html, // html body
        })
            .then((info) => resolve(info))
            .catch((err) => reject(err));
    })
}