'use strict';
var mergeImg = require("merge-img");
const fs = require('fs');
const constants = require('../bot/constants');
const tocMappings = require('../public/tocMappings');
var imageManager = {

    /**
     *Create a new session.
     */
    getOperatorsLogo(service) {
        return new Promise((resolve, reject) => {
            var operatorNames = [];
            var imgPath;
            service.servicelegs.forEach(function (change) {
                if (operatorNames.indexOf(change.tocdesc) < constants.ZERO) {
                    operatorNames.push(change.tocdesc);
                }
            });
            if (operatorNames.length > 1) {
                var imgToBeMerged = [];
                operatorNames.forEach(function (operator, index) {
                    let tocLogoFileName = "";
                    if (tocMappings.getmapping(operator)) {
                        tocLogoFileName = tocMappings.getmapping(operator)
                    } else {
                        tocLogoFileName = tocMappings.getmapping("default toc");
                    }
                    var imgPath = constants.LOGO_BASE_PATH.concat(tocLogoFileName);
                    imgToBeMerged.push(imgPath);
                })
                let combinedImageName = [];
                imgToBeMerged.map(function (element) {
                    combinedImageName.push(element.substring(element.lastIndexOf('/') + 1, element.lastIndexOf('.')))
                });
                //let imageName = constants.MERGED_IMAGE_PREFIX.concat(new Date().getTime()).concat(constants.MERGED_IMAGE_MIME);
                let imageName = combinedImageName.join("_").concat(constants.MERGED_IMAGE_MIME);
                var imgNameWithPath = constants.MERGED_IMAGE_PATH.concat(imageName);
                if (fs.existsSync(imgNameWithPath)) {
                    console.log("Image logo exists, do not do anything ");
                    resolve(constants.MERGED_LOGO_PATH.concat(imageName))
                } else {
                    console.log("Image logo does not exists, merge images");
                    this.mergeImage(imgToBeMerged)
                        .then(function (resp) {
                            resolve(resp);
                        }).catch((err) => {
                            console.log("error is ", err)
                            reject(constants.ERROR_MSG);
                        });
                }

            } else {
                this.getLogoImage(operatorNames)
                    .then(function (resp) {
                        resolve(resp);
                    }).catch((err) => {
                        console.log("error in else is ", err)
                        reject(constants.ERROR_MSG);
                    });
            }
        });
    },
    getLogoImage(operatorNames) {
        return new Promise((resolve, reject) => {
            var operatorName = operatorNames[0];
            resolve(constants.LOGO_BASE_PATH.concat(tocMappings.getmapping(operatorName)));
        });
    },
    mergeImage(imgToBeMerged) {
        return new Promise((resolve, reject) => {
            let combinedImageName = [];
            imgToBeMerged.map(function (element) {
                combinedImageName.push(element.substring(element.lastIndexOf('/') + 1, element.lastIndexOf('.')))
            });
            //let imageName = constants.MERGED_IMAGE_PREFIX.concat(new Date().getTime()).concat(constants.MERGED_IMAGE_MIME);
            let imageName = combinedImageName.join("_").concat(constants.MERGED_IMAGE_MIME);
            var imgNameWithPath = constants.MERGED_IMAGE_PATH.concat(imageName);
            mergeImg(imgToBeMerged)
                .then((img) => {
                    // Save image as file
                    img.resize(300, 150).write(imgNameWithPath, () => resolve(constants.MERGED_LOGO_PATH.concat(imageName)));
                }).catch(function (err) {
                    console.log("Image Manager - Error in Merging Image", err);
                    resolve(constants.LOGO_BASE_PATH.concat("/").concat("default_toc.png"));
                });
        });

    }
}
module.exports = imageManager;