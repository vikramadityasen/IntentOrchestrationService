'use strict';

const prompt = require('souffleur');
const alexaParse = require('./parse');
const alexaReply = require('./reply');
const envUtils = require('../../utils/env-utils');

module.exports = function alexSetup(api, bot, logError, optionalParser, optionalResponder) {
    let parser = optionalParser || alexaParse;
    let responder = optionalResponder || alexaReply

    
    api.post('/alexa', function (request, response) {
        // console.log(request.body.request.intent)
        return bot(parser(request.body), request)
            .then(botReply => responder(botReply, envUtils.decode(process.env.alexaAppName),response))
            .catch(logError);
    });
}