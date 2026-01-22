'use strict';

var utils = require('../utils/writer.js');
const filmService = require('../service/FilmsService.js');
// Import constants to know how many elements fit on a page (e.g., '2')
const constants = require('../utils/constants');

/**
  ROUTE: GET /api/films/private?pageNo=1
*/
module.exports.getPrivateFilms = function getPrivateFilms(req, res, next) {
  var numOfFilms = 0;
  var next = 0;

  //retrieve how mani films are private. 
  // This is needed to calculate the number of pages (TotalPages).
  filmService.getPrivateFilmsTotal(req.user.id)
    //response is the number of films
    .then(function (response) {
      numOfFilms = response; 

      // If the user has no private films,we respond immediately with a clean empty object.
      if(numOfFilms == 0){
         return utils.writeJson(res, {
              totalPages: 1,
              currentPage: 1,
              reviews: [], //empty
            });
      }

      // If there are films, we now request those for the specific page (e.g., Page 1).
      filmService.getPrivateFilms(req.user.id, req.query.pageNo)
        .then(function (response) {
          
          //if the user doesn't specify ?pageNo, we assume it is 1.
          if (req.query.pageNo == null) var pageNo = 1;
          else var pageNo = req.query.pageNo;

          var totalPage = Math.ceil(numOfFilms / constants.ELEMENTS_IN_PAGE);

          next = Number(pageNo) + 1; // Calculate the next page number

          //error handling 
          if (pageNo > totalPage || pageNo < 1) {
            utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': "The page does not exist." }], }, 404);
          } 
          
          // If we are on the last page, we must NOT generate the "next" link.
          else if (pageNo == totalPage) {
            utils.writeJson(res, {
              totalPages: totalPage,
              currentPage: pageNo,
              films: response
            });
          } 
          
          // If there are still pages after this one, we generate the "next" link.
          else {
            utils.writeJson(res, {
              totalPages: totalPage,
              currentPage: pageNo,
              films: response,
              // Construct the complete URL for the next page.
              next: "/api/films/" + req.params.userId + "/films/private?pageNo=" + next
            });
          }
        })
        .catch(function (response) {
          // Error retrieving the film list
          utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': response }], }, 500);
        });
    })
    .catch(function (response) {
      // Error retrieving the total count
      utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': response }], }, 500);
    });
};