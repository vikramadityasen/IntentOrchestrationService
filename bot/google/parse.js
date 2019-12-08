'use strict';

function getQuery(messageObject) {
  if(messageObject && messageObject.inputs 
    && messageObject.inputs && messageObject.inputs[0].rawInputs
    && messageObject.inputs[0].rawInputs[0] 
    && messageObject.inputs[0].rawInputs[0].query){
      return messageObject.inputs[0].rawInputs[0].query;
  }else{
    return '';
  }
}

module.exports = function(messageObject) {
  messageObject = messageObject || {};
  if (messageObject && messageObject.user && messageObject.user.userId 
  && messageObject.conversation && messageObject.conversation.conversationId && messageObject.conversation.type
  && messageObject.inputs) {
  return {
    sender: (messageObject.user.userId).substr((messageObject.user.userId).length-15),
    text: getQuery(messageObject) || '',
    originalRequest: messageObject,
    type: 'google'
  };
}
};