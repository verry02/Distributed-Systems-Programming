'use strict';

// --- IMPORT LIBRARIES ---
var path = require('path'); // needed for local module imports
var http = require('http'); // needed to create server
var cors = require('cors'); // needed to handle CORS issues
var fs = require('fs'); // needed to read JSON schema files
var oas3Tools = require('oas3-tools'); // needed to handle OpenAPI / Swagger
var { Validator, ValidationError } = require('express-json-validator-middleware'); // needed to validate JSON requests
var serverPort = 3001; //server port

// --- AUTHENTICATION & SESSIONS ---
var passport = require('passport'); // needed to handle authentication
require('./passport-config'); // import the passport configuration
var session = require('express-session'); // needed to handle sessions

// --- IMPORT CONTROLLERS ---
const api = require('./controllers/Api.js');
const apiFilms = require('./controllers/Apifilms.js');
const apiFilmsPrivate = require('./controllers/Apifilmsprivate.js');
const apiFilmsPrivateFilmId = require('./controllers/ApifilmsprivatefilmId.js');
const apiFilmsPublic = require('./controllers/Apifilmspublic.js');
const apiFilmsPublicFilmId = require('./controllers/ApifilmspublicfilmId.js');
const apiFilmsPublicFilmIdReviews = require('./controllers/ApifilmspublicfilmIdreviews.js');
const apiFilmsPublicFilmIdReviewsReviewerId = require('./controllers/ApifilmspublicfilmIdreviewsreviewerId.js');
const apiFilmsPublicInvited = require('./controllers/Apifilmspublicinvited.js');
const apiFilmsPublicAssignments = require('./controllers/Apifilmspublicassignments.js');

const apiUsers = require('./controllers/Apiusers.js');
const apiUsersUserId = require('./controllers/ApiusersuserId.js');
const apiUsersAuthenticator = require('./controllers/Apiusersauthenticator.js');
const apiUsersAuthenticatorCurrent = require('./controllers/Apiusersauthenticatorcurrent.js');

// --- CORS CONFIGURATION ---
var corsOptions = {
    origin: 'http://localhost:3000', // React app domain
    credentials: true, // Enable the Access-Control-Allow-Credentials CORS header
};
  
//--- AUTHENTICATION MIDDLEWARE ---
const isLoggedIn = (req, res, next) => { 
    if(req.isAuthenticated()) {     
        return next();
    }
    return res.status(401).json({error: 'Not authorized'});
}

// --- JSON VALIDATOR CONFIGURATION ---
var filmSchema = JSON.parse(fs.readFileSync(path.join(__dirname, '../JSON Schemas/film_schema.json')).toString());
var userSchema = JSON.parse(fs.readFileSync(path.join(__dirname, '../JSON Schemas/user_schema.json')).toString());
var reviewSchema = JSON.parse(fs.readFileSync(path.join(__dirname, '../JSON Schemas/review_schema.json')).toString());

var validator = new Validator({ allErrors: true });
validator.ajv.addSchema([userSchema, filmSchema, reviewSchema]);
const addFormats = require('ajv-formats').default;
addFormats(validator.ajv);
var validate = validator.validate;

// --- Swagger / OpenAPI CONFIGURATION---
var options = {
    routing: {
        controllers: path.join(__dirname, './controllers')
    },
};

var expressAppConfig = oas3Tools.expressAppConfig(path.join(__dirname, '../REST APIs Design/openapi.yaml'), options);
var app = expressAppConfig.getApp();

// --- GLOBAL MIDDLEWARE CONFIGURATION ---
app.use(cors(corsOptions)); //Ability to accept requests from the React app

// --- SESSION   & AUTHENTICATION CONFIGURATION ---
app.use(session({
    secret: "shhhhh... it's a secret!",
    resave: false,
    saveUninitialized: false,
}));

app.use(passport.authenticate('session')); // Use passport session authentication

// --- ROUTING ---
//route base
app.get('/api', api.getFilmManager);

// invited films route
app.get('/api/films/public/invited', isLoggedIn, apiFilmsPublicInvited.getInvitedFilms);

// accept all invitations
app.post('/api/films/public/invited/acceptance', isLoggedIn, apiFilmsPublicInvited.acceptAllInvitations);

// public films routes
app.get('/api/films/public', apiFilmsPublic.getPublicFilms);

app.get('/api/films/public/:filmId', apiFilmsPublicFilmId.getSinglePublicFilm);
app.get('/api/films/public/:filmId/reviews', apiFilmsPublicFilmIdReviews.getFilmReviews);
app.get('/api/films/public/:filmId/reviews/:reviewerId', apiFilmsPublicFilmIdReviewsReviewerId.getSingleReview);

// private films routes
app.post('/api/films', isLoggedIn, validate({ body: filmSchema }), apiFilms.createFilm);

app.get('/api/films/private', isLoggedIn, apiFilmsPrivate.getPrivateFilms);
app.get('/api/films/private/:filmId', isLoggedIn, apiFilmsPrivateFilmId.getSinglePrivateFilm);
app.put('/api/films/private/:filmId', isLoggedIn, validate({ body: filmSchema }), apiFilmsPrivateFilmId.updateSinglePrivateFilm);
app.delete('/api/films/private/:filmId', isLoggedIn, apiFilmsPrivateFilmId.deleteSinglePrivateFilm);

//public films routes (modification/delete)
app.put('/api/films/public/:filmId', isLoggedIn, validate({ body: filmSchema }), apiFilmsPublicFilmId.updateSinglePublicFilm);
app.delete('/api/films/public/:filmId', isLoggedIn, apiFilmsPublicFilmId.deleteSinglePublicFilm);

// public film reviews routes
app.post('/api/films/public/:filmId/reviews', isLoggedIn, apiFilmsPublicFilmIdReviews.issueFilmReview);
app.put('/api/films/public/:filmId/reviews/:reviewerId', isLoggedIn, apiFilmsPublicFilmIdReviewsReviewerId.updateSingleReview);
app.delete('/api/films/public/:filmId/reviews/:reviewerId', isLoggedIn, apiFilmsPublicFilmIdReviewsReviewerId.deleteSingleReview);

//Review Assignments routes 
app.post('/api/films/public/assignments', isLoggedIn, apiFilmsPublicAssignments.assignReviewBalanced);

// users routes
app.get('/api/users', isLoggedIn, apiUsers.getUsers);
app.get('/api/users/:userId', isLoggedIn, apiUsersUserId.getSingleUser);

// Authenticator routes
app.post('/api/users/authenticator', apiUsersAuthenticator.authenticateUser);
app.delete('/api/users/authenticator/current', isLoggedIn,  apiUsersAuthenticatorCurrent.logoutUser);

// --- ERROR HANDLING ---
app.use(function(err, req, res, next) {
    if (err instanceof ValidationError) {
        res.status(400).send(err);
    } else next(err);
});

app.use(function(err, req, res, next) {
    if (err.name === 'UnauthorizedError') {
        var authErrorObj = { errors: [{ 'param': 'Server', 'msg': 'Authorization error' }] };
        res.status(401).json(authErrorObj);
    } else next(err);
});

// --- START SERVER ---
http.createServer(app).listen(serverPort, function() {
    console.log('Your server is listening on port %d (http://localhost:%d)', serverPort, serverPort);
    console.log('Swagger-ui is available on http://localhost:%d/docs', serverPort);
});