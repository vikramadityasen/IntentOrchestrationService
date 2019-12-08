'use strict';

const processor = require('../../services/claimProcessor/claimProcessor');
var claimProcessor = new processor();
const dateTimeUtil = require('../../utils/dateTimeUtil');
var dateTime = new dateTimeUtil();
const sessionManager = require('./../../utils/sessionmanager');
const constants = require('./../constants');
const processorConstants = require('../../services/claimProcessor/processorConstants');
const intents = require('../intents');


function IvrBuilder() {
    this.renderMessage = function (message, parsedMessageFromDiaglogFlow, originalInputMessage) {
        // console.log('i am here: '+util.inspect(parsedMessageFromDiaglogFlow, {depth: null}));
        return new Promise((resolve, reject) => {
            // If an intent has been successfully decoded,
            // return a proper message
            if (!parsedMessageFromDiaglogFlow.actionIncomplete) {
                // here check if we need specific response for some
                // specific intent
                // or in case if we need to make a request to 3rd party API
                // and ge repsonse
                switch (originalInputMessage.intent.displayName) {
                    case intents.AUTHENTICATION: {
                        // Invoke Intent Realization service here to get the response
                        const registrationNumber = originalInputMessage.parameters['registrationNumber'];
                        // console.log('registration>>>>>', registrationNumber);

                        let response = 'Sorry, can you please say that again?';
                        if (registrationNumber) {
                            claimProcessor.getIVRResponse(processorConstants.CUSTOMER, processorConstants.GETCUSTOMER, registrationNumber)
                                .then(function (resp) {
                                    console.log('resp is>>>>', resp);
                                    resolve(resp);
                                }).catch((err) => {
                                    console.log("error is ", err);
                                    reject(constants.ERROR_MSG);
                                });
                        }
                        break;
                    }
                    // case intents.QUICK_JOURNEY: {
                    //     // Invoke Intent Realization service here to get the response
                    //     const departTime = parsedMessageFromDiaglogFlow.parameters[constants.DEPART_DATETIME][constants.DATETIME].replace("Z", "")
                    //     const locationFrom = parsedMessageFromDiaglogFlow.parameters[constants.DEPARTING_STATION]
                    //     const locationTo = parsedMessageFromDiaglogFlow.parameters[constants.DESTINATION_STATION]
                    //   claimProcessor.getFBResponse(locationFrom,locationTo, dateTime.getTime(originalInputMessage.text, departTime))
                    //     .then(function (resp) {
                    //            // sessionManager.destroySession(originalInputMessage.sender);
                    //             resolve(resp);
                    //         }).catch((err) => {
                    //             console.log("error is ", err)
                    //           //  sessionManager.destroySession(originalInputMessage.sender);
                    //             reject(constants.ERROR_MSG);
                    //         });
                    //     break;    
                    // }
                    default: resolve(message)
                }
                // sessionManager.destroySession(originalInputMessage.sender);
            } else {
                // If no custom response has been built, return a canned response
                // Such responses are set in Dialogflow.
                switch (parsedMessageFromDiaglogFlow.intent) {
                    case intents.AUTHENTICATION: {
                    }
                    default: resolve(message)
                }
            }
        });
    };
}
module.exports = IvrBuilder;