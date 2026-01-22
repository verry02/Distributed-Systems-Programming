/*                          PASSPORT CONFIGURATION FILE

    in this file we configure the "passport" library for user authentication.
    It defines how to serialize/deserialize users and how to verify login credentials.
*/

//import of the utility functions because I need getUserByEmail() and checkPassword().
const serviceUtils = require('./utils/serviceUtils.js');

// import of passport library
var passport = require('passport');

//import of passport strategies. 
//it means: "Local Authentication with Username and Password stored in our database"
//(Other strategies could be "Login with Google", "Login with Facebook", etc.)
var LocalStrategy = require('passport-local');

/* --- 1. SERIALIZATION ---
    This function is called once, right after login is successful.
    It decides what to save in the browser session cookie (in this case the entire user object).
 */
passport.serializeUser(function (user, cb) { 
    cb(null, user);
});

/* --- 2. DESERIALIZATION ---
    This function is called on every page the user visits. 
    It reads the data from the cookie and puts it into 'req.user' so Controllers can use it. 
*/
passport.deserializeUser(function (user, cb) { 
    return cb(null, user); 
});

/* --- 3. DEFINITION OF THE STRATEGY  ---
    Here I explain to Passport how to verify if the credentials are correct.
*/
passport.use(new LocalStrategy({
    //configuration of the fields:
    usernameField: 'email', 
    passwordField: 'password'

}, async function verify(username, password, done) {
    //this async function will be called when a user tries to log in.
    //username and password are the credentials entered in the login form.
    //done is a callback function we must call to indicate success or failure.

    // step 1: Retrieve the user from the database by email
    serviceUtils.getUserByEmail(username)
        .then((user) => {
            // CASE 1: No user with that email
            if (user === undefined) {
                // done(erroreServer, utenteTrovato, messaggio)
                //null = no server error
                // false = login failed (no user found)
                return done(null, false, { message: 'Unauthorized access.' });
            } else {
                //CASE 2: User with that email exists, now check the password
                //I use the utility function to compare passwords with hash
                if (!serviceUtils.checkPassword(user, password)) {
                    // wrong password
                    return done(null, false, { message: 'Unauthorized access.' });
                } else {
                    //CASE 3: email correct and password correct! return the user object
                    return done(null, user);
                }
            }
        })
        .catch(err => {
            //CASE 4: code error
            // pass the error to Passport
            done(err);
        });
}));