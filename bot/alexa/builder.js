'use strict';
const AlexaMessageBuilder = require('claudia-bot-builder').AlexaTemplate
const intents = require('../intents');
// const buildProximityResponse = require('./../../services/proximity/alexa/alexaProximityIntegtation');
const constants = require('./../constants');
// const getAlexaResponse = require('../../services/journeyPlanner/journeyPlanner').getAlexaResponse;
const standardMessages = require('./../resources/messages');
const moment = require('moment-timezone');



function AlexaBuilder() {
    // ========================================
    // PRIVATE PROPERTIES
    // ========================================

    this.renderGoodbye = function () {
        return new Promise((resolve, reject) => {
            resolve({
                response: {
                    outputSpeech: {
                        type: 'PlainText',
                        text: "Good Bye"
                    },
                    shouldEndSession: true
                }
            });
        });

    };

    this.renderMessage = function (message) {
        return new Promise((resolve, reject) => {
            switch (message.originalRequest.request.type) {
                case "LaunchRequest": {
                    resolve(new AlexaMessageBuilder()
                        .addSSML('<speak>'.concat(standardMessages.alexaWelcome).concat('</speak>'))
                        .keepSession()
                        .get());
                    break;
                }
                case "IntentRequest": {
                    resolve(this.processIntentRequest(message));
                    break;
                }
            }
        });

    };

    this.processIntentRequest = function (message) {
        return new Promise((resolve, reject) => {
            switch (message.originalRequest.request.intent.name.toLowerCase()) {
                case intents.AMAZON_StopIntent.toLowerCase(): {
                    resolve(new AlexaMessageBuilder()
                        .addSSML("<speak>Good Bye</speak>")
                        .get());
                    break;
                }
                case intents.AMAZON_Quickjourney.toLowerCase(): {
                    if (message.originalRequest.session && message.originalRequest.session.attributes) {
                        if (message.originalRequest.session.attributes[constants.NEXT_JOURNEY]) {
                            resolve(this.processQuickJourneyIntent(message, true).then(function (response) {
                                return adaptResponseForNextJourneyIntent(response);
                            }));
                        } else {
                            resolve(this.processQuickJourneyIntent(message, false));
                        }
                    } else {
                        resolve(this.processQuickJourneyIntent(message, false));
                    }

                    break;
                }
                case intents.AMAZON_HelpIntent.toLowerCase(): {
                    resolve(new AlexaMessageBuilder()
                        .addSSML('<speak>'.concat(standardMessages.alexaHelpText).concat('</speak>'))
                        .keepSession()
                        .get());
                    break;
                }
                case intents.AMAZON_NextJourney.toLowerCase(): {
                    resolve(this.processQuickJourneyIntent(message, true).then(function (response) {
                        return adaptResponseForNextJourneyIntent(response);
                    }));

                    break;
                }
                default: {
                    resolve(new AlexaMessageBuilder()
                        .addSSML("<speak>I am working on it.</speak>")
                        .keepSession()
                        .get());
                }
            }
        });

    }

    this.processQuickJourneyIntent = function (message, isNextJourneyIntent) {
        return new Promise((resolve, reject) => {
            if (message.originalRequest.session && message.originalRequest.session.attributes) {
                if (!message.originalRequest.session.attributes[constants.DEPARTING_STATION]) {
                    // we don't have departing station. 
                    // check if we have session attribute for retry. If we have retry then check with
                    // proximity service
                    if (!message.originalRequest.session.attributes[constants.DEPARTING_STATION.concat("retry")]) {
                        // no retry
                        resolve(buildResponseAskDepartingStation());
                    } else {
                        // We are in retry mode for departing station
                        if (!message.originalRequest.request.intent.slots[constants.ANYSTATION].value) {

                            // check if there is value in other slots
                            if (message.originalRequest.request.intent.slots[constants.DESTINATIONSTATION].value) {
                                // looks like we have a value in Destination slot. Stupid Alexa
                                // get the value from destination slot and
                                let query = message.originalRequest.request.intent.slots[constants.DESTINATIONSTATION].value
                               // resolve(queryProximitySearchForDepartingStation(message, query));
                            } else if (message.originalRequest.request.intent.slots[constants.DEPARTINGSTATION].value) {
                                // looks like we have a value in Destination slot. Stupid Alexa
                                // get the value from destination slot and
                                let query = message.originalRequest.request.intent.slots[constants.DEPARTINGSTATION].value
                                //resolve(queryProximitySearchForDepartingStation(message, query));
                            } else if (message.originalRequest.request.intent.slots[constants.CATCHSLOT].value) {
                                let query = message.originalRequest.request.intent.slots[constants.CATCHSLOT].value
                                // resolve(queryProximitySearchForDepartingStation(message, query));
                            } else {
                                // NO value in ANYSTATION slot
                                resolve(buildResponseToAskDepartingStationAgain());
                            }
                        } else {
                            let query = message.originalRequest.request.intent.slots[constants.ANYSTATION].value;
                            // resolve(queryProximitySearchForDepartingStation(message, query));
                        }
                    }
                } else if (!message.originalRequest.session.attributes[constants.DESTINATION_STATION]) {
                    // we have departing station, now check for destination
                    const departingStation = message.originalRequest.session.attributes[constants.DEPARTING_STATION];
                    if (!message.originalRequest.session.attributes[constants.DESTINATION_STATION.concat("retry")]) {
                        // no retry
                        resolve(buildResponseAskDestinationStation(departingStation));
                    } else {
                        // We are in retry mode for departing station
                        if (!message.originalRequest.request.intent.slots[constants.ANYSTATION].value) {

                            // check if there is value in other slots
                            if (message.originalRequest.request.intent.slots[constants.DESTINATIONSTATION].value) {
                                // looks like we have a value in Destination slot.
                                // get the value from destination slot and
                                let destinationStation = message.originalRequest.request.intent.slots[constants.DESTINATIONSTATION].value
                                //resolve(queryProximitySearchForDestinationStation(message, destinationStation, departingStation));
                            } else if (message.originalRequest.request.intent.slots[constants.DEPARTINGSTATION].value) {
                                // looks like we have a value in Destination slot.
                                // get the value from destination slot and
                                let destinationStation = message.originalRequest.request.intent.slots[constants.DEPARTINGSTATION].value
                                //resolve(queryProximitySearchForDestinationStation(message, destinationStation, departingStation));
                            } else if (message.originalRequest.request.intent.slots[constants.CATCHSLOT].value) {
                                let destinationStation = message.originalRequest.request.intent.slots[constants.CATCHSLOT].value
                                //resolve(queryProximitySearchForDestinationStation(message, destinationStation, departingStation));
                            }
                            else {
                                // NO value in ANYSTATION slot
                                resolve(buildResponseToAskDestinationStationAgain(departingStation));
                            }
                        } else {
                            let query = message.originalRequest.request.intent.slots.ANYSTATION.value;
                            // resolve(queryProximitySearchForDestinationStation(message, query, departingStation));
                        }
                    }
                } else if (!message.originalRequest.session.attributes[constants.DEPART_DATE]) {
                    const departingStation = message.originalRequest.session.attributes[constants.DEPARTING_STATION];
                    const destinationStation = message.originalRequest.session.attributes[constants.DESTINATION_STATION];
                    if (message.originalRequest.request.intent.slots[constants.DATESLOT].value) {
                        let departDate = message.originalRequest.request.intent.slots[constants.DATESLOT].value
                        resolve(buildResponseAskDepartTimeSlot(destinationStation, departingStation, departDate));
                    } else {
                        resolve(buildResponseAskDepartDateAgain(destinationStation, departingStation));
                    }
                } else if (!message.originalRequest.session.attributes[constants.DEPART_TIME]) {
                    const departingStation = message.originalRequest.session.attributes[constants.DEPARTING_STATION];
                    const destinationStation = message.originalRequest.session.attributes[constants.DESTINATION_STATION];
                    const departDate = message.originalRequest.session.attributes[constants.DEPART_DATE];
                    if (message.originalRequest.request.intent.slots[constants.TIMESLOT].value) {
                        let departTime = message.originalRequest.request.intent.slots[constants.TIMESLOT].value
                        resolve(buildJourneyPlannerResponse(destinationStation, departingStation, departDate, departTime));
                    } else {
                        resolve(buildResponseAskDepartTimeAgain(destinationStation, departingStation, departDate));
                    }
                } else if (message.originalRequest.session.attributes[constants.DEPARTING_STATION]
                    && message.originalRequest.session.attributes[constants.DESTINATION_STATION]
                    && message.originalRequest.session.attributes[constants.DEPART_DATE]
                    && message.originalRequest.session.attributes[constants.DEPART_TIME]) {
                    console.log("We have got all the values");
                    // We have all the values required
                    const departingStation = message.originalRequest.session.attributes[constants.DEPARTING_STATION];
                    const destinationStation = message.originalRequest.session.attributes[constants.DESTINATION_STATION];
                    const departDate = message.originalRequest.session.attributes[constants.DEPART_DATE];
                    const departTime = message.originalRequest.session.attributes[constants.DEPART_TIME]
                    resolve(buildJourneyPlannerResponse(destinationStation, departingStation, departDate, departTime));
                }
                else {
                    resolve(buildDefaultErrorMessage(message))
                }
            } else {
                // there is nothing in the session, so check if there is something in the slot
                if (isNextJourneyIntent) {
                    if (message.originalRequest.request.intent.slots[constants.DESTINATIONSTATION].value
                        && message.originalRequest.request.intent.slots[constants.DEPARTINGSTATION].value) {
                        let destinationStation = message.originalRequest.request.intent.slots[constants.DESTINATIONSTATION].value
                        let departingStation = message.originalRequest.request.intent.slots[constants.DEPARTINGSTATION].value
                        buildProximityResponse(message, departingStation).then(function (resp) {
                            resolve(resp);
                        }).catch(function (err) {
                            if (err === constants.EXACT_MATCH) {
                                buildProximityResponse(message, destinationStation).then(function (resp) {
                                    resp.sessionAttributes[constants.DEPARTING_STATION] = departingStation;
                                    resolve(resp);
                                }).catch(function (err) {
                                    if (err === constants.EXACT_MATCH) {
                                        const today = moment.tz(constants.TIMEZONE);
                                        const departDate = today.format("YYYY-MM-DD");
                                        const departTime = today.format("HH:MM");
                                        resolve(buildJourneyPlannerResponse(destinationStation, departingStation, departDate, departTime));
                                    }
                                });
                            }
                        });
                    } else if (message.originalRequest.request.intent.slots[constants.DESTINATIONSTATION].value) {
                        let destinationStation = message.originalRequest.request.intent.slots[constants.DESTINATIONSTATION].value
                        resolve(queryProximitySearchForDestinationStation(message, destinationStation, null));
                    } else if (message.originalRequest.request.intent.slots[constants.DEPARTINGSTATION].value) {
                        let departingStation = message.originalRequest.request.intent.slots[constants.DEPARTINGSTATION].value
                        resolve(queryProximitySearchForDepartingStation(message, departingStation));
                    } else {
                        // NO value in ANYSTATION slot
                        resolve(buildResponseAskDepartingStation());
                    }
                }
                else {
                    // NO value in ANYSTATION slot
                    resolve(buildResponseAskDepartingStation());
                }

            }

        });

    }
}

module.exports = AlexaBuilder;

function adaptResponseForNextJourneyIntent(response) {
    response.sessionAttributes[constants.NEXT_JOURNEY] = "true";
    try {
        const today = moment.tz("Europe/London");
        response.sessionAttributes[constants.DEPART_DATE] = today.format("YYYY-MM-DD");
        //NOTE do not concat seconds in Alexa
        response.sessionAttributes[constants.DEPART_TIME] = today.format("HH:MM");
    }
    catch (error) {
        console.log(error);
    }
    return response;
}

function buildResponseAskDepartingStation(destinationStation) {
    let newResp = new AlexaMessageBuilder()
        .addSSML("<speak>".concat(standardMessages.alexaAskJourneyDepartingStation).concat("</speak>"))
        .addSessionAttribute(constants.DEPARTING_STATION.concat("retry"), 1)
        .keepSession();
    if (destinationStation) {
        newResp.addSessionAttribute(constants.DESTINATION_STATION, destinationStation)
    }
    return newResp.get();
}

function buildResponseAskDestinationStation(departingStation) {
    let newResp = new AlexaMessageBuilder()
        .addSSML("<speak>".concat(standardMessages.alexaAskJourneyDestinationStation).concat("</speak>"))
        .addSessionAttribute(constants.DEPARTING_STATION.concat("retry"), 1)
        .addSessionAttribute(constants.DESTINATION_STATION.concat("retry"), 1)
        .addSessionAttribute(constants.DEPARTING_STATION, departingStation)
        .keepSession()
        .get();
    return newResp;
}

function queryProximitySearchForDepartingStation(message, departingStation) {
    return new Promise((resolve, reject) => {
        buildProximityResponse(message, departingStation).then(function (resp) {
            resolve(resp);
        }).catch(function (err) {
            if (err === constants.EXACT_MATCH) {
                if (message.originalRequest.session.attributes
                    && message.originalRequest.session.attributes[constants.DESTINATION_STATION]
                    && message.originalRequest.session.attributes[constants.DEPART_DATE]
                    && message.originalRequest.session.attributes[constants.DEPART_TIME]) {
                    // we already have Depart date time, so now directly get Journey Response
                    const destinationStation = message.originalRequest.session.attributes[constants.DESTINATION_STATION];
                    const departDate = message.originalRequest.session.attributes[constants.DEPART_DATE];
                    const departTime = message.originalRequest.session.attributes[constants.DEPART_TIME]
                    resolve(buildJourneyPlannerResponse(destinationStation, departingStation, departDate, departTime));
                } else if (message.originalRequest.session.attributes
                    && !message.originalRequest.session.attributes[constants.DESTINATION_STATION]) {
                    resolve(buildResponseAskDestinationStation(departingStation));
                } else if (message.originalRequest.session.attributes
                    && !message.originalRequest.session.attributes[constants.DEPART_DATE]) {
                    const destinationStation = message.originalRequest.session.attributes[constants.DESTINATION_STATION];
                    resolve(buildResponseAskDepartTime(destinationStation, departingStation));
                } else {
                    resolve(buildResponseAskDestinationStation(departingStation));
                }

            } else {
                resolve(err);
            }
        });
    });

}

function queryProximitySearchForDestinationStation(message, destinationStation, departingStation) {
    return new Promise((resolve, reject) => {
        buildProximityResponse(message, destinationStation).then(function (resp) {
            if (departingStation) {
                resp.sessionAttributes[constants.DEPARTING_STATION] = departingStation;
            }
            resolve(resp);
        }).catch(function (err) {
            if (err === constants.EXACT_MATCH) {
                if (!departingStation) {
                    resolve(buildResponseAskDepartingStation(destinationStation));
                }
                if (message.originalRequest.session.attributes
                    && message.originalRequest.session.attributes[constants.DEPART_DATE]
                    && message.originalRequest.session.attributes[constants.DEPART_TIME]) {
                    // we already have Depart date time, so now directly get Journey Response
                    const departDate = message.originalRequest.session.attributes[constants.DEPART_DATE];
                    const departTime = message.originalRequest.session.attributes[constants.DEPART_TIME]
                    resolve(buildJourneyPlannerResponse(destinationStation, departingStation, departDate, departTime));
                } else {
                    resolve(buildResponseAskDepartTime(destinationStation, departingStation));
                }

            } else {
                resolve(err);
            }
        });
    });

}

function buildResponseAskDepartTime(destinationStation, departingStation) {
    let newResp = new AlexaMessageBuilder()
        .addSSML("<speak>".concat(standardMessages.alexaAskJourneyStartDate).concat("</speak>"))
        .addSessionAttribute(constants.DEPARTING_STATION.concat("retry"), 1)
        .addSessionAttribute(constants.DESTINATION_STATION.concat("retry"), 1)
        .addSessionAttribute(constants.DESTINATION_STATION, destinationStation)
        .keepSession();
    if (departingStation) {
        newResp.addSessionAttribute(constants.DEPARTING_STATION, departingStation);
    }
    return newResp.get();
}

function buildResponseToAskDepartingStationAgain() {
    let newResp = new AlexaMessageBuilder()
        .addSSML("<speak>".concat(standardMessages.alexaAskDepartingStationAgain).concat("</speak>"))
        .addSessionAttribute(constants.DEPARTING_STATION.concat("retry"), 1)
        .keepSession()
        .get();
    return newResp
}
function buildResponseToAskDestinationStationAgain(departingStation) {
    let newResp = new AlexaMessageBuilder()
        .addSSML("<speak>".concat(standardMessages.alexaAskDestinationStationAgain).concat("</speak>"))
        .addSessionAttribute(constants.DEPARTING_STATION.concat("retry"), 1)
        .addSessionAttribute(constants.DESTINATION_STATION.concat("retry"), 1)
        .addSessionAttribute(constants.DEPARTING_STATION, departingStation)
        .keepSession()
        .get();
    return newResp
}

function buildDefaultErrorMessage(message) {
    const departingStation = message.originalRequest.session.attributes[constants.DEPARTING_STATION];
    const destinationStation = message.originalRequest.session.attributes[constants.DESTINATION_STATION];
    return new AlexaMessageBuilder()
        .addSSML("<speak>I am working on it.</speak>")
        .addSessionAttribute(constants.DEPARTING_STATION.concat("retry"), 1)
        .addSessionAttribute(constants.DESTINATION_STATION.concat("retry"), 1)
        .addSessionAttribute(constants.DEPARTING_STATION, departingStation)
        .addSessionAttribute(constants.DESTINATION_STATION, destinationStation)
        .keepSession()
        .get();
}

function buildResponseAskDepartTimeSlot(destinationStation, departingStation, departDate) {
    let newResp = new AlexaMessageBuilder()
        .addSSML("<speak>".concat(standardMessages.alexaAskJourneyDepartureTime).concat("</speak>"))
        .addSessionAttribute(constants.DEPARTING_STATION.concat("retry"), 1)
        .addSessionAttribute(constants.DESTINATION_STATION.concat("retry"), 1)
        .addSessionAttribute(constants.DEPARTING_STATION, departingStation)
        .addSessionAttribute(constants.DESTINATION_STATION, destinationStation)
        .addSessionAttribute(constants.DEPART_DATE, departDate)
        .keepSession()
        .get();
    return newResp;
}

function buildResponseAskDepartDateAgain(destinationStation, departingStation) {
    let newResp = new AlexaMessageBuilder()
        .addSSML("<speak>".concat(standardMessages.alexaAskJourneyDepartureDateAgain).concat("</speak>"))
        .addSessionAttribute(constants.DEPARTING_STATION.concat("retry"), 1)
        .addSessionAttribute(constants.DESTINATION_STATION.concat("retry"), 1)
        .addSessionAttribute(constants.DEPARTING_STATION, departingStation)
        .addSessionAttribute(constants.DESTINATION_STATION, destinationStation)
        .keepSession()
        .get();
    return newResp;
}

function buildResponseAskDepartTimeAgain(destinationStation, departingStation, departDate) {
    let newResp = new AlexaMessageBuilder()
        .addSSML("<speak>".concat(standardMessages.alexaAskJourneyDepartureTimeAgain).concat("</speak>"))
        .addSessionAttribute(constants.DEPARTING_STATION.concat("retry"), 1)
        .addSessionAttribute(constants.DESTINATION_STATION.concat("retry"), 1)
        .addSessionAttribute(constants.DEPARTING_STATION, departingStation)
        .addSessionAttribute(constants.DESTINATION_STATION, destinationStation)
        .addSessionAttribute(constants.DEPART_DATE, departDate)
        .keepSession()
        .get();
    return newResp;
}

function buildJourneyPlannerResponse(destinationStation, departingStation, departDate, departTime) {
    return new Promise((resolve, reject) => {
        // getAlexaResponse(destinationStation, departingStation, departDate, departTime).then(function (resp) {
        //     resolve(resp);
        // });
    });
}
