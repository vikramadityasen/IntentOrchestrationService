const crypto = require('crypto');
const prompt = require('souffleur');
const rp = require('minimal-request-promise');
const chatParse = require('./parse')
const chatReply = require('./reply');
const cors =require('cors');
const util = require('util');


module.exports = function chatSetup(api, bot, logError, optionalParser, optionalResponder) {

    let parser = chatParse || optionalParser;
    let responder = optionalResponder || chatReply;
    api.options('/chat',cors()); 
    
    api.post('/chat', cors(), function (request, response) {
        //console.log('i am here: '+util.inspect(request.body.entry, {depth: null}));
        console.log('i am here: '+util.inspect(request.body, {depth: null}));
        
        let arr = [].concat.apply([], request.body.entry.map(entry => entry.messaging))
        let chatHandle = parsedMessage => {
            if (parsedMessage) {
                var recipient = parsedMessage.sender;
                return Promise.resolve(parsedMessage).then(parsedMessage => bot(parsedMessage, request))
                    .then(botResponse => responder(recipient, botResponse, response))
                    .catch(logError);
            }
        };
        return Promise.all(arr.map(message => chatHandle(parser(message))))
            .then(() => 'ok');
    });
}