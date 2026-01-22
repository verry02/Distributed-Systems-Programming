'use strict';

const db = require('../components/db');
const serviceUtils = require('../utils/serviceUtils');
const Film = require('../components/film');

/**
  this function creates a new film in the database
  @param {*} film - the film object to be created
  @param {*} owner - the owner of the film
  @returns - the created film object with the assigned id
*/
exports.createFilm = function (film, owner) {
  return new Promise((resolve, reject) => {

    const sql = 'INSERT INTO films(title, owner, private, watchDate, rating, favorite) VALUES(?,?,?,?,?,?)';
    db.run(sql, [film.title, owner, film.private, film.watchDate, film.rating, film.favorite], function (err) {
      if (err) {
        reject(err); //database error
      } else {
        //return the created film object
        var createdFilm = new Film(this.lastID, film.title, owner, film.private, film.watchDate, film.rating, film.favorite);
        resolve(createdFilm);
      }
    });
  });
}

/**
  this function retrieves the private films of a user with ID userId
  @param {*} userId - the ID of the user whose private films are to be retrieved
  @param {*} pageNo - the page number for pagination
  @returns - a promise that resolves to an array of private films
*/
exports.getPrivateFilms = function (userId, pageNo) {
  return new Promise((resolve, reject) => {

    var sql = "SELECT f.id as fid, f.title, f.owner, f.private, f.watchDate, f.rating, f.favorite, c.total_rows FROM films f, (SELECT count(*) total_rows FROM films l WHERE l.private=1 AND owner = ?) c WHERE  f.private = 1 AND owner = ?"
    //pagination. If pageNo is not provided, all films are returned, otherwise only the films of the requested page are returned
    var limits = serviceUtils.getFilmPagination(pageNo); 
    //append the pagination clause to the sql query
    if (limits.length != 0) sql = sql + " LIMIT ?,?";
    var parameters = [userId, userId];  //parameters for owner in both main query and count subquery
    parameters = parameters.concat(limits); //add pagination parameters if any
    db.all(sql, parameters, (err, rows) => { //execute the query
      if (err) {
        reject(err); //database error
      } else {
        let films = rows.map((row) => serviceUtils.createFilm(row)); //map each row to a Film object
        resolve(films); //return the array of private films
      }
    });
  });
}

/**
  this function retrieves the total number of private films for a given user
  @param {*} userId - the ID of the user whose private films count is to be retrieved
  @returns - a promise that resolves to the total number of private films
*/
exports.getPrivateFilmsTotal = function (userId) {
    return new Promise((resolve, reject) => {
      //SQL query to count the number of private films for the given user
        var sqlNumOfFilms = "SELECT count(*) total FROM films f WHERE private = 1 AND owner = ? ";
        db.get(sqlNumOfFilms, [userId], (err, size) => {
            if (err) {
                reject(err); //database error
            } else {
                resolve(size.total); //return the total number of private films
            }
        });
    });
}

/**
  this function retrieves the public films with pagination
  @param {*} pageNo - the page number for pagination
  @returns - a promise that resolves to an array of public films
*/
exports.getPublicFilms = function (pageNo) {
  return new Promise((resolve, reject) => {

    var sql = "SELECT f.id as fid, f.title, f.owner, f.private, c.total_rows FROM films f, (SELECT count(*) total_rows FROM films l WHERE l.private=0) c WHERE  f.private = 0 "
    var limits = serviceUtils.getFilmPagination(pageNo);
    if (limits.length != 0) sql = sql + " LIMIT ?,?";

    db.all(sql, limits, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        let films = rows.map((row) => serviceUtils.createFilm(row)); //map each row to a Film object
        resolve(films); //return the array of public films
      }
    });
  });
}
/**
  this function retrieves the total number of public films
  @returns - a promise that resolves to the total number of public films
*/
exports.getPublicFilmsTotal = function () {
    return new Promise((resolve, reject) => {
        var sqlNumOfFilms = "SELECT count(*) total FROM films f WHERE private = 0 ";
        db.get(sqlNumOfFilms, [], (err, size) => {
            if (err) {
                reject(err);
            } else {
                resolve(size.total);
            }
        });
    });
}

/**
  this function deletes a public film with the given filmId if the owner matches
  @param {*} filmId - the ID of the film to be deleted
  @param {*} owner - the owner of the film
  @returns - a promise that resolves when the film is deleted
*/
exports.deleteSinglePublicFilm = function(filmId, owner) {
  return new Promise((resolve, reject) => {
      const sql1 = "SELECT owner, private FROM films f WHERE f.id = ?"; 
      
      db.all(sql1, [filmId], (err, rows) => {
          if (err)
              reject(err);
          else if (rows.length === 0)
              reject("NO_FILMS");
          // Now rows[0].private will have a value (0 or 1) and the check will work
          else if(rows[0].private == 1) 
            reject("NO_PUBLIC_FILM");
          else if(owner != rows[0].owner) {
              reject("USER_NOT_OWNER");
          }
          else {
              const sql2 = 'DELETE FROM reviews WHERE filmId = ?';
              db.run(sql2, [filmId], (err) => {
                  if (err)
                      reject(err);
                  else {
                      const sql3 = 'DELETE FROM films WHERE id = ?';
                      db.run(sql3, [filmId], (err) => {
                          if (err)
                              reject(err);
                          else
                              resolve(null);
                      })
                  }
              })
          }
      });
  });
}

/**
  this function retrieves a single public film by its ID
  @param {*} filmId - the ID of the film to be retrieved
  @returns - a promise that resolves to the retrieved film
*/
exports.getSinglePublicFilm = function (filmId) {
  return new Promise((resolve, reject) => {
    const sql = "SELECT id as fid, title, owner, private FROM films WHERE id = ?";
    db.all(sql, [filmId], (err, rows) => {
      if (err)
        reject(err); //database error
      else if (rows.length === 0) //no film found with the given ID
        reject("NO_FILMS"); //error: no film found 
      else if (rows[0].private == 1) //film is private
        reject("NO_PUBLIC_FILM"); //error: not a public film
      else {
        var film = serviceUtils.createFilm(rows[0]);
        resolve(film); //return the retrieved film
      }
    });
  });
}

/**
  this function updates a single public film by its ID
  @param {*} film - the updated film 
  @param {*} filmId - the film ID of the film to update
  @param {*} owner - the user owner of the film
  @returns - a promise that resolves when the film is updated
*/
exports.updateSinglePublicFilm = function (film, filmId, owner) {
  return new Promise((resolve, reject) => {

    const sql1 = "SELECT owner, private FROM films f WHERE f.id = ?";
    db.all(sql1, [filmId], (err, rows) => {
      if (err)
        reject(err);
      else if (rows.length === 0)
        reject("NO_FILMS");
      else if (rows[0].private == 1)
        reject("NO_PUBLIC_FILM");
      else if (owner != rows[0].owner) {
        reject("USER_NOT_OWNER");
      }
      else {
        var sql3 = 'UPDATE films SET title = ?'; //query to update the film
        var parameters = [film.title];
        sql3 = sql3.concat(' WHERE id = ?');
        parameters.push(filmId);

        db.run(sql3, parameters, function (err) {
          if (err) {
            reject(err);
          } else {
            resolve(null);
          }
        })
      }
    });
  });
}

/**
  This function deletes a private film
  @param {*} filmId - ID of the film to delete
  @param {*} owner - user owner of the film 
  @returns - no response value expected for this operation
*/
exports.deleteSinglePrivateFilm = function (filmId, owner) {
  return new Promise((resolve, reject) => {
    const sql1 = "SELECT owner FROM films f WHERE f.id = ? AND f.private = 1";
    db.all(sql1, [filmId], (err, rows) => {
      if (err)
        reject(err); //database error
      else if (rows.length === 0)
        reject("NO_FILMS"); //no film found 
      else if (owner != rows[0].owner) {
        reject("USER_NOT_OWNER"); //the user isn't the owner of the film 
      }
      else {
        //Query for deleting the film
        const sql3 = 'DELETE FROM films WHERE id = ?';
        db.run(sql3, [filmId], (err) => {
          if (err)
            reject(err); //error database 
          else
            resolve(null); //success 
        })
      }
    });
  });
}

/**
  This function retrieve a private film from the Id given, only if the user is the owner
  @param {*} filmId - Film id of the film to retrieve
  @param {*} owner - user owner of the film
  @returns - resolves the promise returning the film
*/
exports.getSinglePrivateFilm = function (filmId, owner) {
  return new Promise((resolve, reject) => {
    const sql1 = "SELECT id as fid, title, owner, private, watchDate, rating, favorite FROM films WHERE id = ?";
    
    db.all(sql1, [filmId], (err, rows) => {
      if (err) {
        reject(err);
      } 

      else if (rows.length === 0) {
        reject("NO_FILMS"); //the film doesn't exist
      }
      
      else if (rows[0].owner != owner) {
        reject("USER_NOT_OWNER"); //film found, but the user isn't the owner
      }

      else if (rows[0].private == 0) {
        reject("NO_PRIVATE_FILM"); //film and user found, but the film isn't private
      }

      else {
        var film = serviceUtils.createFilm(rows[0]);
        resolve(film); //all good, so return the film 
      }
    });
  });
}

/**
  this function updates a private film
  @param {*} filmId - Film id of the film to retrieve
  @param {*} owner - user owner of the film
  @returns - no response value expected for this operation
**/
exports.updateSinglePrivateFilm = function (film, filmId, owner) {
  return new Promise((resolve, reject) => {

    const sql1 = "SELECT owner, private FROM films f WHERE f.id = ?";
    db.all(sql1, [filmId], (err, rows) => {
      if (err)
        reject(err);
      else if (rows.length === 0)
        reject("NO_FILMS" ); // no film found
      else if (rows[0].private == 0)
        reject("NO_PRIVATE_FILM" ) //film found but public 
      else if (owner != rows[0].owner) {
        reject("USER_NOT_OWNER" ); //the user isn't the owner of the film 
      }
      else {

        var sql3 = 'UPDATE films SET title = ?';
        var parameters = [film.title];

        if (film.watchDate != undefined) {
          sql3 = sql3.concat(', watchDate = ?');
          parameters.push(film.watchDate);
        }
        if (film.rating != undefined) {
          sql3 = sql3.concat(', rating = ?');
          parameters.push(film.rating);
        }
        if (film.favorite != undefined) {
          sql3 = sql3.concat(', favorite = ?');
          parameters.push(film.favorite);
        }
        sql3 = sql3.concat(' WHERE id = ?');
        parameters.push(filmId);

        db.run(sql3, parameters, function (err) {
          if (err) {
            reject(err);
          } else {
            resolve(null);
          }
        })
      }
    });
  });
}

/**
  this is an helper function that Checks and updates expired invitations before fetching them.
  @param {*} reviewerId - id of the user reviewer 
*/
const checkAndExpireInvitations = (reviewerId) => {
  return new Promise((resolve, reject) => {
    // Update to 'expired' if the status is 'pending' AND the expirationDate is in the past
    const sql = "UPDATE reviews SET invitationStatus = 'expired' WHERE invitationStatus = 'pending' AND expirationDate < DATETIME('now') AND reviewerId = ?";
    db.run(sql, [reviewerId], (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
};

/**
  this function retrieves films the user has been invited to review. 
  Modified to support the STATUS filter and hide expired invitations.
 * @param {*} reviewerId - id of the user reviewer of the film
 * @param {*} pageNo  - the page number for pagination
 * @param {*} statusFilter - "accepted", "pending", "expired"
 * @returns - resolves the promise returning the list of films with invitations 
*/
exports.getInvitedFilms = function (reviewerId, pageNo, statusFilter) {
  return new Promise(async (resolve, reject) => {
    //Before reading, update expirations for this user
    try {
        await checkAndExpireInvitations(reviewerId);
    } catch (e) {
        reject(e);
        return;
    }

    // Select films joining with the reviews table. The expired won't be shown.
    // for this reason, we add: AND r.invitationStatus != 'expired'
    var sql = "SELECT f.id as id, f.title as title, f.owner as owner, f.private as private, f.watchDate as watchDate, f.rating as rating, f.favorite as favorite, c.total_rows FROM films f, reviews r, (SELECT count(*) total_rows FROM films f2, reviews r2 WHERE f2.id = r2.filmId AND r2.reviewerId = ? AND r2.invitationStatus != 'expired'";
    // Parameters for the count subquery
    var countParams = [reviewerId];
    
    // If there is a filter (e.g., 'pending'), add it to the count
    if (statusFilter) {
        sql += " AND r2.invitationStatus = ?";
        countParams.push(statusFilter);
    }
    sql += ") c WHERE f.id = r.filmId AND r.reviewerId = ? AND r.invitationStatus != 'expired'";

    // Parameters for the main query
    var params = [...countParams, reviewerId];

    // If there is a filter, add it to the main query
    if (statusFilter) {
        sql += " AND r.invitationStatus = ?";
        params.push(statusFilter);
    }

    // Pagination
    if (pageNo) {
        const limit = 10;
        const offset = (pageNo - 1) * limit;
        sql += " LIMIT ? OFFSET ?";
        params.push(limit);
        params.push(offset);
    }

    //execution 
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err); //database error
      } else {
        // Mapping results to Film objects
        let films = rows.map((row) => serviceUtils.createFilm(row));
        resolve(films); //return the list of the films 
      }
    });
  });
}

/**
  This function counts total invited films axcluding the expired ones
 * @param {*} reviewerId - id of the user reviewer of the film
 * @returns - total number of invited films
*/
exports.getInvitedFilmsTotal = function (reviewerId) {
  return new Promise((resolve, reject) => {
    var sqlNumOfFilms = "SELECT count(*) total FROM reviews WHERE reviewerId = ? AND invitationStatus != 'expired'";
    db.get(sqlNumOfFilms, [reviewerId], (err, size) => {
      if (err) {
        reject(err);
      } else {
        resolve(size.total);
      }
    });
  });
}

/**
  this is the function for Balanced Assignment. 
  Automatically assigns public films without reviews to users with the least load.
 */
exports.assignReviewBalanced = function() {
    return new Promise(async (resolve, reject) => {
        try {
          //in the review table, find public films without reviews
            const sqlFilms = "SELECT id, owner FROM films WHERE private = 0 AND id NOT IN (SELECT filmId FROM reviews)";
            
            const filmsToAssign = await new Promise((res, rej) => {
                db.all(sqlFilms, [], (err, rows) => (err ? rej(err) : res(rows)));
            });

            if (filmsToAssign.length === 0) {
                resolve({ message: "No films need assignment" });
                return;
            }

            //now find all users 
            const sqlUsers = "SELECT id FROM users"; 
            const users = await new Promise((res, rej) => {
                db.all(sqlUsers, [], (err, rows) => (err ? rej(err) : res(rows)));
            });
            
            //calculate the number of reviews for each user.
            let userLoad = {};
            users.forEach(u => userLoad[u.id] = 0); //initialize to 0 for everyone

            // Get actual current load from DB
            const sqlLoad = "SELECT reviewerId, COUNT(*) as cnt FROM reviews GROUP BY reviewerId";
            const currentLoads = await new Promise((res, rej) => {
                db.all(sqlLoad, [], (err, rows) => (err ? rej(err) : res(rows)));
            });

            // Update map with real data
            currentLoads.forEach(row => {
                if (userLoad[row.reviewerId] !== undefined) {
                    userLoad[row.reviewerId] = row.cnt;
                }
            });

            // For each film to assign, choose the user who currently has fewest reviews
            let assignmentsMade = 0;
            const insertPromises = [];
            const sqlInsert = "INSERT INTO reviews (filmId, reviewerId, completed, invitationStatus) VALUES (?, ?, 0, 'pending')";

            for (let film of filmsToAssign) {
                // Find user ID with minimum value in userLoad
                let bestUser = null;
                let minLoad = Infinity;

                // Object.keys returns strings, so convert to number to compare with owner
                for (let userIdStr of Object.keys(userLoad)) {
                    let userId = parseInt(userIdStr);

                    // User cannot review their own film
                    if (userId === film.owner) continue;

                    if (userLoad[userId] < minLoad) {
                        minLoad = userLoad[userId];
                        bestUser = userId;
                    }
                }

                // If we found a valid user
                if (bestUser !== null) {
                    // Create Promise for insertion
                    const p = new Promise((res, rej) => {
                        db.run(sqlInsert, [film.id, bestUser], (err) => {
                            if (err) rej(err);
                            else res();
                        });
                    });
                    insertPromises.push(p);

                    // Virtually increase this user's load so the next film goes to someone else
                    userLoad[bestUser]++;
                    assignmentsMade++;
                }
            }

            //Execute all inserts
            await Promise.all(insertPromises);

            resolve({ message: `Assigned ${assignmentsMade} films automatically.` });

        } catch (error) {
            reject(error);
        }
    });
};