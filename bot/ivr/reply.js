'use strict';

const util = require('util');
const df = require('../dialogflowclientV2');
const rp = require('minimal-request-promise'),
    breakText = require('../../utils/breaktext');

module.exports = function ivrReply(recipient, message, response) {

    // console.log('reply msg is>>>', util.inspect(recipient, {depth: null}));
    var sendSingle = function sendSingle(message) {
        if (typeof message === 'object' && typeof message.claudiaPause === 'number') {
            return new Promise(resolve => setTimeout(resolve, parseInt(message.claudiaPause, 10)));
        }
        // let dfv2 = new df();
        // dfv2.sendTextMessageToDialogFlow(message,recipient)

        /* const resp = {
            google: {
                expectUserResponse: true,
                richResponse: {
                    items: [
                        {
                            simpleResponse: {
                                textToSpeech: message,
                                displayText: message
                            }
                        }
                    ]
                }
            }

        }; */

        const resp = {
            "fulfillmentText": "Thank you for verification. Please state the nature of the issue? Was it a crash or your vehicle was stolen or burned?",
            "fulfillmentMessages": [
                {
                    "text": {
                        "text": [
                            message.text
                        ],
                    }
                }
            ],
            "source": "example.com",
            "payload": {
                "google": {
                    "expectUserResponse": true,
                    "richResponse": {
                        "items": [
                            {
                                "simpleResponse": {
                                    "textToSpeech": message,
                                    "displayText": message
                                }
                            }
                        ]
                    }
                }
            },
          }

        //  const messageBody = {
        //      speech : message,
        //      displayText : message
        //  };
        // if (message.hasOwnProperty('notification_type')) {
        //     messageBody.notification_type = message.notification_type;
        //     delete message.notification_type;
        // }
        // if (message.hasOwnProperty('sender_action')) {
        //     messageBody.sender_action = message.sender_action;
        // } else {
        //     messageBody.message = message;
        // }
        // const botResponse = {
        //     headers: {
        //         'Content-Type': 'application/json'
        //     },
        //     body: messageBody
        // };
        response.status(200).json(resp)
    },
        sendAll = function () {
            if (!messages.length) {
                return Promise.resolve();
            } else {
                return sendSingle(messages.shift());
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