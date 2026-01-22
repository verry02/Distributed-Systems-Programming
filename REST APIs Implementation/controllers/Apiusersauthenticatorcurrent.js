'use strict'; 
var utils = require('../utils/writer.js');

const userService = require('../service/UsersService.js');

/*
  ROUTE:  DELETE /api/users/authenticator/current
*/
module.exports.logoutUser = function logoutUser (req, res, next) {
  // Calls the logout function in the service.
  userService.logoutUser(res, req)
    .then(function (response) { // Promise resolved: Logout successful.
        
        // Writes the response to the client.
        // (the user has been logged out, so sending data back is unnecessary).
        utils.writeJson(res, response, 204);
    })
    .catch(function (err) { // Promise rejected: Something went wrong.
      if(err === 'NO_USER') {
        utils.writeJson(res, { message: 'Unauthorized access.' }, 401);
      }
      else {
          utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': err }], }, 500);
      }
    });
};