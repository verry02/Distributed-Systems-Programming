'use strict';

//Load the FilmManager component
const FilmManager = require("../components/FilmManager");

/**
    Retrieve the Film Manager, generated at server startup.
    @param {object} args - No args defined
    @returns {Promise<FilmManager>} - The Film Manager instance
 */

exports.getFilmManager = function() {   
    // Return a Promise that will resolve with the FilmManager instance
   return new Promise((resolve, reject) => {
       resolve(new FilmManager())
   })
}