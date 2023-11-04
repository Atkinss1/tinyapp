/* eslint-disable camelcase */
const express = require('express');
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
const { getUserByEmail,
  validateUser,
  urlsForUser,
  verifyURL,
  validateURLPermission } = require('./helpers');


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

// in memory Database for users
const users = {
  userRandomID: {
    id: "userRandomID",
    email: "test@test.com",
    password: "$2a$10$xlkr/IghFzBIlBWvII33zeh0xNKFrTHPHs32tjRIvsbWH7.YTcGti", // 123123
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

// middleware
app.use(express.urlencoded({ extended: true }));
app.use(cookieSession({
  keys: ['123']
}));

// display page with urls id table
app.get('/urls', function(req, res) {
  if (!req.session.user_id) { // if user is not logged in, redirect to login
    return res.redirect('/login');
  }

  const user_id = req.session.user_id;
  const user = users[user_id];
  const longURL = urlsForUser(urlDatabase, user_id);
  const templateVars = {
    longURL,
    user
  };
  res.render('urls_index', templateVars);
});

// display create new url page
app.get('/urls/new', function(req, res) {
  if (!req.session.user_id) { // if user is not logged in, redirect to login
    return res.redirect('/login');
  }

  const user_id = req.session.user_id;
  const user = users[user_id];
  const longURL = urlsForUser(urlDatabase, user_id);
  const templateVars = {
    longURL,
    user
  };
  res.render('urls_new', templateVars);
});

// display page with long url with its shortened form
app.get('/urls/:id', function(req, res) {
  const user_id = req.session.user_id;

  if (!req.session.user_id) { // if user is not logged in, redirect to login
    return res.status(403).send('You must be logged in to view a URL.');
  }
  
  const id = req.params.id;
  if (!validateURLPermission(urlDatabase, id, user_id)) { // check user URLS
    return res.status(403).send('You do not own this shortURL, please return to the home page.');
  }
  const user = users[user_id];
  const longURL = urlsForUser(urlDatabase, user_id);
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
  const longURL = verifyURL(urlDatabase, req.params.id);
  if (longURL) {
    return res.redirect(longURL);
  }
  res.status(404).json({error: 'Short URL not found'});
});

// user inputs a long url, post then assigns new short url and stores it to database
app.post('/urls', function(req, res) {
  if (!req.session.user_id) { // if user is not logged in, redirect to login
    return res.status(401).send('Please log in to visit this page.');
  }
  if (req.body.longURL === '') {
    return res.status(401).send('Invalid entry, please enter a URL');
  }
  let key = generateRandomString(6); // generates shortURL key (stringLength)
  urlDatabase[key] = {
    longURL: req.body.longURL,
    userID: req.session.user_id
  };
  res.redirect('/urls/' + key); // required to redirect to /urls/id but I think it is friendlier if we redirect to /urls to show URL added to the list
});

// user deletes url
app.post('/urls/:id/delete', function(req, res) {
  if (!req.session.user_id) { // if user is not logged in, redirect to login
    return res.status(403).send('You must be logged in to delete a URL.');
  }
  
  const user_id = req.session.user_id;
  const id = req.params.id;
  if (!validateURLPermission(urlDatabase, id, user_id)) {
    return res.status(403).send('You do not own this shortURL, please return to the home page.');
  }

  delete urlDatabase[id];
  res.redirect('/urls');
});

// assigns shortURL when user updates longURL
app.post('/urls/:id', function(req, res) {
  if (!req.session.user_id) { // if user is not logged in, redirect to login
    return res.status(403).send('You must be logged in to edit a URL.');
  }
  if (req.body.longURL === '') { // check if user tries to update with empty entry
    return res.redirect(`/urls/${req.params.id}`);
  }
  
  const user = req.session.user_id;
  
  urlDatabase[req.params.id] = {
    longURL: req.body.longURL,
    userID: user
  };
  
  res.redirect('/urls');
});

// allows user to edit long url
app.get('/edit/:id', function(req, res) {
  const user_id = req.session.user_id;
  
  if (!req.session.user_id) { // if user is not logged in, redirect to login
    return res.status(403).send('You must be logged in to edit a URL.');
  }
  
  const id = req.params.id;
  if (!validateURLPermission(urlDatabase, id, user_id)) {
    return res.status(403).send('You do not own this shortURL, please return to the home page.');
  }

  const user = users[user_id];
  const longURL = urlsForUser(urlDatabase, user_id);
  const templateVars = {
    id: req.params.id,
    longURL,
    user
  };
  res.render('urls_show', templateVars);
});

// displays login page
app.get('/login', (req, res) => {
  const user_id = req.session.user_id;
  const user = users[user_id];
  const templateVars = {
    user
  };

  if (req.session.user_id) { // if use is logged in, redirect to /urls
    return res.redirect('/urls');
  }
  res.render('urls_login', templateVars);
});

// user sends email, save cookie
app.post('/login', function(req, res) {
  const { email, password } = req.body; // grab email and password from body
  const hashedPassword = bcrypt.hashSync(password, 10); // encrypts password
  if (!email || !hashedPassword) {
    return res.status(401).send('Please enter a email and/or password');
  }
  const user = validateUser(email, password, users); // comparing email/password with database


  if (user) { // user is user object
    req.session.user_id = user.id;
    return res.redirect('/urls');
  }
  res.status(401).send('Email and/or password was incorrect.');
});


// user presses logout button, delete cookie
app.post('/logout', function(req, res) {
  req.session = null;
  res.redirect('/login');
});

// displays register page
app.get('/register', (req, res) => {
  if (req.session.user_id) { // if use is logged in, redirect to /urls
    return res.redirect('/urls');
  }
  const user_id = req.session.user_id;
  const user = users[user_id];
  const templateVars = {
    user
  };
  res.render('urls_register', templateVars);
});

// user registers with email and password
app.post('/register', (req, res) => {
  const { email, password } = req.body; // grab email and password from body
  const id = generateRandomString(6); // generate random ID
  const hashedPassword = bcrypt.hashSync(password, 10); // encrypts password
  if (!email || !hashedPassword) {
    return res.status(401).send('Please enter a email and/or password');
  }
  const emailInUse = getUserByEmail(email, users);
  if (emailInUse) {
    return res.status(400).send('Email is already registered');
  }
  users[id] = {
    id,
    email,
    password: hashedPassword,
  };
  req.session.user_id = id; // setting cookie with id as a value

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