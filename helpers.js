const bcrypt = require('bcryptjs');

/**
 *Checks users email to users database, if true. Returns userID.
 * @param {email} string,
 * @param {object} object,
 * @returns {userID}
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
 *
 * @param {object} database
 * @param {cookies} user_id
 * @returns object
 */
const displayURLByID = function(database, user_id) {
  let URLs = {};
  for (const key in database) {
    if (database[key].userID === user_id) {
      URLs[key] = database[key].longURL;
    }
  }
  return URLs || null;
};

/**
 *
 * @param {object} database
 * @param {req.params.id} shortURL
 * @returns longURL
 */
const redirectURL = function(database, shortURL) {
  const urlArray = Object.keys(database);
  const longURL = urlArray.find(key => key === shortURL);
  
  if (longURL) {
    return database[longURL].longURL;
  }
  return null;
};

/**
 * iterates through database and validates shortURL matches database
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
  displayURLByID,
  redirectURL,
  validateURLPermission
};