'use strict';

const serviceUtils = require('../utils/serviceUtils.js');
const db = require('../components/db');
const Review = require('../components/review');

/**
  this is an helper function that checks and updates expired infitations.
  @param {*} filmId - id of the film 
  @returns -  no values are expected 
 */
const checkAndExpireInvitations = (filmId) => {
  return new Promise((resolve, reject) => {
    // Update only for the current film (filmId = ?)
    // Use ? for the current date to avoid timezone issues between JS and SQLite
    const sql = "UPDATE reviews SET invitationStatus = 'expired' WHERE filmId = ? AND invitationStatus = 'pending' AND expirationDate < ?";
    
    const now = new Date().toISOString(); // ISO 8601 Format

    db.run(sql, [filmId, now], (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
};

/**
  this function returns the paginated list of reviews for a specific film, updated to 
  handle status filters and visibility
  @param {*} pageNo - number of pages 
  @param {*} filmId - id of the film
  @param {*} statusFilter - status filter 
  @param {*} requesterId - id of the user 
  @returns - returns the list of reviews
*/
exports.getFilmReviews = function (pageNo, filmId, statusFilter, requesterId) {
  return new Promise((resolve, reject) => {
    
    const sqlFilmInfo = "SELECT owner, private FROM films WHERE id = ?";
    
    db.get(sqlFilmInfo, [filmId], async (err, row) => {
      if (err) { reject(err); return; } //database error
      
      if (!row) { reject("NO_FILMS"); return; }  //no film found

      const filmOwner = row.owner;
      const isOwner = (requesterId === filmOwner);
      const isPrivate = row.private;

      if (isPrivate == 1 && !isOwner) {
          reject("NO_PUBLIC_FILM"); //the film is private
          return;
      }

      //check if the review is exxpired 
      try { 
          await checkAndExpireInvitations(filmId); 
      } catch (e) { 
          reject(e); 
          return; 
      }
      let sql = "SELECT r.filmId as fid, r.reviewerId as rid, completed, reviewDate, rating, review, r.invitationStatus, r.expirationDate, c.total_rows FROM reviews r, (SELECT count(*) total_rows FROM reviews l WHERE l.filmId = ? ";
      
      let countParams = [filmId];
      let mainParams = [filmId];

      let whereClause = "";

      if (isOwner) {
          // The owner sees everything, potentially filtered by status
          if (statusFilter) {
              whereClause += " AND invitationStatus = ?";
              countParams.push(statusFilter);
              mainParams.push(statusFilter);
          }
      } else {
          // Others only see completed reviews
          whereClause += " AND completed = 1";
      }

      sql += whereClause + " ) c WHERE r.filmId = ? " + whereClause;

      let finalParams = [];
      finalParams.push(filmId); 
      if(isOwner && statusFilter) finalParams.push(statusFilter); 
      
      finalParams.push(filmId); 
      if(isOwner && statusFilter) finalParams.push(statusFilter); 

      //Pagination
      if (pageNo) {
          const limit = 10; 
          const offset = (pageNo - 1) * limit;
          sql += " LIMIT ? OFFSET ?";
          finalParams.push(limit);
          finalParams.push(offset);
      }
      
      db.all(sql, finalParams, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          let reviews = rows.map((row) => {
              let dto = serviceUtils.createReview(row);
              // Hide sensitive data from non-owners
              if (!isOwner) {
                  delete dto.invitationStatus;
                  delete dto.expirationDate;
              }
              return dto;
          });
          resolve(reviews); //return the list of reviews
        }
      });
    });
  });
}

// Helper to count total reviews
/**
  this is an helper function to count total reviews
  @param {*} filmId - id of the film
  @returns - total number of reviews
*/
exports.getFilmReviewsTotal = function (filmId) {
  return new Promise((resolve, reject) => {
    var sqlNumOfReviews = "SELECT count(*) total FROM reviews WHERE filmId = ? ";
    db.get(sqlNumOfReviews, [filmId], (err, size) => {
      if (err) {
        reject(err);
      } else {
        resolve(size.total);
      }
    });
  });
}

/**
  this function issues a film review 
  @param {*} invitations - array of invitation
  @param {*} owner - owner of the film
  @returns - returns the array of reviews 
*/
exports.issueFilmReview = function (invitations, owner) {
  return new Promise((resolve, reject) => {

    const now = new Date();

    for (let i = 0; i < invitations.length; i++) {
      const invite = invitations[i];
      
      // If there is an expiration date, check it
      if (invite.expirationDate) {
        const expDate = new Date(invite.expirationDate);

        //Check if format is valid
        if (isNaN(expDate.getTime())) {
          reject("INVALID_DATE_FORMAT"); 
          return; // Blocks everything and exits
        }

        //Check if the date is in the past
        if (expDate <= now) {
          console.log("Expired date detected:", invite.expirationDate);
          reject("INVALID_DATE"); // Sends error to controller
          return; // doesn't execute queries below
        }
      }
    }

    //Check the Film
    const sql1 = "SELECT owner, private FROM films WHERE id = ?";
    db.all(sql1, [invitations[0].filmId], (err, rows) => {
      if (err) {
        reject(err); //database error
      }
      else if (rows.length === 0) {
        reject("NO_FILMS"); //no film found
      }
      else if (owner != rows[0].owner) {
        reject("USER_NOT_OWNER"); //the user isn't the owner
      } else if (rows[0].private == 1) {
        reject("PRIVATE_FILM"); //the film is private 
      }
      else {
        //Check Invited Users
        var sql2 = 'SELECT * FROM users';
        var invitedUsers = [];
        for (var i = 0; i < invitations.length; i++) {
          if (i == 0) sql2 += ' WHERE id = ?';
          else sql2 += ' OR id = ?'
          invitedUsers[i] = invitations[i].reviewerId;
        }

        db.all(sql2, invitedUsers, async function (err, rows) {
          if (err) {
            reject(err);
          }
          else if (rows.length !== invitations.length){
            reject("REVIEWER_ID_IS_NOT_USER");
          }
          else {
            //Database Insertion
            const sql3 = "INSERT INTO reviews(filmId, reviewerId, completed, invitationStatus, expirationDate) VALUES(?,?,0, 'pending', ?)";
            
            var finalResult = [];
            
            for (var i = 0; i < invitations.length; i++) {
              try {
                //Execute insertion only if we reached here (valid dates)
                let singleResult = await issueSingleReview(sql3, invitations[i].filmId, invitations[i].reviewerId, invitations[i].expirationDate);
                finalResult[i] = singleResult;
              } catch (error) {
                if (error === "EXISTING_REVIEW") {
                  reject("EXISTING_REVIEW");
                  return;
                }
                reject('Error in the creation of the review data structure');
                return; //  stop the loop
              }
            }

            if (finalResult.length !== 0) {
              resolve(finalResult);
            }
          }
        });
      }
    });
  });
}

/**
This is an Helper Function for single INSERT
*/
const issueSingleReview = function (sql3, filmId, reviewerId, expirationDate) {
  return new Promise((resolve, reject) => {
    db.run(sql3, [filmId, reviewerId, expirationDate], function (err) {
      if (err) {
        if (err.code === "SQLITE_CONSTRAINT" && err.message.includes("UNIQUE constraint failed")) {
          reject("EXISTING_REVIEW");
        } else {
          reject(err);
        }
      } else {
        var createdReview = new Review(filmId, reviewerId, false);
        createdReview.invitationStatus = 'pending';
        createdReview.expirationDate = expirationDate;
        resolve(createdReview);
      }
    });
  })
}

/**
  This function deletes a single review 
  @param {*} filmId - id of the film
  @param {*} reviewerId - id of the user reviewer 
  @param {*} owner - id of the owner 
*/
exports.deleteSingleReview = function (filmId, reviewerId, owner) {
  return new Promise((resolve, reject) => {
  
    // Check the Film 
    const sqlFilm = "SELECT owner, private FROM films WHERE id = ?";
    
    db.all(sqlFilm, [filmId], (err, rows) => {
      if (err) return reject(err); //database error
      
      if (rows.length === 0) {
        return reject("NO_FILMS"); // Film does not exist
      }
      
      const filmData = rows[0];

      if (filmData.private == 1) {
         return reject("NO_PUBLIC_FILM"); // film private
      }

      if (owner != filmData.owner) {
        return reject("USER_NOT_OWNER"); //user isn't the film owner 
      }

      //check the review
      const sqlReview = "SELECT completed FROM reviews WHERE filmId = ? AND reviewerId = ?";
      
      db.all(sqlReview, [filmId, reviewerId], (err, rRows) => {
        if (err) return reject(err); //database error

        if (rRows.length === 0) {
          return reject("NO_REVIEWS"); //review doesn't exist
        }

        if (rRows[0].completed == 1) {
           return reject("ALREADY_COMPLETED"); //review already completed 
        }

        const sqlDelete = 'DELETE FROM reviews WHERE filmId = ? AND reviewerId = ?';
        db.run(sqlDelete, [filmId, reviewerId], (err) => {
          if (err) reject(err);
          else resolve(null); //all good, delete
        });
      });
    });
  });
}

/**
  this function gets a single review 
  @param {*} filmId - id of the film
  @param {*} reviewerId - id of the user reviewer
  @returns - returns the review found
*/
exports.getSingleReview = function (filmId, reviewerId) {
  return new Promise((resolve, reject) => {
    
    //check the film
    const sqlFilm = "SELECT private FROM films WHERE id = ?";
    
    db.get(sqlFilm, [filmId], (err, filmRow) => {
      if (err) {
        reject(err); //database error
        return;
      }
      
      if (!filmRow) {
        reject("NO_FILMS"); //the film doesn't exist
        return;
      }
      
      if (filmRow.private == 1) {
        reject("NO_PUBLIC_FILM"); //the film is private
        return;
      }

      //check review 
      const sqlReview = "SELECT filmId as fid, reviewerId as rid, completed, reviewDate, rating, review, invitationStatus, expirationDate FROM reviews WHERE filmId = ? AND reviewerId = ?";
      
      db.all(sqlReview, [filmId, reviewerId], (err, rows) => {
        if (err) {
          reject(err); //database error
        } 

        else if (rows.length === 0) {
          reject("NO_REVIEWS");//no review found
        } 

        else {
          var review = serviceUtils.createReview(rows[0]);
          resolve(review); //all good
        }
      });
    });
  });
};

/**
  this function completes /updates a single review
 * @param {*} review - review of the film
 * @param {*} filmId - id of the film
 * @param {*} reviewerId - id of the user reviewer
*/
exports.updateSingleReview = function (review, filmId, reviewerId) {
  return new Promise((resolve, reject) => {
    
    //First retrieve current review to check status
    const sqlGet = "SELECT * FROM reviews WHERE filmId = ? AND reviewerId = ?";
    
    db.get(sqlGet, [filmId, reviewerId], (err, row) => {
      if (err) {
        reject(err); //database error
      } else if (!row) {
        reject("REVIEW_NOT_FOUND"); //review not found
      } else {
        
        //User must have accepted the invitation before writing
        if (row.invitationStatus !== 'accepted') {
            // If pending, expired or cancelled, cannot write
            reject("INVITATION_NOT_ACCEPTED"); 
            return;
        }

        // Execute update
        const sqlUpdate = "UPDATE reviews SET completed = 1, invitationStatus = 'completed', review = ?,  rating = ?, reviewDate = ?  WHERE filmId = ? AND reviewerId = ? ";

        // Assume reviewDate is today if not provided
        const reviewDate = review.reviewDate || new Date().toISOString().split('T')[0];

        db.run(sqlUpdate, [review.review, review.rating, reviewDate, filmId, reviewerId], function(err) {
          if (err) {
            reject(err);
          } else {
            resolve(this.changes);
          }
        });
      }
    });
  });
};

/**
  this function accepts all the pending invitations of a user 
 * @param {*} reviewerId - id of the user reviewer 
*/
exports.acceptAllPendingInvitations = function(reviewerId) {
    return new Promise(async (resolve, reject) => {
        // First expire old ones to avoid accepting expired items by mistake
        try {
            await checkAndExpireInvitations();
        } catch(e) {
            reject(e);
            return;
        }

        // Update to 'accepted' only those that are 'pending'
        const sql = "UPDATE reviews SET invitationStatus = 'accepted' WHERE reviewerId = ? AND invitationStatus = 'pending'";
        
        db.run(sql, [reviewerId], function(err) {
            if (err) {
                reject(err);
            } else {
                resolve(); // Success
            }
        });
    });
};