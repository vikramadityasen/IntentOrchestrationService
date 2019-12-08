'use strict';

const DialogflowClient = require('./dialogflowclient');
const FacebookBuilder = require('./facebook/builder');
const AlexaBuilder = require('./alexa/builder');
const ChatBuilder = require('./chat/builder');
const IvrBuilder = require('./ivr/builder');
const GoogleBuilder = require('./google/builder');
const constants = require('./constants');
const util = require('util');


function MessageProcessor(
    request,
    dialogflowClientAccessToken,
    chatbaseApiKey
) {
    var dialogflowClient = new DialogflowClient(dialogflowClientAccessToken);
    var messageBuilder = null;
    var messageBuilders = {
        facebook: new FacebookBuilder(),
        alexa: new AlexaBuilder(),
        chat: new ChatBuilder(),
        google: new GoogleBuilder(),
        ivr: new IvrBuilder()
    };

    var configureMessageBuilder = function (platform) {
        // Set the proper type of output message builder
        // according to the message source platform
        // and load localized resources into it
        var platformName = platform.split('-');
        if (messageBuilders[platformName[0]]) {
            messageBuilder = messageBuilders[platformName[0]];
        }
    };

    this.processMessage = function (inputMessage) {
        // Check if a valid message was sent
        // and process according to its type
        switch (inputMessage.type) {
            case constants.GOOGLE: {
                return processGoogleMessage(inputMessage, request);
                break;
            }
            case constants.ALEXA: {
                return processAlexaMessage(inputMessage, request);
                break;
            }
            case constants.IVR: {
                return processIVRMessage(inputMessage, request);
            }
            default: {
                return processTextMessage(inputMessage);
                break;
            }
        }
    }

    var buildResponse = function (parsedMessage, inputMessage) {
        // console.log('MP---parsedMessage is + ',util.inspect(parsedMessage, {depth: null}));
         // console.log('MP---inputMessage is + ',inputMessage);

        configureMessageBuilder(parsedMessage.type);
        return sendCannedResponse(parsedMessage, parsedMessage.originalRequest.queryResult);
    };

    var sendCannedResponse = function (parsedMessage, inputMessage) {
        return new Promise((resolve, reject) => {
            var response = "Sorry. I did not understand your message."
            // If one or more canned responses have been provided by Dialogflow,
            // choose one from the list and return it
            if (parsedMessage.responses && parsedMessage.responses.length > 0) {
                response = parsedMessage.responses[Math.floor(Math.random() * parsedMessage.responses.length)];
            }
            messageBuilder.renderMessage(response, parsedMessage, inputMessage).then(function (res) {
                // console.log('cannedresponse>>>',res);
                resolve(res);
            }).catch((err) => {
                console.log("Message Processor - Error occurred while rendering message", err);
            });
        });
    };

    var processGoogleMessage = function (inputMessage, request) {
        configureMessageBuilder(inputMessage.type);
        var type = request.body.conversation.type;
        if (type === 'NEW') {
            return messageBuilder.renderWelcome(inputMessage);
        } else {
            return processTextMessage(inputMessage);
        }
    }

    var processAlexaMessage = function (inputMessage, request) {
        return new Promise((resolve, reject) => {
            configureMessageBuilder(inputMessage.type);
            var intent = getAlexaIntent(request.body);
            if (intent === 'ExitApp') {
                messageBuilder.renderGoodbye().then(function (resp) {
                    resolve(resp);
                }).catch(function (err) {
                    resolve(err);
                });
            } else {
                messageBuilder.renderMessage(inputMessage, request).then(function (resp) {
                    resolve(resp);
                }).catch(function (err) {
                    resolve(err);
                });
            }
        });

    }

    var getAlexaIntent = function (alexaPayload) {
        return alexaPayload &&
            alexaPayload.request &&
            alexaPayload.request.type === 'IntentRequest' &&
            alexaPayload.request.intent &&
            alexaPayload.request.intent.name;
    };

    var processIVRMessage = function (inputMessage, request) {
        return new Promise((resolve, reject) => {
            // Build a response for the user
            buildResponse(inputMessage, '').then(function (outputMessage) {
                // console.log('I am caught!!!!!',outputMessage);
                resolve(outputMessage);
            }).catch(function (error) {
                resolve(constants.ERROR_MSG)
            });
        });
    }

    var processTextMessage = function (inputMessage) {
        return new Promise((resolve, reject) => {
            dialogflowClient.parse(inputMessage)
                .then(function (inputMessage, parsedMessage) {
                    // Build a response for the user
                    buildResponse(parsedMessage, inputMessage).then(function (outputMessage) {
                        resolve(outputMessage);
                    }).catch(function (error) {
                        resolve(constants.ERROR_MSG)
                    });
                }.bind(null, inputMessage)).catch((err) => {
                    console.log("Message Processor - Error occurred while processTextMessage message", err);
                });
        });
    };
}


module.exports = MessageProcessor;