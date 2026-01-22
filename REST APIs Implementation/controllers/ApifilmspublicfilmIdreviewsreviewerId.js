'use strict'; 

var utils = require('../utils/writer.js');
const reviewService = require('../service/ReviewsService.js');

/*
  ROUTE: DELETE /api/films/public/:filmId/reviews/:reviewerId
 */
module.exports.deleteSingleReview = function deleteSingleReview (req, res, next) {
  reviewService.deleteSingleReview(req.params.filmId, req.params.reviewerId, req.user.id)
    .then(function (response) {
      utils.writeJson(res, response, 204); //success
    })
    .catch(function (response) {
      
      // error handling
      if (response == "NO_FILMS") {
        utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The film does not exist.' }], }, 404);
      }
      else if (response == "NO_PUBLIC_FILM") {
        utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The film is private and cannot be managed here.' }], }, 404);
      }
      else if (response == "USER_NOT_OWNER") {
        utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The user is not the owner of the film' }], }, 403);
      }
      else if (response == "ALREADY_COMPLETED") {
        utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The review has been already completed, so the invitation cannot be deleted anymore.' }], }, 409);
      }
      else if (response == "NO_REVIEWS") {
        utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The review does not exist.' }], }, 404);
      }
      else {
        utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': response }], }, 500);
      }
    });
};

/*
  ROUTE: GET /api/films/public/:filmId/reviews/:reviewerId
*/
module.exports.getSingleReview = function getSingleReview (req, res, next) {
    reviewService.getSingleReview(req.params.filmId, req.params.reviewerId)
        .then(function(response) {
            utils.writeJson(res, response); //success
        })
        .catch(function(response) {
            //error handling
            if (response == "NO_FILMS") {
                utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The public film does not exist.' }], }, 404);
            }
            else if (response == "NO_PUBLIC_FILM") {
                utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The film is private.' }], }, 404);
            }
            else if (response == "NO_REVIEWS"){
                utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The review does not exist.' }], }, 404);
            }
            else {
                utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': response }], }, 500);
            }
        });
};

/*
  ROUTE: PUT /api/films/public/:filmId/reviews/:reviewerId
*/
module.exports.updateSingleReview = function updateSingleReview (req, res, next) {
  
  if(req.params.reviewerId != req.user.id) {
    return utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The reviewerId is not equal the id of the requesting user.' }], }, 403);
  }
  
  if(req.body.completed == undefined) {
    return utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The completed property is absent.' }], }, 400);
  }
  
  if(req.body.completed == false) {
    return utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The completed property is false, but it should be set to true.' }], }, 409);
  }

  reviewService.updateSingleReview(req.body, req.params.filmId, req.params.reviewerId)
    .then(function(response) {
        utils.writeJson(res, null, 204);
    })
    .catch(function(response) {
        
        if (res.headersSent) {
            console.log("Errore catturato dopo l'invio della risposta. Ignoro.");
            return;
        }

        // error handlig 
        if (response == "FILM_NOT_FOUND") {
            utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The film does not exist.' }], }, 404);
        }
        else if (response == "FILM_PRIVATE") {
            utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The film is private.' }], }, 404); 
        }
        else if(response == "USER_NOT_REVIEWER"){
            utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The user is not a reviewer of the film' }], }, 403);
        }
        else if (response == "NO_REVIEWS" || response == "REVIEW_NOT_FOUND"){
            utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The review does not exist.' }], }, 404);
        }
        else if (response == "INVITATION_NOT_ACCEPTED"){
             utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'Invitation not accepted yet.' }], }, 400); 
        }
        else if (response == "INVITATION_CANCELLED"){
             utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'Invitation was cancelled.' }], }, 403);
        }
        else {
            utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': response }], }, 500);
        }
    });
};