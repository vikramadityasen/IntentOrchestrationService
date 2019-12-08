'use strict';
const planner = require('../../services/journeyPlanner/journeyPlanner');
var journeyPlanner = new planner();
const dateTimeUtil = require('../../utils/dateTimeUtil');
var dateTime = new dateTimeUtil();
const sessionManager = require('./../../utils/sessionmanager');
const constants = require('./../constants');
const intents = require('../intents');
const botBuilder = require('claudia-bot-builder');
const fbTemplate = botBuilder.fbTemplate;
const messagesObj = require('./../resources/messages.json');
const welecomeIntentRealization = require('./intentRealization').welcome;
const proceedWithBot = require('./intentRealization').proceedWithBot;
const proceedWithPerson = require('./intentRealization').proceedWithPerson;


function FacebookBuilder() {

    this.renderMessage = function (message, parsedMessageFromDiaglogFlow, originalInputMessage) {
        return new Promise((resolve, reject) => {
            // If an intent has been successfully decoded,
            // return a proper message
            if (!parsedMessageFromDiaglogFlow.actionIncomplete) {
                // here check if we need specific response for some
                // specific intent
                // or in case if we need to make a request to 3rd party API
                // and ge repsonse
                switch (parsedMessageFromDiaglogFlow.intent) {
                    case intents.QUICK_JOURNEY: {
                        // Invoke Intent Realization service here to get the response
                        const departTime = parsedMessageFromDiaglogFlow.parameters[constants.DEPART_DATETIME][constants.DATETIME].replace("Z", "")
                        const locationFrom = parsedMessageFromDiaglogFlow.parameters[constants.DEPARTING_STATION]
                        const locationTo = parsedMessageFromDiaglogFlow.parameters[constants.DESTINATION_STATION]
                        resolve(journeyPlanner.getFBResponse(locationFrom, locationTo, dateTime.getTime(originalInputMessage.text, departTime))
                            .then(function (resp) {
                                sessionManager.destroySession(originalInputMessage.sender);
                                return resp
                            }).catch((err) => {
                                sessionManager.destroySession(originalInputMessage.sender);
                                console.log("error is ", err)

                            }));
                        break;
                    }
                    case intents.WELCOME: {
                        resolve(welecomeIntentRealization());
                        break;
                    }
                    case intents.PROCEED_WITH_BOT: {
                        resolve(proceedWithBot());
                        break;
                    }
                    case intents.PROCEED_WITH_PERSON: {
                        resolve(proceedWithPerson());
                        break;
                    }
                    case intents.INPUT_HELP: {
                        const genericHelp = new fbTemplate.Text(messagesObj.helpReplyText).get();
                        resolve(genericHelp);
                        break;
                    }
                    default: resolve(message)
                }
                sessionManager.destroySession(originalInputMessage.sender);
            } else {
                // If no custom response has been built, return a canned response
                // Such responses are set in Dialogflow.
                switch (parsedMessageFromDiaglogFlow.intent) {
                    case intents.QUICK_JOURNEY: {
                      
                    }
                    default: resolve(message)
                }
            }
        });
    };
}
module.exports = FacebookBuilder;