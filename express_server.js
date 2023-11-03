const express = require('express');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = 8080; // default port 8080

// templating engine
app.set('view engine','ejs');

// in memory Database for URLs
const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "test@test.com",
    password: "test",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

// middleware
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// display page with urls id table
app.get('/urls', function(req, res) {
  if (!req.cookies['user_id']) { // if user is not logged in, redirect to login
    return res.redirect('/login');
  }

  const user_id = req.cookies['user_id'];
  const user = users[user_id];
  const longURL = displayURLByID(urlDatabase, user_id);
  const templateVars = {
    longURL,
    user
  };
  res.render('urls_index', templateVars);
});

// display create new url page
app.get('/urls/new', function(req, res) {
  if (!req.cookies['user_id']) { // if user is not logged in, redirect to login
    return res.redirect('/login');
  }

  const user_id = req.cookies['user_id'];
  const user = users[user_id];
  const longURL = displayURLByID(urlDatabase, user_id);
  const templateVars = {
    longURL,
    user
  };
  res.render('urls_new', templateVars);
});

// display page with long url with its shortened form
app.get('/urls/:id', function(req, res) {
  const user_id = req.cookies['user_id'];

  if (!req.cookies['user_id']) { // if user is not logged in, redirect to login
    return res.redirect('/login');
  }
  
  const id = req.params.id;
  if (!validateURLPermission(urlDatabase, id, user_id)) {
    return res.status(403).send('You do not own this shortURL, please return to the home page.');
  }
  const user = users[user_id];
  const longURL = displayURLByID(urlDatabase, user_id);
  const templateVars = {
    id: req.params.id,
    longURL,
    user
  };
  res.render('urls_show', templateVars);
});

// display json object
app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

// redirect to long url if short url is found in database
app.get('/u/:id', function(req, res) {
  const longURL = redirectURL(urlDatabase, req.params.id);
  if (longURL) {
    return res.redirect(longURL);
  }
  res.status(404).json({error: 'Short URL not found'});
});

// user inputs a long url, post then assigns new short url and stores it to database
app.post('/urls', function(req, res) {
  if (!req.cookies['user_id']) { // if user is not logged in, redirect to login
    return res.redirect('/login');
  }
  if (req.body.longURL === '') {
    return res.send('Invalid entry, please enter a URL');
  }
  let key = generateRandomString(6);
  urlDatabase[key] = {
    longURL: req.body.longURL,
    userID: req.cookies['user_id']
  };
  res.redirect('/urls');
});

// user deletes url
app.post('/urls/:id/delete', function(req, res) {
  const user_id = req.cookies['user_id'];
  
  if (!req.cookies['user_id']) { // if user is not logged in, redirect to login
    return res.redirect('/login');
  }
  
  const id = req.params.id;
  if (!validateURLPermission(urlDatabase, id, user_id)) {
    return res.status(403).send('You do not own this shortURL, please return to the home page.');
  }
  
  delete urlDatabase[id];
  res.redirect('/urls');
});

// assigns shortURL when user updates longURL
app.post('/urls/:id', function(req, res) {
  if (!req.cookies['user_id']) { // if user is not logged in, redirect to login
    return res.redirect('/login');
  }
  if (req.body.longURL === '') { // check if user tries to update with empty entry
    return res.redirect(`/urls/${req.params.id}`);
  }
  urlDatabase[req.params.id] = req.body.longURL;
  res.redirect('/urls');
});

// allows user to edit long url
app.get('/edit/:id', function(req, res) {
  const user_id = req.cookies['user_id'];
  
  if (!req.cookies['user_id']) { // if user is not logged in, redirect to login
    return res.redirect('/login');
  }
  
  const id = req.params.id;
  if (!validateURLPermission(urlDatabase, id, user_id)) {
    return res.status(403).send('You do not own this shortURL, please return to the home page.');
  }

  const user = users[user_id];
  const longURL = displayURLByID(urlDatabase, user_id);
  const templateVars = {
    id: req.params.id,
    longURL,
    user
  };
  res.render('urls_show', templateVars);
});

// displays login page
app.get('/login', (req, res) => {
  const user_id = req.cookies['user_id'];
  const user = users[user_id];
  const templateVars = {
    user
  };
  
  res.render('urls_login', templateVars);
});

// user sends email, save cookie
app.post('/login', function(req, res) {
  const { email, password } = req.body; // grab email and password from body
  const user = validateUser(email, password, users); // comparing email/password with database

  if (user) { // user is user object
    res.cookie('user_id', user.id);
    return res.redirect('/urls');
  }
  res.status(403).send('Email and/or password was incorrect.');
});


// user presses logout button, delete cookie
app.post('/logout', function(req, res) {
  res.clearCookie('user_id');
  res.redirect('/login');
});

// displays register page
app.get('/register', (req, res) => {
  const user_id = req.cookies['user_id'];
  const user = users[user_id];
  const templateVars = {
    user
  };
  res.render('urls_register', templateVars);
});

// user registers with email and password
app.post('/register', (req, res) => {
  const { email, password } = req.body; // grab email and password from body
  const hashedPassword = bcrypt.hashSync(password, 10);
  const id = generateRandomString(6); // generate random ID
  if (!email || !password) {
    return res.status(400).send('Please enter a email and/or password');
  }
  const newEmail = getUserByEmail(email, users);
  if (newEmail) {
    return res.status(400).send('Email is already registered');
  }
  users[id] = {
    id,
    email,
    password,
  };
  res.cookie('user_id', id); // setting cookie with user_id as a key, id as a value
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});


/**
 * Generates a random string from characters variable
 * @param {Number} Number
 * @returns {Number}
*/

const generateRandomString = function(length) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

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
  const user = userArray.find(user => user.email === email && user.password === password);
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