//this file contains utility functions used by services

'use strict';

// --- IMPORT ---
const db = require('../components/db.js'); //database sqlite3

//import of models. they serve to convert raw db data into clean objects
const Film = require('../components/film.js');
const User = require('../components/user.js');
const Review = require('../components/review.js');

const bcrypt = require('bcrypt'); //for password hashing

var constants = require('./constants.js'); //file with constants

// --- SECTION 1 : FILM UTILITIES ---

/**
    Calculate the LIMIT and OFFSET parameters for paginating film results in an SQL query.
    @param {string|number} pageNo - requested page number
    @returns {Array} - Array containing OFFSET and LIMIT values for SQL query
 */
exports.getFilmPagination = function (pageNo) {
    var pageNumber = parseInt(pageNo); // Convert pageNo from a string to an integer
    
    //if pageNo is not a valid number (e.g., "ciao" or undefined), set default page to 1
    if (isNaN(pageNumber) || pageNo == null) {
        pageNumber = 1;
    }

    //retrieve page size from constants.js
    var size = parseInt(constants.ELEMENTS_IN_PAGE); 

    //array to hold OFFSET and LIMIT
    var limits = []; 

    //compute OFFSET
    //Formula: (CurrentPage - 1) * ItemsPerPage
    // Pagina 1 -> (1-1)*2 = 0 (Salto 0)
    // Pagina 2 -> (2-1)*2 = 2 (Salto i primi 2)
    limits.push(size * (pageNumber - 1)); 

    //add limit (how many items to take)
    limits.push(size);

    console.log("PageNo params: " + limits); //logging for debugging

    return limits;
}

/**
    Converts a raw database row into a Film object.
    @param {object} row -  the object returned from SQLite 
    @returns {Film} - film instance
*/
exports.createFilm = function (row) {
    //SQLite does not have booleans, it uses 1 and 0.
    //I need to convert them to true/false
    var privateFilm = (row.private === 1) ? true : false;
    
    //Handle the 'watchDate' field: it can be NULL in the DB.
    var favoriteFilm;
    if (row.favorite == null) {
        favoriteFilm = undefined; //if NULL in DB, set to undefined in JS
    } else {
        favoriteFilm = (row.favorite === 1) ? true : false;
    }
    //I create and return the object using the Film class constructor
    return new Film(row.fid, row.title, row.owner, privateFilm, row.watchDate, row.rating, favoriteFilm);
}

// --- SECTION 2 : REVIEW UTILITIES ---

/**
    Compute the parameters for paginating review results in an SQL query.
    @param {string|number} pageNo - requested page number.
    @param {number} filmId - ID of the film for which we are fetching reviews.
    @returns {Array} - Array containing [filmId, filmId, OFFSET, LIMIT].
 */
exports.getReviewPagination = function (pageNo, filmId) {
    var pageNumber = parseInt(pageNo); // Convert pageNo from a string to an integer
    // If pageNo is not a valid number (e.g., "ciao" or undefined), set default page to 1
    if (isNaN(pageNumber) || pageNo == null) {
        pageNumber = 1;
    }
    // Retrieve page size from constants.js
    var size = parseInt(constants.ELEMENTS_IN_PAGE);
    var limits = []; // Array to hold parameters

    //Add filmId twice, because the SQL query needs it two times.
    limits.push(filmId);
    limits.push(filmId);

    // Compute OFFSET
    limits.push(size * (pageNumber - 1));
    limits.push(size);

    return limits;
}

/**
    converts a database row into a Review object.
    @param {object} row - the object returned from SQLite
    @returns {Review} - review instance
 */
exports.createReview = function (row) {
    //convert SQLite 1/0 to true/false
    var completedReview = (row.completed === 1) ? true : false;

    //create and return the Review object
    return new Review(
        row.fid,            // filmId
        row.rid,            // reviewerId 
        completedReview,    // completed
        row.reviewDate,     
        row.rating, 
        row.review,
        row.invitationStatus, 
        row.expirationDate    
    );
}

// --- SECTION 3 : USER UTILITIES ---
/**
    Creates a User object from database row data.
    @param {object} row - the object returned from SQLite
    @returns {User} - user instance
 */
exports.createUser = function (row) {
    const id = row.id;
    const name = row.name;
    const email = row.email;
    const hash = row.hash;
    
    return new User(id, name, email, hash);
}

/**
    checks if the provided password matches the hashed password in the database.
    @param {User} user - The user object retrieved from the DB (which contains the real hash).
    @param {string} password - The plain-text password entered by the user in the login form.
    @returns {boolean} - true if they match, false otherwise.
 */
exports.checkPassword = function (user, password) {
    //verify the password using bcrypt and return the result
    return bcrypt.compareSync(password, user.hash);
}

/**
    searches for a user in the database by email.
    @param {string} email - The email to search for.
    @returns {Promise<User|undefined>} - Returns the user if found, undefined if not found.
 */
exports.getUserByEmail = function (email) {
    return new Promise((resolve, reject) => {
        //Query SQL to find user by email
        const sql = "SELECT * FROM users WHERE email = ?";
        //Execute the query
        db.all(sql, [email], (err, rows) => {
            if (err) {
                reject(err); // Reject the promise with the error (DB error)
            }
            else if (rows.length === 0) {
                resolve(undefined); //not found, user may not exist
            }
            else {
                //user found
                //with the function 'createUser', create the object
                const user = exports.createUser(rows[0]);
                resolve(user); //then resolve the promise with the user object
            }
        });
    });
};