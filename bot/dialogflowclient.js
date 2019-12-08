'use strict';

const promisify = require('promisify-event');
const apiai = require('apiai');

function DialogflowClient(clientAccessToken, _options) {
    // ========================================
    // PRIVATE PROPERTIES
    // ========================================
    var options = _options || {};
    var client = apiai(clientAccessToken, options);

    // ========================================
    // PRIVATE METHODS
    // ========================================
    var parseCannedResponses = function (result) {
        var cannedResponses = []
        if (result.fulfillment && result.fulfillment.messages && Array.isArray(result.fulfillment.messages)) {
            for (let cannedResponse of result.fulfillment.messages) {
                if (cannedResponse && cannedResponse.speech && cannedResponse.speech != "") {
                    cannedResponses.push(cannedResponse.speech);
                }
            }
        }
        return cannedResponses;
    };

    var parseText = function (message) {
        var request = client.textRequest(message.text, {
            sessionId: message.type + '-' + message.sender
        });
        var response = promisify(request, 'response');
        promisify(request, 'error')
            .catch(function (error) {
                console.error(error);
            });

        request.end();

        return response
            .then(function (data) {
                console.log('Response from DF',data);
                return {
                    success: true,
                    lang: data.lang,
                    type: message.type,
                    intent: data.result.action,
                    parameters: data.result.parameters,
                    action: data.result.action,
                    actionIncomplete: data.result.actionIncomplete,
                    contexts: data.result.contexts,
                    query:data.result.resolvedQuery,
                    sessionId:data.sessionId,
                    responses: parseCannedResponses(data.result)
                }
            });
    }

    // ========================================
    // PUBLIC METHODS
    // ========================================
    this.parse = function (message) {
        if (message.text && message.text != '') {
            return parseText(message);
        } else {
            return new Promise(
                function (resolve, reject) {
                    resolve({
                        success: false,
                        error: 'MESSAGE_TYPE_NOT_SUPPORTED'
                    });
                });
        }
    }

    this.parseIntent = function (message) {
        //console.log('message', message.originalRequest.request.intent.name)
        var request = null;
        //name: message.originalRequest.request.intent.name,
        if (message.originalRequest.request.intent) {
            request = client.eventRequest({
                name: message.originalRequest.request.intent.name,
                data: {
                    'departing-station':'London'
                }
            }, {
                    sessionId: message.type + '-' + message.sender.substring(message.sender.length - 20, message.sender.length)
                });
        } else {
            request = client.eventRequest({
                name: 'welcome'
            }, {
                    sessionId: message.type + '-' + message.sender.substring(message.sender.length - 20, message.sender.length)
                });
        }
        
        var response = promisify(request, 'response');
        promisify(request, 'error')
            .catch(function (error) {
                console.error(error);
            });

        request.end();

        return response
            .then(function (data) {
                //console.log(data.result)
                return {
                    data: ""
                }
            });
    }
};

module.exports = DialogflowClient;