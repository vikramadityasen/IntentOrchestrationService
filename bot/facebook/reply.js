'use strict';

const rp = require('minimal-request-promise'),
    constants = require('../constants'),
    tocMappings = require('../../public/tocMappings'),
    breakText = require('../../utils/breaktext');
const request = require('request');
const botBuilder = require('claudia-bot-builder');
const fbTemplate = botBuilder.fbTemplate;
const messagesObj = require('./../resources/messages.json');
const titleCase = require('title-case');
var dateFormat = require('dateformat');
const imageManager = require('./../../utils/imageManager');

module.exports = function fbReply(recipient, message, fbAccessToken, response) {
    var sendSingle = function sendSingle(message) {
        if (typeof message === 'object' && typeof message.claudiaPause === 'number') {
            return new Promise(resolve => setTimeout(resolve, parseInt(message.claudiaPause, 10)));
        }
        const messageBody = {
            recipient: {
                id: recipient
            }
        };
        if (message.hasOwnProperty('notification_type')) {
            messageBody.notification_type = message.notification_type;
            delete message.notification_type;
        }
        if (message.hasOwnProperty('sender_action')) {
            messageBody.sender_action = message.sender_action;
        } else {
            messageBody.message = message;
        }
        const options = {
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(messageBody)
        };
        var fbEndPoint = constants.FBENDPOINT.concat("?access_token=").concat(fbAccessToken);
        return rp.post(fbEndPoint, options)

    },
        sendAll = function () {
            if (!messages.length) {
                return Promise.resolve();
            } else {
                return sendSingle(messages.shift()).then(sendAll);
            }
        },
        messages = [];

    function breakTextAndReturnFormatted(message) {
        return breakText(message, 640).map(m => ({ text: m }));
    }

    if (typeof message === 'string') {
        messages = breakTextAndReturnFormatted(message);
    } else if (Array.isArray(message)) {
        message.forEach(msg => {
            if (typeof msg === 'string') {
                messages = messages.concat(breakTextAndReturnFormatted(msg));
            } else {
                messages.push(msg);
            }
        });
    } else if (!message) {
        return Promise.resolve();
    } else {
        messages = [message];
    }
    return sendAll();
}

module.exports.showDetails = function(request, fbAccessToken){
    if(request && request.postback && request.postback.payload){
        let newMessage = new fbTemplate.List("compact");
        var payload  = JSON.parse(request.postback.payload)
        if(constants.SHOW_DETAILS == payload.action){
            payload.legs.forEach(function (leg) {
                var subTitle = messagesObj.showDetailsSubTitle
                .replace("#DTIME", dateFormat(leg.dtime, "ddd, d mmmm yyyy h:MM:ss TT"))
                .replace("#ATIME", dateFormat(leg.atime, "ddd, d mmmm yyyy h:MM:ss TT"));
                var operator = "default toc";
                var imgURL = constants.LOGO_BASE_PATH.concat(tocMappings.getmapping(operator));
                newMessage
                .addBubble(titleCase(leg.from)+" to "+titleCase(leg.to), subTitle)
                .addImage(imgURL)                
            });
            var messageData = {
                "recipient": {
                    "id": request.sender.id
                },
                "message": newMessage.get()        
            };
            callSendAPI(messageData,fbAccessToken); 
        }
    }
}

module.exports.sendTypingOn = function (recepientid, fbAccessToken) {
    var messageData = {
        "recipient": {
            "id": recepientid
        },
        "sender_action": "typing_on"
    };
    callSendAPI(messageData, fbAccessToken);
}

module.exports.markSeen = function (recepientid, fbAccessToken) {
    var messageData = {
        "recipient": {
            "id": recepientid
        },
        "sender_action": "mark_seen"
    };
    callSendAPI(messageData, fbAccessToken);
}

function callSendAPI(messageData, fbAccessToken) {
    request({
        uri: constants.FBENDPOINT,
        qs: {
            access_token: fbAccessToken
        },
        method: 'POST',
        json: messageData

    }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var recipientId = body.recipient_id;
            var messageId = body.message_id;
            if (messageId) {
                console.log("Successfully sent message with id %s to recipient %s",
                    messageId, recipientId);
            } else {
                 console.log("Successfully called Send API for recipient %s",
                 recipientId);
            }
        } else {
            console.error("Failed calling Send API", response);
        }
    });
}