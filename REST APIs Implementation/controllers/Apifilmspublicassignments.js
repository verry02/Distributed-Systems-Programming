'use strict';


var utils = require('../utils/writer.js');
const filmService = require('../service/FilmsService.js');

/**
  ROUTE: POST /api/films/public/assignments
*/
module.exports.assignReviewBalanced = function assignReviewBalanced (req, res, next) {
  //call to service
  filmService.assignReviewBalanced()
    .then(function (response) {
      utils.writeJson(res, response); //success
    })
    .catch(function (response) {
     //error
      utils.writeJson(res, response);
    });
};