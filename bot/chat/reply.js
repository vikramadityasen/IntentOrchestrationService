'use strict';

const rp = require('minimal-request-promise'),
    breakText = require('../../utils/breaktext');

module.exports = function chatReply(recipient, message, response) {
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
        const botResponse = {
            headers: {
                'Content-Type': 'application/json'
            },
            body: messageBody
        };
        response.status(200).json(botResponse)
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