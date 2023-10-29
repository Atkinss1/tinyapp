
const express = require('express');
const cookieParser = require('cookie-parser');
const app = express();
const PORT = 8080; // default port 8080

// templating engine
app.set('view engine','ejs');

// in memory Database
const urlDatabase = {
  'b2xVn2': 'http://www.lighthouselabs.ca',
  '9sm5xK': 'http://www.google.com'
};

// middleware
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// display page with urls id table
app.get('/urls', function(req, res) {
  const templateVars = {
    urls: urlDatabase,
    username: req.cookies["username"]
  };
  res.render('urls_index', templateVars);
});

// display create new url page
app.get('/urls/new', function(req, res) {
  const templateVars = {
    urls: urlDatabase,
  };
  res.render('urls_new', templateVars);
});

// display page with long url with its shortened form
app.get('/urls/:id', function(req, res) {
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id],
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
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id],
  };
  res.render('urls_show', templateVars);
});

// user sends username, save cookie
app.post('/login', function(req, res) {
  const { username } = req.body;
  res.cookie('username', username);
  res.redirect('/urls');
});

// user presses logout button, delete cookie
app.post('/logout', function(req, res) {
  const { username } = req.body;
  res.clearCookie('username', username);
  res.redirect('/urls');
});

app.get('/register', (req, res) => {
  res.render('urls_login');
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