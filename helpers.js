/* eslint-disable camelcase */
const bcrypt = require('bcryptjs');

/**
 *Checks users email to users database, if true. Returns userID.
 * @param {email} string,
 * @param {object} object,
 * @returns {userID} user object
 */

const getUserByEmail = function(email, database) {
  const userArray = Object.values(database);
  const user = userArray.find(user => user.email === email);
  return user || null;
};

/**
 * verifies users email and password in the database and returns user object
 *
 * @param {string} email
 * @param {any} password
 * @param {object} database
 * @returns {object}
 */

const validateUser = function(email, password, database) {
  const userArray = Object.values(database); // returns all user objects in database
  const user = userArray.find(user => {
    const passwordMatches = bcrypt.compareSync(password, user.password);
    return user.email === email && passwordMatches;
  });
  
  return user || null;
};

/**
 * Check userDatabase and return stored URLs
 *
 * @param {object} database
 * @param {cookies} user_id
 * @returns object
 */
const urlsForUser = function(database, user_id) {
  let URLs = {};
  for (const key in database) {
    if (database[key].userID === user_id) {
      URLs[key] = database[key].longURL;
    }
  }
  return Object.keys(URLs).length > 0 ? URLs : null;
};

/**
 * check if shortURL is stored in database and returns longURL
 *
 * @param {object} database
 * @param {req.params.id} shortURL
 * @returns longURL
 */
const verifyURL = function(database, shortURL) {
  const urlArray = Object.keys(database);
  const longURL = urlArray.find(key => key === shortURL);
  
  if (longURL) {
    return database[longURL].longURL;
  }
  return null;
};

/**
 * iterates through userDatabase and validates shortURL matches user_id in userDatabase
 *
 * @param {Object} database
 * @param {req.params.id} shortURL
 * @returns Boolean
 */
const validateURLPermission = function(database, shortURL, user_id) {
  for (const key in database) {
    if (database[key].userID === user_id && key === shortURL) {
      return true;
    }
  }
  return false;
};

module.exports = {
  getUserByEmail,
  validateUser,
  urlsForUser,
  verifyURL,
  validateURLPermission,
};