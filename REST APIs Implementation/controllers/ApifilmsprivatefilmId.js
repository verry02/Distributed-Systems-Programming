'use strict';

var utils = require('../utils/writer.js');
const filmService = require('../service/FilmsService.js');

/**
  ROUTE: DELETE /api/films/private/:filmId
*/
module.exports.deleteSinglePrivateFilm = function deleteSinglePrivateFilm(req, res, next) {
  filmService.deleteSinglePrivateFilm(req.params.filmId, req.user.id)
    .then(function (response) {
      utils.writeJson(res, response, 204);
    })
    .catch(function (response) {
      if (response == "USER_NOT_OWNER") {
        utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The user is not the owner of the film' }], }, 403);
      }
      else if (response == "NO_FILMS") {
        utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The film does not exist.' }], }, 404);
      }
      else {
        utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': response }], }, 500);
      }
    });
};

/**
  ROUTE: GET /api/films/private/:filmId
*/
module.exports.getSinglePrivateFilm = function getSinglePrivateFilm(req, res, next) {
  filmService.getSinglePrivateFilm(req.params.filmId, req.user.id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      if (response == "USER_NOT_OWNER") {
        utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The user is not the owner of the film.' }], }, 403);
      }
      else if (response == "NO_FILMS") {
        utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The film does not exist.' }], }, 404);
      }
      else if (response == "NO_PRIVATE_FILM") {
        utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The film is public' }], }, 404);
      }
      else {
        utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': response }], }, 500);
      }
    });
};

/**
  ROUTE: PUT /api/films/private/:filmId
*/
module.exports.updateSinglePrivateFilm = function updateSinglePrivateFilm(req, res, next) {
    if(req.body.private == false){
      utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'Cannot change visibility'}], }, 409);
    }
  filmService.updateSinglePrivateFilm(req.body, req.params.filmId, req.user.id)
    .then(function (response) {
      utils.writeJson(res, response, 204);
    })
    .catch(function (response) {
      if (response == "USER_NOT_OWNER") {
        utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The user is not the owner of the film' }], }, 403);
      }
      else if (response == "NO_FILMS") {
        utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The film does not exist.' }], }, 404);
      }
      else if (response == "NO_PRIVATE_FILM") {
        utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The visibility of the film cannot be changed.' }], }, 409);
      }
      else {
        utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': response }], }, 500);
      }
    });
};