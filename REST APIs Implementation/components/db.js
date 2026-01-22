'use strict'; //good practice to include it, enables Javascript strict mode 

//load the library that allows Node.js to interact with SQLite databases
//.verbose() enables debug messages (if there are errors, they will be printed to the console)
const sqlite = require('sqlite3').verbose();

//load the path module from Node.js to handle file paths in a cross-platform way
const path = require('path');

//define the path of the SQLite database
//__dirname is a global variable in Node.js that contains the path of the current folder
//path.join() correctly joins the various segments of the path for the operating system in use
const DBSOURCE = path.join(__dirname, '../database/databaseV1.db');

//create and/or open the database. I physically try to connect to the database specified in DBSOURCE
//(err)=> {...} is a callback function that will be executed right after attempting to open the database.
//if there's an error, err will contain the error object, otherwise it will be null.
const db = new sqlite.Database(DBSOURCE, (err) => {
    if (err) {
        // Cannot open database
        console.error(err.message); //if there's an error, print the error message to the console
        throw err; //launch an exception to stop the execution of the program
    }
    //if we reach this point, the database connection was successful.
    //db.exec() executes a SQL query without returning results (e.g., to create tables)
    //PRAGMA foreign_keys = ON; enables foreign key support in SQLite
    db.exec('PRAGMA foreign_keys = ON;', function(error)  {
        if (error){
            console.error("Pragma statement didn't work.")
        }
    });
});

//export the database object to be used in other modules
module.exports = db;
