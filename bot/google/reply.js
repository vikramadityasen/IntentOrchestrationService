'use strict';
module.exports = function googleReply(botResponse, botName,response) {
    response.status(200).json(botResponse);
};