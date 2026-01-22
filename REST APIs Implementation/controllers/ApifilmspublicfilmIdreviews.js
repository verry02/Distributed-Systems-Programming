'use strict';

var utils = require('../utils/writer.js');
const reviewService = require('../service/ReviewsService.js');
const constants = require('../utils/constants.js');

/**
  ROUTE: GET /api/films/public/:filmId/reviews
*/
module.exports.getFilmReviews = function getFilmReviews(req, res, next) {
  var numOfReviews = 0;
  var nextPage = 0;

  // Extract the status filter from the query string
  var statusFilter = req.query.status;

  // Retrieve the user ID if logged in, otherwise null.
  // This is needed by the Service to determine if the requester is the film owner.
  const requesterId = req.user ? req.user.id : null;

  reviewService.getFilmReviewsTotal(req.params.filmId)
    .then(function (response) {
      numOfReviews = response;

      reviewService.getFilmReviews(req.query.pageNo, req.params.filmId, statusFilter, requesterId)
        .then(function (response) {
          if (req.query.pageNo == null) var pageNo = 1;
          else var pageNo = req.query.pageNo;
          
          var totalPage = Math.ceil(numOfReviews / constants.ELEMENTS_IN_PAGE);
          nextPage = Number(pageNo) + 1;
          
          if (pageNo > totalPage || pageNo < 1) {
            utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': "The page does not exist." }], }, 404);
          } else if (pageNo == totalPage) {
            utils.writeJson(res, {
              totalPages: totalPage,
              currentPage: pageNo,
              reviews: response
            });
          } else {
            let nextLink = "/api/films/public/" + req.params.filmId + "/reviews?pageNo=" + nextPage;
            if (statusFilter) nextLink += "&status=" + statusFilter;

            utils.writeJson(res, {
              totalPages: totalPage,
              currentPage: pageNo,
              reviews: response,
              next: nextLink
            });
          }
        })
        .catch(function (response) {
            // Error handling if the film does not exist
            if(response == "NO_FILMS") {
                utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'there is not any invite.' }], }, 404);
            } 
            else if(response == "NO_PUBLIC_FILM") {
                utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The film is private.' }], }, 404);
            } 
            
            else {
                utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': response }], }, 500);
            }
        });
    })
    .catch(function (response) {
      utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': response }], }, 500);
    });
};

/**
  ROUTE: POST /api/films/public/:filmId/reviews
*/
module.exports.issueFilmReview = function issueFilmReview(req, res, next) {
  if (!Array.isArray(req.body)) {
    return utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': "The request body must be an array of review objects." }]}, 400);
  }

  var differentFilm = false;
  for (var i = 0; i < req.body.length; i++) {
    if (req.params.filmId != req.body[i].filmId) {
      differentFilm = true;
    }
  }
  if (differentFilm) {
    utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The filmId field of the review object is different from the filmdId path parameter.' }], }, 409);
  }
  else {
    reviewService.issueFilmReview(req.body, req.user.id)
      .then(function (response) {
        utils.writeJson(res, response, 201);
      })
      .catch(function (response) {
        if (response == "USER_NOT_OWNER") {
          utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The user is not the owner of the film' }], }, 403);
        }
        else if (response == "NO_FILMS" || response == "PRIVATE_FILM") {
          utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The public film does not exist.' }], }, 404);
        }
        else if (response == "REVIEWER_ID_IS_NOT_USER") {
          utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The user with ID reviewerId does not exist.' }], }, 404);
        }
        else if (response == "EXISTING_REVIEW") {
          utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The review already exist for this film and reviewer' }], }, 409);
        }
        else if (response == "INVALID_DATE") {
          utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'Expiration date cannot be in the past.' }], }, 400);
        }
        else if (response == "INVALID_DATE_FORMAT") {
          utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'Invalid date format.' }], }, 400);
        }
        else {
          utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': response }], }, 500);
        }
      });
  }
};