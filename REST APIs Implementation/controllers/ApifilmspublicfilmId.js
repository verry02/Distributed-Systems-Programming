'use strict';

var utils = require('../utils/writer.js');
const filmService = require('../service/FilmsService.js');

/**
  Route: DELETE /api/films/public/{filmId}
*/
module.exports.deleteSinglePublicFilm = function deleteSinglePublicFilm(req, res, next) {
  
  // Pass the film ID AND the logged-in user ID to the Service.
  // The Service will check if owner == user.
  filmService.deleteSinglePublicFilm(req.params.filmId, req.user.id)
    .then(function (response) {
      utils.writeJson(res, response, 204); //success
    })
    .catch(function (response) {
      // Mapping Service errors to HTTP codes
      if (response == "USER_NOT_OWNER") {
        utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The user is not the owner of the film' }], }, 403);
      }
      else if (response == "NO_FILMS") {
        utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The film does not exist.' }], }, 404);
      }
      else if (response == "NO_PUBLIC_FILM") {
        utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The film is private.' }], }, 404);
      }
      else {
        utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': response }], }, 500);
      }
    });
};


/**
  Route: GET /api/films/public/{filmId}
*/
module.exports.getSinglePublicFilm = function getSinglePublicFilm(req, res, next) {
  filmService.getSinglePublicFilm(req.params.filmId)
    .then(function (response) {
      //Returns the film object
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      //error cases
      if (response == "NO_FILMS") {
        utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The film does not exist.' }], }, 404);
      }
      else if (response == "NO_PUBLIC_FILM") {
        utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The film is private.' }], }, 404);
      }
      else {
        utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': response }], }, 500);
      }
    });
};


/**
  Route: PUT /api/films/public/{filmId}
*/
module.exports.updateSinglePublicFilm = function updateSinglePublicFilm(req, res, next) {

  if(req.body.private == true){
    // You are trying to perform a disallowed operation on this resource.
    utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'Cannot change visibility'}], }, 409);
  }

  filmService.updateSinglePublicFilm(req.body, req.params.filmId, req.user.id)
    .then(function (response) {
      utils.writeJson(res, response, 204); //success
    })
    .catch(function (response) {
      //error cases
      if (response == "USER_NOT_OWNER") {
        utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The user is not the owner of the film' }], }, 403);
      }
      else if (response == "NO_FILMS") {
        utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The film does not exist.' }], }, 404);
      }
      else if (response == "NO_PUBLIC_FILM") {
        utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The film is private.' }], }, 404);
      }
      else if (response == "") {
        utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The film does not exist.' }], }, 409);
      }
      else {
        utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': response }], }, 500);
      }
    });
};