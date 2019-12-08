'use strict';

const planner = require('../../services/journeyPlanner/journeyPlanner');
var journeyPlanner = new planner();
const dateTimeUtil = require('../../utils/dateTimeUtil');
var dateTime = new dateTimeUtil();
const sessionManager = require('./../../utils/sessionmanager');
const constants = require('./../constants');
const intents = require('../intents');


function ChatBuilder() {

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
                      journeyPlanner.getFBResponse(locationFrom,locationTo, dateTime.getTime(originalInputMessage.text, departTime))
                        .then(function (resp) {
                                sessionManager.destroySession(originalInputMessage.sender);
                                resolve(resp);
                            }).catch((err) => {
                                console.log("error is ", err)
                                sessionManager.destroySession(originalInputMessage.sender);
                                reject(constants.ERROR_MSG);
                            });
                        break;    
                    }
                    default: resolve(message)
                }
                sessionManager.destroySession(originalInputMessage.sender);
            } else {
                // If no custom response has been built, return a canned response
                // Such responses are set in Dialogflow.
                switch (parsedMessageFromDiaglogFlow.intent) {
                    case intents.QUICK_JOURNEY : {
                      
                    }
                    default: resolve(message)
                }
            }
        });
    };
}
module.exports = ChatBuilder;