const botBuilder = require('claudia-bot-builder');
const fbTemplate = botBuilder.fbTemplate;
const messagesObj = require('./../resources/messages.json');
const constants = require('./../constants');


module.exports.welcome = function () {
    let welcomeMessage = new Array();
    const logo = new fbTemplate.Generic()
        .addBubble(messagesObj.serviceName, messagesObj.welcomeText)
        .addUrl(constants.SERVICE_HOME_PAGE)
        .addImage(constants.SERVICE_LOGO_URL)
        .get();

    const helloMessage = new fbTemplate.Text("Hello").get();
    const userGreetSpotty = new fbTemplate.Text(messagesObj.userGreetSpotty).get();
    const userGreetTypePerson = new fbTemplate.Text(messagesObj.userGreetTypePerson).get();
    const greetUser = new fbTemplate.Text(messagesObj.readyToStart)
        .addQuickReply('Proceed With Bot', 'bot')
        .addQuickReply('Proceed With Person', 'person')
        .addQuickReply('Help', 'help')
        .get();
    welcomeMessage.push(logo);
    welcomeMessage.push(helloMessage);
    welcomeMessage.push(userGreetSpotty);
    welcomeMessage.push(userGreetTypePerson);
    welcomeMessage.push(greetUser);
    return welcomeMessage;
}

module.exports.proceedWithBot = function () {
    //TODO Add more quick replies here
    const messages = new fbTemplate.Text(messagesObj.howCanIHelp)
        .addQuickReply('Quick Journey', 'Quick Journey')
        .get();
    return messages;
}

module.exports.proceedWithPerson = function () {
    let responseMessages = new Array();
    const proceedWithPerson = new fbTemplate.Text(messagesObj.proceedWithPersonText).get();
    const helpButtons = new fbTemplate.Button("Contact us about Ticketing")
        .addButton('TOP FAQs', constants.SERVICE_FAQ_URL)
        .addButton('Enquiry Form', constants.SERVICE_CONTACT_US_URL)
        .get();
    responseMessages.push(proceedWithPerson);
    responseMessages.push(helpButtons);
    return responseMessages;
}