'use strict'; 

var utils = require('../utils/writer.js');

const userService = require('../service/UsersService.js');

/*
  ROUTE:  GET /api/users/:userId
*/
module.exports.getSingleUser = function getSingleUser (req, res, next) {
  
  // Calls the service method passing the ID extracted from the URL path parameters.
  userService.getUserById(req.params.userId)
    .then(function (response) { // Promise resolved: The DB query was successful.
      
      // Check if the response is "falsy" (null, undefined, or false).
      // This happens if the SQL query finds no record with that ID.
      if(!response){
        // Passes 'response' (which is null/undefined) as the body, so the body will be empty.
        utils.writeJson(res, response, 404);
     } else {
       // If 'response' contains data (the user object), it sends it to the client.
       utils.writeJson(res, response);
    }
    })
    .catch(function (response) { // Promise rejected: Server error (e.g., DB unreachable).
      utils.writeJson(res, {errors: [{ 'param': 'Server', 'msg': response }],}, 500);
    });
};