'use strict';

const planner = require('../../services/journeyPlanner/journeyPlanner');
var journeyPlanner = new planner();
const dateTimeUtil = require('../../utils/dateTimeUtil');
var dateTime = new dateTimeUtil();
const sessionManager = require('./../../utils/sessionmanager');
const constants = require('./../constants');
const plannerConstants = require('../../services/journeyPlanner/plannerConstants')
const intents = require('../intents');

function GoogleBuilder() {
  this.renderWelcome = function (message) {
    return optionResponse("","",constants.RESPONSE_TEXT,message.originalRequest.conversation.conversationId,message);
  };

  this.renderMessage = function (message, parsedMessageFromDiaglogFlow, originalInputMessage) {
    return new Promise((resolve, reject) => {
      let newMessage = message;
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
                    journeyPlanner.callService(locationFrom,locationTo, dateTime.getTime(originalInputMessage.text, departTime))
                      .then(function (resp) {
                              sessionManager.destroySession(originalInputMessage.sender);
                              var response = optionResponse(locationFrom,locationTo,constants.RESPONSE_CAROUSEL,originalInputMessage.originalRequest.conversation.conversationId,resp)
                              resolve(response);
                          }).catch((err) => {
                              console.log("error in journey response ", err)
                              sessionManager.destroySession(originalInputMessage.sender);
                              var response = optionResponse("","",constants.RESPONSE_ERROR,originalInputMessage.originalRequest.conversation.conversationId,constants.ERROR_MSG);                
                              resolve(response);
                           });
                      break;    
                  }
                  default: resolve(message)
              }
              sessionManager.destroySession(originalInputMessage.sender);
      } else{
        // If no custom response has been built, return a canned response
        // Such responses are set in Dialogflow.
        switch (parsedMessageFromDiaglogFlow.intent) {
          case intents.QUICK_JOURNEY : {
              // Invoke Intent Realization service here to get the response
              resolve(createMessage("","",message, parsedMessageFromDiaglogFlow, originalInputMessage));
            }
          default: resolve(message)
        }
      }
    });
  }
}

function getCarouselResponse(departure, arrival, conv_token, jpResponse){
  jpResponse = JSON.parse(jpResponse.body)
  if(jpResponse){
    jpResponse = jpResponse.outwardservices
    var item;
    jpResponse.forEach(function (service, index){
      switch (index) {
        case(constants.ZERO):{
          item = '{"title": "'.concat(departure.concat(plannerConstants.MESSAGES_TO).concat(arrival))
          .concat('", "description": "')
          .concat(plannerConstants.MESSAGES_DEPARTS_AT)
          .concat(dateTime.setTime((service.depdatetime).split('T')[1]))
          .concat("\\n")
          .concat(plannerConstants.MESSAGES_ARRIVES_AT)
          .concat(dateTime.setTime((service.arrdatetime).split('T')[1]))
          .concat("\\n")
          .concat(plannerConstants.MESSAGES_TOTAL_FARE)
          .concat((service.servicefares[0].totalfare)/100)
          .concat('","footer": "')
          .concat(constants.BOOK_JOURNEY)
          .concat('","image": {"url": ')
          .concat(process.env.SERVICE_LOGO_URL)
          .concat(',"accessibilityText": "')
          .concat(constants.LOGO_ALT_TEXT)
          .concat('"},"openUrlAction": {"url": ')
          .concat(process.env.SERVICE_HOME_PAGE)
          .concat('}}');
          break;
        }
        default: { 
          item += ',{"title": "'.concat(departure.concat(plannerConstants.MESSAGES_TO).concat(arrival))
          .concat('", "description": "')
          .concat(plannerConstants.MESSAGES_DEPARTS_AT)
          .concat(dateTime.setTime((service.depdatetime).split('T')[1]))
          .concat("\\n")
          .concat(plannerConstants.MESSAGES_ARRIVES_AT)
          .concat(dateTime.setTime((service.arrdatetime).split('T')[1]))
          .concat("\\n")
          .concat(plannerConstants.MESSAGES_TOTAL_FARE)
          .concat((service.servicefares[0].totalfare)/100)
          .concat('","footer": "')
          .concat(constants.BOOK_JOURNEY)
          .concat('","image": {"url": ')
          .concat(process.env.SERVICE_LOGO_URL)
          .concat(',"accessibilityText": "')
          .concat(constants.LOGO_ALT_TEXT)
          .concat('"},"openUrlAction": {"url": ')
          .concat(process.env.SERVICE_HOME_PAGE)
          .concat('}}');
          break;
        }
      }
    });
    var carouselResponse;
    if(item){
      carouselResponse = '{ "conversationToken": "'
        .concat(conv_token)
        .concat('","expectUserResponse": true, "expectedInputs": [')
        .concat('{"inputPrompt": {"richInitialPrompt": {"items": [{"simpleResponse": {')
        .concat('"textToSpeech": "')
        .concat("Alright! Here are a few options you might want to check out.")
        .concat('"}},{"carouselBrowse": {"items": [')
        .concat(item)
        .concat(']}}]}},"possibleIntents": [{"intent": "assistant.intent.action.TEXT"}]}]}')
    }else{
      carouselResponse = getTextResponse(constants.NO_JOURNEY,conv_token)      
    } 
    return carouselResponse  
  } 
}

function optionResponse(departure, arrival, responseType,conv_token, responseJson){
 var responsetext = '{ "conversationToken": "'
        .concat(conv_token)
        .concat('","expectUserResponse": true, "expectedInputs": [')
        .concat('{"inputPrompt": {"richInitialPrompt": {"items": [{"simpleResponse": {');
  switch (responseType) {
    case constants.RESPONSE_CAROUSEL:{
      responsetext = getCarouselResponse(departure, arrival, conv_token,responseJson)
      break;
    }    
    case constants.RESPONSE_OPTIONS: { 
      responsetext = getOptionsResponse(responseJson,responsetext)
      break;  
    }
    case constants.RESPONSE_TEXT: {
      responsetext = getTextResponse(responseJson.text,conv_token)
      break;   
    }
    case constants.RESPONSE_ERROR:{
      responsetext = getTextResponse(responseJson,conv_token) 
      break;  
    }
  }
  let response = JSON.parse(responsetext)
  return response;             
}

function getTextResponse(responseJson,conv_token){
  var responsetext = '{ "conversationToken": "'
        .concat(conv_token)
        .concat('","expectUserResponse": true, "expectedInputs": [')
        .concat('{"inputPrompt": {"richInitialPrompt": {"items": [{"simpleResponse": {')
        .concat('"textToSpeech": "')
        .concat(responseJson)
        .concat('","displayText":"')
        .concat(responseJson)
        .concat('"}}]')
        .concat(constants.GOOGLE_POSSIBLE_INTENTS);  
    return responsetext;    
}

function getOptionsResponse(responseJson,responsetext){
  var suggestionsJson;
  var suggestions = responseJson.text;
  responseJson.quick_replies.forEach(function (quickReply,index){ 
    switch (index) {
      case(constants.ZERO):{
        suggestionsJson = '{"title": "'+quickReply.title+'"}';
        suggestions += quickReply.title;
        break;
      }
      default: { 
        suggestionsJson += ',{"title": "'+quickReply.title+'"}';
        suggestions += ' or '+quickReply.title;
        break;
      }
    }             
  })
  responsetext = responsetext.concat('"textToSpeech": "')
    .concat(suggestions)
    .concat('","displayText":"')
    .concat(suggestions)
    .concat('"}}]')
    .concat(',"suggestions": [')
    .concat(suggestionsJson)
    .concat(']').concat(constants.GOOGLE_POSSIBLE_INTENTS); 
  return responsetext;
}

function createMessage(departure, arrival, message, parsedMessageFromDiaglogFlow, originalInputMessage){
  return new Promise((resolve, reject) => {
    // buildProximityResponse(parsedMessageFromDiaglogFlow,message,originalInputMessage)
    //           .then(function(responseJson){
    //               var response = "";
    //               var responseType = constants.RESPONSE_TEXT;
    //               if(responseJson.quick_replies){
    //                 responseType = constants.RESPONSE_OPTIONS;
    //               }
    //               response = optionResponse(departure, arrival, responseType,originalInputMessage.originalRequest.conversation.conversationId,responseJson)                                      
    //               resolve(response);
    //           }).catch((err) => {
    //             console.log("error in createMessage ", err)
    //             reject(getTextResponse(err,originalInputMessage.originalRequest.conversation.conversationId));
    //         });    
  });
}
module.exports = GoogleBuilder;