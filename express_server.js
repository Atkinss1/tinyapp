
const express = require('express');
const cookieParser = require('cookie-parser');
const app = express();
const PORT = 8080; // default port 8080

// templating engine
app.set('view engine','ejs');

// in memory Database for URLs
const urlDatabase = {
  'b2xVn2': 'http://www.lighthouselabs.ca',
  '9sm5xK': 'http://www.google.com'
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
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
  const user_id = req.cookies['user_id'];
  const user = users[user_id];
  const templateVars = {
    urls: urlDatabase,
    user
  };
  res.render('urls_index', templateVars);
});

// display create new url page
app.get('/urls/new', function(req, res) {
  const user_id = req.cookies['user_id'];
  const user = users[user_id];
  const templateVars = {
    urls: urlDatabase,
    user
  };
  res.render('urls_new', templateVars);
});

// display page with long url with its shortened form
app.get('/urls/:id', function(req, res) {
  const user_id = req.cookies['user_id'];
  const user = users[user_id];
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id],
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
  const longURL = urlDatabase[req.params.id];
  if (longURL) {
    res.redirect(longURL);
    return;
  }
  res.status(404).json({error: 'Short URL not found, redirecting you back to TinyApp.'});
});

// user inputs a long url, post then assigns new short url and stores it to database
app.post('/urls', function(req, res) {
  let key = generateRandomString(6);
  urlDatabase[key] = req.body.longURL;
  res.redirect('/urls/' + key);
});

// user deletes url
app.post('/urls/:id/delete', function(req, res) {
  const id = req.params.id;
  delete urlDatabase[id];
  res.redirect('/urls');
});

// assigns shortURL when user updates longURL
app.post('/urls/:id', function(req, res) {
  urlDatabase[req.params.id] = req.body.longURL;
  res.redirect('/urls');
});

// allows user to edit long url
app.get('/edit/:id', function(req, res) {
  const user_id = req.cookies['user_id'];
  const user = users[user_id]
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id],
    user
  };
  res.render('urls_show', templateVars);
});
//! This is still just a login text box with no password
// user sends username, save cookie
app.post('/login', function(req, res) {
  res.cookie('user_id');
  res.redirect('/urls');
});

// user presses logout button, delete cookie
app.post('/logout', function(req, res) {
  res.clearCookie('user_id');
  console.log(users);
  res.redirect('/urls');
});

// displays register page
app.get('/register', (req, res) => {
  const user_id = req.cookies['user_id'];
  const user = users[user_id]
  const templateVars = {
    user
  };
  res.render('urls_register', templateVars);
});

// user registers with email and password
app.post('/register', (req, res) => {
  const { email, password } = req.body; // grab email and password from body
  const id = generateRandomString(6); // generate random ID
  if (email || password === undefined) {
    return res.status(400).send('Please enter a username and/or password');
  }
  if (getUserByEmail(email, users)) {
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
  for (let userID in database) {
    if (database[userID].email === email) {
      return true;
    }
  }
  return false;
};