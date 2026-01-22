'use strict';

var utils = require('../utils/writer.js');

const filmService = require('../service/FilmsService.js');

/**
  this function creates a film 
  ROUTE: POST /api/films
*/
module.exports.createFilm = function createFilm(req, res, next) {
  var film = req.body; //data extraction from req.body
  var owner = req.user.id; //user extraction from req.user

  // pass the raw data and the owner ID to the function
  filmService.createFilm(film, owner)
    .then(function (response) {
      utils.writeJson(res, response, 201); //if the promise resolves, the film object is created 
    })
    .catch(function (response) {

      // standard error object for the client
      var errorPayload = { 
          errors: [{ 'param': 'Server', 'msg': response }] 
      };
      utils.writeJson(res, errorPayload, 500); //internal server error
    });
};