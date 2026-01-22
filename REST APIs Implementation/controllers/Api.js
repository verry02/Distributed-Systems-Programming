'use strict';

// Import the "writer.js" module from the utils folder.
// It is used to take raw data and format it correctly as JSON 
// adding the right HTTP headers (Content-Type: application/json).
var utils = require('../utils/writer.js');

// Import the specific Service for this "Api" section.
// It is the one who knows how to create the "FilmManager" object with all the links.
var Api = require('../service/ApiService');

/**
  Export the 'getFilmManager' function so the Router (index.js) can use it.
  This function is executed when a user performs a GET on "/api".
  @param {} req - The request (not used here because there are no parameters).
  @param {*} res - The response (the object we will use to send data back to the client).
  @param {*} next - Used to pass control to the next middleware (not used here).
*/
module.exports.getFilmManager = function getFilmManager (req, res, next) {
  
  // The Controller asks the Service to prepare the data.
  Api.getFilmManager() //returns a promise
    .then(function (response) { //'response' contains the FilmManager object.
      
      // I use the writer utility to send the response to the client.
      // By default, writeJson uses code 200 (OK).
      utils.writeJson(res, response);//The client (Postman/Browser) will receive the JSON with the links.
    })
    
    // If there is an error in the Service code we enter here.
    .catch(function (response) {
      utils.writeJson(res, response); //send the error to the client
    });
};