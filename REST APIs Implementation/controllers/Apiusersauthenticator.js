'use strict'; 

var utils = require('../utils/writer.js');

const userService = require('../service/UsersService.js');

/*
  ROUTE: POST /api/users/authenticator
*/
module.exports.authenticateUser = function authenticateUser (req, res, next) {
  userService.authenticateUser(req, res, next)
    .then(function (response) { // Promise resolved: Login successful.
      utils.writeJson(res, response, 200); // 'response' contains the logged-in user's data (id, email, name).
    })
    .catch(function (err) { // Promise rejected: Error during login.
      
      // error handling
      if(err === 'NO_USER') {
        utils.writeJson(res, { message: 'Unauthorized access.' }, 401);
      }
      else {
          utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': err }], }, 500);
      }
    });
};