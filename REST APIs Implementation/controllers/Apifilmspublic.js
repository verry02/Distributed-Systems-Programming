'use strict';

var utils = require('../utils/writer.js');
const filmService = require('../service/FilmsService.js');
// Import constants to determine how many films to display per page (e.g., 5)
const constants = require('../utils/constants.js');

/**
  ROUTE: GET /api/films/public?pageNo=1
*/
module.exports.getPublicFilms = function getPublicFilms(req, res, next) {
  var numOfFilms = 0;
  var next = 0;

  // Ask the Service for the TOTAL number of public films.
  filmService.getPublicFilmsTotal()
    .then(function (response) {
      numOfFilms = response;

      // If the total is 0, we respond immediately to avoid the second query.
      if(numOfFilms == 0){
         return utils.writeJson(res, {
              totalPages: 1,
              currentPage: 1,
              reviews: [], 
            });
      }

      //Retrieve data for the specific page
      // req.query.pageNo reads the value after the question mark in the URL
      filmService.getPublicFilms(req.query.pageNo)
        .then(function (response) {
          
          // Default: if pageNo is missing, default to 1.
          if (req.query.pageNo == null) var pageNo = 1;
          else var pageNo = req.query.pageNo;

          // Math.ceil(11 films / 5 per page) = 2.2 -> Rounds up to 3 total pages.
          var totalPage = Math.ceil(numOfFilms / constants.ELEMENTS_IN_PAGE);
          
          // Calculate the next page number
          next = Number(pageNo) + 1;

          // If page 100 is requested but only 3 exist -> 404 Not Found
          if (pageNo > totalPage || pageNo < 1) {
            utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': "The page does not exist." }], }, 404);
          } 
          //last page
          else if (pageNo == totalPage) {
            utils.writeJson(res, {
              totalPages: totalPage,
              currentPage: pageNo,
              films: response
            });
          } 
          //Intermediate Pages (With "next" link)
          else {
            utils.writeJson(res, {
              totalPages: totalPage,
              currentPage: pageNo,
              films: response,
              next: "/api/films/public?pageNo=" + next
            });
          }
        })
        .catch(function (response) {
          // Error retrieving the list
          utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': response }], }, 500);
        });
    })
    .catch(function (response) {
      // Error retrieving the total count
      utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': response }], }, 500);
    });
};