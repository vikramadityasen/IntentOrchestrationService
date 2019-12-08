/*global module*/
 var getTime= function (userText, parsedTime) {
    'use strict';
    const constants = require('../bot/constants')    
    switch (userText)
    {
        case constants.NOW: {
            return ((new Date()).toISOString().split('T')[0])+"T"+parsedTime;
        }
        default: {
            if(parsedTime.indexOf("T")>0){
                return parsedTime
            }else{
                return parsedTime
            }
        }
    }   
};

function setTime(time){
    time = time.substring(0, time.lastIndexOf(":"))
    var hours = time.split(":")[0]
    if(hours<12){ 
        time = time+" AM"
    }else{
        time = time+" PM"
    }
    return time
}
module.exports = function dateTimeUtil() {
    
    this.getTime = function(userText, parsedTime){
        return getTime(userText, parsedTime)
    } 

    this.setTime = function(time){
        return setTime(time)
    }
}