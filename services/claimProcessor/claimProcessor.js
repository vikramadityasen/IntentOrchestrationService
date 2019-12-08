'use strict';
const constants = require('./processorConstants');
const globalConstants = require('./../../bot/constants');
const rp = require('minimal-request-promise');
const botBuilder = require('claudia-bot-builder');
const chrono = require('chrono-node');
const fbTemplate = botBuilder.fbTemplate;

module.exports = function claimProcessor(category, apiName, param) {
    this.getIVRResponse = function (category, apiName, param) {
        return getIVRResponse(category, apiName, param);
    }
}

function fetchDetails(category, apiName, param) {
    let uri = '';
    switch (category) {
        case constants.CUSTOMER: {
            uri = uri.concat(constants.CUSTOMER);
            break;
        }
        case constants.CLAIMS: {
            uri = uri.concat(constants.claims);
            break;
        }
        default: {
            uri = constants.UNDEFINEDCATEGORY;
            break;
        }
    }
    if (uri && uri !== constants.UNDEFINEDCATEGORY && apiName && param)
        uri = uri.concat('/').concat(apiName).concat('/').concat(param);
    var requestURL = process.env.DMS_END_POINT.concat(uri)
    const options = {
        method: 'GET'
    };
    return rp.get(requestURL, options)
}

function getIVRResponse(category, apiName, param) {
    return new Promise((resolve, reject) => {
        resolve(fetchDetails(category, apiName, param).then(function (response) {
            const responseJson = JSON.parse(response.body);
            // console.log(responseJson)
            if (responseJson && responseJson.name) {
                return constants.AUTHSUCCESS;
            }
        }).catch((err) => {
            console.log("error in claim Processor getIVRResponse() ", err);
            return JSON.parse(err.body).message
        }));
    });
}

// function getJSON() {
//     let response = '{"headers": {"content-type": "application/json;charset=UTF-8","transfer-encoding": "chunked",'
//         .concat('"date": "Sat, 17 Aug 2019 05:50:13 GMT","connection": "close"},"body": {"id": 1004,"name": "Dr. Strang","gender": "male",')
//         .concat('"dateOfBirth": "12/03/1987","address": "Lonawala","city": "Pune","country": "India","createdDate": "2019-08-02T06:30:00.000+0000",')
//         .concat('"createdBy": "VS5051403","updatedDate": "2019-08-03T06:30:00.000+0000","updatedBy": "VS5051403","policies": [{"id": 5,')
//         .concat('"typeCode": "2SC","startDate": "2019-08-02T06:30:00.000+0000","endDate": "2030-01-01T06:30:00.000+0000",')
//         .concat('"createdDate": "2019-08-02T06:30:00.000+0000","createdBy": "VS5051403","updatedDate": "2019-08-02T06:30:00.000+0000",')
//         .concat('"updatedBy": "VS5051403","vehiclePolicyDetails": [{"id": 5,"manufacturer": "Yamaha","model": "R15 V3","manufacuring": "January2019",')
//         .concat('"registrationNo": "MH12NN6532","createdDate": "2019-08-02T02:00:00.000+0000","createdBy": "VS5051403",')
//         .concat('"updatedDate": "2019-08-02T02:00:00.000+0000","updatedBy": "VS5051403"}],"claims": []}]},"statusCode": 200,"statusMessage": ""}')
//     return JSON.parse(response);;
// }
