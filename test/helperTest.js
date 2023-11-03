const { assert } = require('chai');
const bcrypt = require('bcryptjs');

const { getUserByEmail,
  validateUser,
  displayURLByID,
  redirectURL,
  validateURLPermission } = require('../helpers');

const testUsers = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "$2a$10$nkNgVPdy6iY/X/Mn8SVMH.m7sP0g.qpppZXak1bfcPUe6seQknQ4u" // purple-monkey-dinosaur
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "user2RandomID",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "userRandomID",
  },
  i33oGr: {
    longURL: "https://www.yahoo.ca",
    userID: "userRandomID3",
  },
};

describe('#getUserByEmail', function() {
  it('should return a user with valid email', function() {
    const user = getUserByEmail("user@example.com", testUsers);
    const expectedUserID = 'userRandomID';
    assert.equal(user.id, expectedUserID);
  });

  it('should return null if user is not in database', function() {
    const user = getUserByEmail('test@test.com', testUsers);
    const expectedUserID = null;
    assert.equal(user, expectedUserID);
  });
});


describe('#validateUser', function() {
  it('should return a user if email and password entered is correct', function() {
    const user = validateUser('user@example.com', 'purple-monkey-dinosaur', testUsers);
    const expectedUserID = 'userRandomID';
    assert.equal(user.id, expectedUserID);
  });

  it('should return null if email or password entere is incorrect', function() {
    const user = validateUser('test@test.com', 'purple-monkey-dinosaur', testUsers);
    const expectedUserID = null;
    assert.equal(user, expectedUserID);
  });
});

describe('#displayURLByID', function() {
  it('return stored key:value pair of shortURL and longURL, if they are in user profile', function() {
    const URL = displayURLByID(urlDatabase, 'userRandomID');
    const expectedURL = { i3BoGr: 'https://www.google.ca' };
    assert.deepEqual(URL, expectedURL);
  });

  it('should return if user does not have any stored URLS', function() {
    const URL = displayURLByID(urlDatabase, 'userRandomID5');
    const expectedURL = null;
    assert.deepEqual(URL, expectedURL);
  });
});

describe('#redirectURL', function() {
  it('return long URL if short URL is found in urlDatabase', function() {
    const URL = redirectURL(urlDatabase, 'i3BoGr');
    const expectedURL = "https://www.google.ca";
    assert.equal(URL, expectedURL);
  });

  it('return null if short URL is not found in urlDatabase', function() {
    const URL = redirectURL(urlDatabase, 'i3B3dg');
    const expectedURL = null;
    assert.equal(URL, expectedURL);
  });
});

describe('#validateURLPermission', function() {
  it('should return true if user_id matches shortURL in database', function() {
    const result = validateURLPermission(urlDatabase, 'i3BoGr', "userRandomID");
    const expectedResult = true;
    assert.equal(result, expectedResult);
  });
  
  it('should return false if user_id matches shortURL in database', function() {
    const result = validateURLPermission(urlDatabase, 'i3BoGr', "user2RandomID");
    const expectedResult = false;
    assert.equal(result, expectedResult);
  });
});