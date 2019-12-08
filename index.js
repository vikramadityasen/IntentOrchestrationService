#!/usr/bin/env node

var express = require("express");
var createError = require('http-errors');
var cookieParser = require('cookie-parser');
var bodyParser = require("body-parser");
var logger = require('morgan');
var botBuilder = require("./bot/botBuilder.js");
const http = require('http');
const normalizePort = require('normalize-port');
var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(logger('dev'));
app.use(cookieParser());
app.use(express.static('public'))

var port = normalizePort(process.env.PORT || '3000');


const enabledPlatforms = [
    // 'facebook',
    // 'alexa',
    // 'chat',
    // 'google', 
    'ivr'
];

botBuilder(app), { platforms: enabledPlatforms };

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    // render the error page
    res.status(err.status || 500);
    res.json({
        'error': err.message
    });
});


var server = app.listen(port, function () {
    console.log("app running on port.", server.address().port);
});

module.exports = server