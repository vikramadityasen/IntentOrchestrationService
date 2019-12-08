'use strict';

module.exports = function(messageObject) {
  messageObject = messageObject || {};
  if(messageObject.queryResult && messageObject.session && messageObject.queryResult.queryText && messageObject.queryResult.intent){
    return{
      sender: messageObject.session,
      text: messageObject.queryResult.queryText,
      originalRequest: messageObject,
      type: 'ivr'
    };
  }
};