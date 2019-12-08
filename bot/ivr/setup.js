const crypto = require('crypto');
const prompt = require('souffleur');
const rp = require('minimal-request-promise');
const ivrParse = require('./parse')
const ivrReply = require('./reply');
const cors = require('cors');
const util = require('util');


module.exports = function ivrSetup(api, bot, logError, optionalParser, optionalResponder) {
    let parser = ivrParse || optionalParser;
    let responder = optionalResponder || ivrReply;
    api.options('/ivr', cors());
    api.post('/ivr', cors(), function (request, response) {
       let ivrHandle = parsedMessage => {
            if (parsedMessage) {
                var recipient = (parsedMessage.sender).split(/[/ ]+/).pop();
                console.log('recipient>>>', recipient)
                // let parsedmsg = bot(parsedMessage, request)
                return Promise.resolve(parsedMessage).then(parsedMessage => bot(parsedMessage, request))
                    .then(botResponse => responder(recipient, botResponse, response))
                    .catch(logError);
            }
        };
        return Promise.resolve(ivrHandle(parser(request.body))).then(() => 'ok');
    });
}