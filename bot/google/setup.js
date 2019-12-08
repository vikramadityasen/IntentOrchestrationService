'use strict';
const googleParse = require('./parse')
const googleReply = require('./reply');
const envUtils = require('../../utils/env-utils');

module.exports = function googleSetup(api, bot, logError, optionalParser, optionalResponder) {
    let parser = googleParse || optionalParser;
    let responder = optionalResponder || googleReply;

    api.post('/google', function (request, response) {
       return bot(parser(request.body), request)
        .then(botReply => responder(botReply, envUtils.decode(process.env.googleAppName),response))
        .catch(logError);
    });
}


