'use strict';

var utils = require('../utils/writer.js');
const filmService = require('../service/FilmsService.js');
const reviewService = require('../service/ReviewsService.js');
const constants = require('../utils/constants.js');

/*
  ROUTE  GET /api/films/public/invited
*/
module.exports.getInvitedFilms = function getInvitedFilms(req, res, next) {
  var numOfFilms = 0;
  var nextPage = 0;
  
  // Retrieving the status filter from the query string (e.g., ?status=pending)
  var statusFilter = req.query.status;

  filmService.getInvitedFilmsTotal(req.user.id)
    .then(function (response) {
      numOfFilms = response;
      
      if (numOfFilms == 0) {
        return utils.writeJson(res, {
          totalPages: 1,
          currentPage: 1,
          reviews: [],
        });
      }

      // Passing the statusFilter to the service
      filmService.getInvitedFilms(req.user.id, req.query.pageNo, statusFilter)
        .then(function (response) {
          if (req.query.pageNo == null) var pageNo = 1;
          else var pageNo = req.query.pageNo;
          
          var totalPage = Math.ceil(numOfFilms / constants.ELEMENTS_IN_PAGE);
          nextPage = Number(pageNo) + 1;

          if (pageNo > totalPage || pageNo < 1) {
            utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': "The page does not exist." }], }, 404);
          } else if (pageNo == totalPage) {
            utils.writeJson(res, {
              totalPages: totalPage,
              currentPage: pageNo,
              films: response
            });
          } else {
            //Preserving the status filter in the 'next' link if it exists
            let nextLink = "/api/films/public/invited?pageNo=" + nextPage;
            if(statusFilter) nextLink += "&status=" + statusFilter;

            utils.writeJson(res, {
              totalPages: totalPage,
              currentPage: pageNo,
              films: response,
              next: nextLink
            });
          }
        })
        .catch(function (response) {
          utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': response }], }, 500);
        });
    })
    .catch(function (response) {
      utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': response }], }, 500);
    });
};

/*
  ROUTE  POST /api/films/public/invited/acceptance
*/
module.exports.acceptAllInvitations = function acceptAllInvitations(req, res, next) {
  reviewService.acceptAllPendingInvitations(req.user.id)
    .then(function () {
      utils.writeJson(res, null, 204);
    })
    .catch(function (response) {
      utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': response }], }, 500);
    });
};