'use strict';

let MessageProcessor = require('./messageprocessor');
const fbSetup = require('./facebook/setup');
const alexaSetup = require('./alexa/setup')
const chatSetup = require('./chat/setup')
const ivrSetup = require('./ivr/setup');
const constants = require('./constants')
const googleSetup = require('./google/setup')

let logError = function (err) {
    console.error(err);
};

module.exports = function botBuilder(api, options) {
    let messageHandler = function (message, originalApiBuilderRequest) {
        var messageProcessor = new MessageProcessor(
            originalApiBuilderRequest,
            process.env.DIALOGFLOW_CLIENT_ACCESS_KEY,
            process.env.CHATBASE_API_KEY
        );
        
        return messageProcessor.processMessage(message)
    }
    let messageHandlerPromise = function (message, originalApiBuilderRequest) {
        return Promise.resolve(message).then(message => messageHandler(message, originalApiBuilderRequest)).catch(logError);
    };

    api.get('/', function (req, res) {
        res.status(200).json("Ok");
    });

    let isEnabled = function isEnabled(platform) {
        return !options || !options.platforms || options.platforms.indexOf(platform) > -1;
    };

    if (isEnabled(constants.FACEBOOK)) {
        fbSetup(api, messageHandlerPromise, logError);
    }

    if (isEnabled(constants.ALEXA)) {
        alexaSetup(api, messageHandlerPromise, logError);
    }
    if (isEnabled(constants.CHAT)) {
        chatSetup(api, messageHandlerPromise, logError);
    }
    if (isEnabled(constants.IVR)) {
       ivrSetup(api, messageHandlerPromise, logError);
    }
    if (isEnabled(constants.GOOGLE)) {
        googleSetup(api, messageHandlerPromise, logError);
    }




    return api
}

