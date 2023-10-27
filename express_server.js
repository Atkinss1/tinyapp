
const express = require('express');
const app = express();
const PORT = 8080; // default port 8080

app.set('view engine','ejs');

const urlDatabase = {
  'b2xVn2': 'http://www.lighthouselabs.ca',
  '9sm5xK': 'http://www.google.com'
};

app.use(express.urlencoded({ extended: true }));

app.get('/urls', function(req, res) {
  const templateVars = { urls: urlDatabase};
  res.render('urls_index', templateVars);
});

app.get('/urls/new', function(req, res) {
  res.render('urls_new');
});

app.get('/urls/:id', function(req, res) {
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id]};
  res.render('urls_show', templateVars);
});

app.get('/', (req, res) => {
  res.send('Hello!');
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});
app.get('/hello', (req, res) => {
  res.send('<html><body>Hello <b>World</b></body></html>\n');
});

app.get('/u/:id', function(req, res) {
  const longURL = urlDatabase[req.params.id];
  if (longURL) {
    res.redirect(longURL);
    return;
  }
  res.status(404).json({error: 'Short URL not found, redirecting you back to TinyApp.'});
});

app.post('/urls', function(req, res) {
  let key = generateRandomString(6);
  urlDatabase[key] = req.body.longURL;
  res.redirect('/urls/' + key);
});

app.post('/urls/:id/delete', function(req, res) {
  const id = req.params.id;
  delete urlDatabase[id];
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});

const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

/**
 * Generates a random string from characters variable
 * @param {Number} Number
 * @returns {Number}
 */

const generateRandomString = function(length) {
  let result = '';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};