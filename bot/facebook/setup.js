const crypto = require('crypto');
const prompt = require('souffleur');
const rp = require('minimal-request-promise');
const fbParse = require('./parse')
const fbReply = require('./reply');
const sendTypingOn = require('./reply').sendTypingOn;
const showDetails = require('./reply').showDetails;
const markSeen = require('./reply').markSeen;

module.exports = function fbSetup(api, bot, logError, optionalParser, optionalResponder) {

    let parser = fbParse || optionalParser;
    let responder = optionalResponder || fbReply;

    api.get('/facebook', function (request, response) {
        let resp = ""
        if (request.query['hub.verify_token'] === process.env.facebookVerifyToken) {
            resp = request.query['hub.challenge'];
        } else {
            logError(`Facebook can't verify the token. It expected '${process.env.facebookVerifyToken}', 
            but got '${request.query['hub.verify_token']}. 
            Make sure you are using the same token you set in
             'facebookVerifyToken' stage env variable.`);
            resp = 'Error';
        }
        response.type('text/plain');
        response.status(200).send(resp)
    });

    api.post('/facebook', function (request, response) {
        
        //console.log("in POST Facebook",request.body.entry[0].messaging[0].delivery);
        let arr = [].concat.apply([], request.body.entry.map(entry => entry.messaging))
        // console.log('arr',arr[0]);
        if(arr[0] ) {
            try {
                if(arr[0] && arr[0].sender && arr[0].sender.id) {
                    if(request.body.entry[0].messaging[0].message) {
                        sendTypingOn(arr[0].sender.id,process.env.facebookAccessToken);
                        markSeen(arr[0].sender.id,process.env.facebookAccessToken);
                    }
                }    
            } catch (error) {
                console.log('Error in sending typing on',error);
            }
            if(arr[0].postback){
                console.log('arr',arr[0]);
                showDetails(arr[0],process.env.facebookAccessToken)
                response.sendStatus('200')
            }else{            
                let fbHandle = parsedMessage => {
                    if (parsedMessage) {
                        var recipient = parsedMessage.sender;
                        return Promise.resolve(parsedMessage).then(parsedMessage => bot(parsedMessage, request))
                            .then(botResponse => responder(recipient, botResponse, process.env.facebookAccessToken,response))
                            .catch(logError);
                    }
                };
                Promise.all(arr.map(message => fbHandle(parser(message))))
                    .then(() => response.sendStatus('200'))
                    .catch(function(err){
                        // response.sendStatus('200');
                    })
            }
        } else {
            // We are not interested in this message. so simply send 200
            console.log('Responding 200 to FB');
            response.sendStatus('200');
        }
        
    });
}