'use strict';
const constants = require('./plannerConstants');
const globalConstants = require('./../../bot/constants');
const rp = require('minimal-request-promise');
const botBuilder = require('claudia-bot-builder');
const fbTemplate = botBuilder.fbTemplate;
const imageManager = require('./../../utils/imageManager');
const AlexaMessageBuilder = require('claudia-bot-builder').AlexaTemplate
const chrono = require('chrono-node')
var dateFormat = require('dateformat');

module.exports = function journeyPlanner(departure, arrival, time) {
    this.getFBResponse = function(departure,arrival, time){
        return getFBResponse(departure,arrival,time)
    } 
    this.callService = function(departure,arrival, time){
        return callService(departure,arrival,time)
    } 
}

function callService(departure, arrival, time) {
    // var requestURL = process.env.DMS_END_POINT.concat(constants.SEARCH)
    // var inputRequest = { "from": departure, "to": arrival, "time": time }
    // const options = {
    //     headers: {
    //         'Content-Type': 'application/json'
    //     },
    //     body: JSON.stringify(inputRequest),
    //     method: 'POST'
    // };
   // return rp.post(requestURL, options)
}

function getPostbackPayload(service){
    var legs = [];
    service.servicelegs.forEach(function(leg){
        legs.push({
            "toc": leg.tocdesc,
            "toccode": leg.toccode,
            "mode": leg.mode,
            "from": leg.sname,
            "to": leg.ename,
            "dtime": leg.dtime,
            "atime": leg.atime
        })
    })
    var payload = JSON.stringify({"action": "show.Details","legs": legs});
    return payload;
}

function getResponse(responseJson, departure, arrival) {
    return new Promise((resolve, reject) => {
        let newMessage = new fbTemplate.Generic();
        let promises = responseJson.map(function (service) {
            return imageManager.getOperatorsLogo(service).then(function (tocLogoUrl) {
                var details = (service.changes == 0?"no change ": (service.changes)+ " ".concat((service.changes ==1?" change (check 'Show Details') ":" changes (check 'Show Details')")))
                        .concat(constants.MESSAGES_NEWLINE);
                        if(service.servicefares[0]){
                            details = details.concat(constants.MESSAGES_TOTAL_FARE)
                                    .concat((service.servicefares[0].totalfare) / 100)
                        }
                        details = details.concat(constants.MESSAGES_NEWLINE)
                                    .concat(constants.DURATION)
                                    .concat(service.duration)
                                    .concat(constants.MINUTES)
                                    .concat(constants.MESSAGES_NEWLINE)

                        newMessage
                            .addBubble(departure.concat(constants.MESSAGES_TO).concat(arrival)
                                    .concat(constants.MESSAGES_DEPARTS_AT)
                                    .concat(dateFormat(service.depdatetime, "ddd, d mmmm yyyy h:MM:ss TT Z")),
                                    details)                                    
                            .addImage(tocLogoUrl)
                            .addButton(constants.BOOK_JOURNEY, process.env.SERVICE_HOME_PAGE)
                            if(service.changes>0){
                                newMessage.addButton(constants.SHOW_DETAILS, getPostbackPayload(service))
                            }

                return newMessage
            });
        })
        Promise.all(promises).then(function () {
            resolve(newMessage.get())
        })
    });
}

//method to invoke journey planner service and get the response json of services for FB and Chat
function getFBResponse(departure, arrival, time) {
    return new Promise((resolve, reject) => {
        resolve(callService(departure, arrival, time).then(function (response) {
            let newMessage = new fbTemplate.Generic();
            var responseJson = JSON.parse(response.body)
            if (responseJson) {
                responseJson = responseJson.outwardservices
                if (responseJson.length > 0) {
                    let promise = getResponse(responseJson, departure, arrival); 
                    return promise;
                } else {
                    const newMessage = new fbTemplate.Text(constants.NO_JOURNEY_MSG);
                    return newMessage.get();
                }
            } else {
                const newMessage = new fbTemplate.Text(constants.NO_JOURNEY_MSG);
                return newMessage.get();
            }
        }).catch((err) => {
            console.log("error in Journey Planner getfBResponse() ", err)
            const newMessage = new fbTemplate.Text(constants.ERROR_MSG);
            return newMessage.get();
        }));
    })
}

module.exports.getAlexaResponse = function (destinationStation, departingStation, departDate, departTime) {
    return new Promise((resolve, reject) => {
        const time = departDate + "T" + departTime + ":00";
        callService(departingStation, destinationStation, time).then(function (response) {
            let newMessage = new AlexaMessageBuilder()
            var responseJson = JSON.parse(response.body)
            if (responseJson) {
                responseJson = responseJson.outwardservices
                if (responseJson.length > 0) {
                    let cheapestFare = responseJson[0].servicefares[0].totalfare;
                    responseJson[0].servicefares.forEach(function (servicefare) {
                        if (servicefare.ischeapestfare) {
                            cheapestFare = servicefare.totalfare;
                        }
                    });
                    let tocNames = [];
                    responseJson[0].servicelegs.forEach(function (serviceLegs) {
                        tocNames.push(serviceLegs.tocdesc)
                    });
                    let newRespString = "Your first option for service between ";
                    newRespString = newRespString + departingStation
                    newRespString = newRespString + " to "
                    newRespString = newRespString + destinationStation
                    newRespString = newRespString + " is operated by "
                    let listOfTocNames = tocNames.join(" , ");
                    newRespString = newRespString + listOfTocNames.replace(/,([^,]*)$/, '\ and$1');
                    newRespString = newRespString + " and has " + (responseJson[0].changes == 0 ? " no " : responseJson[0].changes);
                    newRespString = newRespString + (responseJson[0].changes == 0 ? " change " : " changes ");
                    newRespString = newRespString + " ."
                    newRespString = newRespString + " The service departs "
                    newRespString = newRespString + departingStation
                    var departingTime = new chrono.parse(responseJson[0].depdatetime);
                    newRespString = newRespString + " at " + departingTime[0].start.knownValues.minute + " minutes past " + departingTime[0].start.knownValues.hour
                    newRespString = newRespString + getMorningOrAfternoonOrEvening(departingTime)
                    newRespString = newRespString + ", arriving at ";
                    newRespString = newRespString + destinationStation
                    var arrivalTime = new chrono.parse(responseJson[0].arrdatetime);
                    newRespString = newRespString + " on " + arrivalTime[0].start.knownValues.minute + " minutes past " + arrivalTime[0].start.knownValues.hour
                    newRespString = newRespString + getMorningOrAfternoonOrEvening(arrivalTime)
                    newRespString = newRespString + " . "
                    newRespString = newRespString + " The cheapest fare for this journey is " + Math.floor(cheapestFare / 100) + " pounds " + (cheapestFare % 100 == 0 ? "" : (" and " + cheapestFare % 100 + " pence"))

                    let newResp = new AlexaMessageBuilder()
                    newResp = addAlexaSessionAttributes(newResp, departingStation, destinationStation, departDate, departTime)
                    newResp = newResp.addSSML("<speak>".concat(newRespString).concat("</speak>"))
                        .keepSession()
                        .get();
                    resolve(newResp);
                } else {
                    console.log("No journey found in Journey Planner () ")
                    let newResp = new AlexaMessageBuilder()
                    newResp = addAlexaSessionAttributes(newResp, departingStation, destinationStation, departDate, departTime)
                    newResp = newResp.addSSML("<speak>".concat(constants.NO_JOURNEY_MSG).concat("</speak>"))
                        .keepSession()
                        .get();
                    resolve(newResp);
                }
            } else {
                console.log("No journey found in Journey Planner () ", err)
                let newResp = new AlexaMessageBuilder()
                newResp = addAlexaSessionAttributes(newResp, departingStation, destinationStation, departDate, departTime)
                newResp = newResp.addSSML("<speak>".concat(constants.NO_JOURNEY_MSG).concat("</speak>"))
                    .keepSession()
                    .get();
                resolve(newResp);
            }
        })
            .catch((err) => {
                console.log("error in Journey Planner getfBResponse() ", err)
                let newResp = new AlexaMessageBuilder()
                newResp = addAlexaSessionAttributes(newResp, departingStation, destinationStation, departDate, departTime)
                newResp = newResp.addSSML("<speak>".concat(constants.ERROR_MSG).concat("</speak>"))
                    .keepSession()
                    .get();
                resolve(newResp);
            })
    });
}

function getMorningOrAfternoonOrEvening(departingTime) {
    return departingTime[0].start.knownValues.hour < 12 ? " in the morning " : departingTime[0].start.knownValues.hour < 15 ? " in the afternoon " : " in the evening ";
}

function addAlexaSessionAttributes(alexaMessageBuilder, departingStation, destinationStation, departDate, departTime) {
    alexaMessageBuilder.addSessionAttribute(globalConstants.DEPARTING_STATION.concat("retry"), 1)
        .addSessionAttribute(globalConstants.DESTINATION_STATION.concat("retry"), 1)
        .addSessionAttribute(globalConstants.DEPARTING_STATION, departingStation)
        .addSessionAttribute(globalConstants.DESTINATION_STATION, destinationStation)
        .addSessionAttribute(globalConstants.DEPART_DATE, departDate)
        .addSessionAttribute(globalConstants.DEPART_TIME, departTime)
    return alexaMessageBuilder;
}
