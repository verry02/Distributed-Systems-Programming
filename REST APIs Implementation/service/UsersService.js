'use strict';


// Import utilities to create User objects
const serviceUtils = require('../utils/serviceUtils.js');
// Import database connection
const db = require('../components/db');
// Import Passport to handle authentication
var passport = require('passport');

/**
  this function authenticates a user using Passport's 'local' strategy.
  @param {Object} req - The HTTP request object containing user credentials.
  @param {Object} res - The HTTP response object.
  @param {Function} next - The next middleware function in the Express.js stack.
  @returns {Promise} - A promise that resolves with user data if authentication is successful, or rejects with an error.
 */
exports.authenticateUser = function(req, res, next) {
  return new Promise((resolve, reject) => {
      // call the 'local' strategy configured in passport-config.js.
      // (err, user, info) are the results of the 'verify' function of that strategy.
      passport.authenticate('local', (err, user, info) => {
        if (err) return reject(err); // technical error, eg. connection lost
        if (!user) return reject('NO_USER'); // user not found or wrong password
        
        //credentials are valid. Tell Passport to log in the user.
        // req.login is the function that physically writes the session Cookie in the browser.
        req.login(user, (err) => {
          if (err) return reject(err); // something went wrong while establishing the session
          
          //login successful. Return user data (without password) to the Controller.
          //note: req.body.email instead of user.email because 'user' comes from the DB and has no email field (only id, name)
          //the email  was sent by the client duirng the login action.
          return resolve({ id: user.id, name: user.name, email: req.body.email });
        });
      })(req, res, next); //return the results of passport.authenticate
    });
}

/**
  This function logs out the currently authenticated user by destroying his session.
  @param {*} req - The HTTP request object containing user session information.
  @param {*} res - The HTTP response object.
  @returns {Promise} - A promise that resolves when the user is successfully logged out, or rejects with an error.
 */
exports.logoutUser = function(res, req) {
  return new Promise(function(resolve, reject) {
      // Retrieve the email of the currently logged-in user (req.user exists thanks to the cookie)
      const email = req.user.email;
      
      // Verify that the user still exists in the DB before logging them out.
      serviceUtils.getUserByEmail(email)
        .then((user) => {
          if (user === undefined) {
            reject("NO_USER"); // User not found in DB
          } else {
            //req.logout() destroys the session and clears the cookie on the server side.
            req.logout(() => {
              resolve(); // Logout successful
            });
          }
        })
  });
}

/**
  This function retrieves all users from the database.
  @param none
  @returns {Promise} - A promise that resolves with an array of User objects, or undefined if no users are found.
 */
exports.getUsers = function () {
  return new Promise((resolve, reject) => {
    //do not select 'hash' (the password). For security, it must never leave the DB unless necessary.
    const sql = "SELECT id, name, email FROM users";
    
    db.all(sql, [], (err, rows) => {
      if (err) {
        reject(err); // Database error
      } else {
        if (rows.length === 0)
          resolve(undefined); // No users found
        else {
          // Transform raw rows into User objects using the utility
          let users = rows.map((row) => serviceUtils.createUser(row));
          resolve(users);
        }
      }
    });
  });
}

/**
  This function retrieves a user from the database by his ID.
  @param {*} id - The ID of the user to retrieve.
  @returns - {Promise} - A promise that resolves with a User object if found, or undefined if not found.
 */
exports.getUserById = function (id) {
  return new Promise((resolve, reject) => {
    // Here too, no password in the SELECT.
    const sql = "SELECT id, name, email FROM users WHERE id = ?"
    
    db.all(sql, [id], (err, rows) => {
      if (err)
        reject(err); // Database error
      else if (rows.length === 0)
        resolve(undefined); // ID not found
      else {
        // Take the first (and only) row and create the User object
        const user = serviceUtils.createUser(rows[0]);
        resolve(user);
      }
    });
  });
};