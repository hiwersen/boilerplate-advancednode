'use strict';
require('dotenv').config();
const express = require('express');
const myDB = require('./connection');
const fccTesting = require('./freeCodeCamp/fcctesting.js');
const session = require('express-session');
const passport = require('passport');
const { ObjectID } = require('mongodb');

const app = express();
app.set('view engine', 'pug');
app.set('views', './views/pug');

// First: set up the express app to use the session by defining the following options
app.use(session({ 
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  cookie: { 
    secure: false,
    httpOnly: true,
    maxAge: 60 * 60 * 1000 // 1 hour
   }
 }));

// Then: set up the middleware passport.initialize() and passport.session()
app.use(passport.initialize());
app.use(passport.session());



fccTesting(app); //For FCC testing purposes
app.use('/public', express.static(process.cwd() + '/public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.route('/').get((req, res) => {
  res.render('index', { title: 'Hello', message: 'Please log in' });
});

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser((id, done) => {
  //myDB.findOne({ _id: new ObjectID(id) }, (error, doc) => {
    done(null, null);
  //});
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Listening on port ' + PORT);
});
