'use strict';

var utils = require('../utils/writer.js');

const userService = require('../service/UsersService.js');

/*
   GET /api/users
*/
module.exports.getUsers = function getUsers (req, res, next) {
  
  // Calls the service's getUsers method.
  userService.getUsers()
    .then(function (response) { // Promise resolved successfully.
      utils.writeJson(res, response); // 'response' contains the array of user objects.
    })
    .catch(function (response) { // Promise rejected (error).
      utils.writeJson(res, response);// Passes the error directly to the writing function.
    });
};