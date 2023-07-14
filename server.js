'use strict';
require('dotenv').config();
const express = require('express');
const myDB = require('./connection');
const fccTesting = require('./freeCodeCamp/fcctesting.js');
const session = require('express-session');
const passport = require('passport');
const { ObjectID } = require('mongodb');
const LocalStrategy = require('passport-local');
const bcrypt = require('bcrypt');

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

// Then: set up the middleware passport.initialize(), and then passport.session(), in this order
app.use(passport.initialize());
app.use(passport.session());

fccTesting(app); //For FCC testing purposes
app.use('/public', express.static(process.cwd() + '/public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

myDB(async client => {
  const myDataBase = await client.db().collection('users');
  const { databaseName } = client.db();

  console.log(`Connected to Database - ${databaseName}. Please log in`);

  app.route('/').get((req, res) => {
    res.render('index', { 
      title: `Connected to Database - ${databaseName}`, 
      message: 'Please log in',
      showLogin: true,
      showRegistration: true
  });
  });
  
  passport.use(new LocalStrategy((username, password, done) => {
    myDataBase.findOne({ username }, (error, user) => {
      console.log(`User ${username} attempted to log in.`);
      if (error) return done(error);
      if (!user) return done(null, false);
      if (!bcrypt.compareSync(password, user.password)) return done(null, false);
      return done(null, user);
    });
  }));

  passport.serializeUser((user, done) => {
    done(null, user._id);
  });
  
  passport.deserializeUser((id, done) => {
    myDataBase.findOne({ _id: new ObjectID(id) }, (error, doc) => {
      done(null, doc);
    });
  });

  app.route('/register').post((req, res, next) => {
    const hash = bcrypt.hashSync(req.body.password, 12);
    console.log(hash);

    myDataBase.findOne({ username: req.body.username }, (error, user) => {
      if (error) return next(error);
      if (user) return res.redirect('/');
      myDataBase.insertOne(
        { username: req.body.username, password: hash }, 
        (error, insertResult) => {
          if (error) return res.redirect('/');
          console.log(`A new user ${insertResult.ops[0].username} was created and saved to the database`);
          next(null, insertResult.ops[0]);
        });
    });
  }, passport.authenticate('local', { failureRedirect: '/' }), (req, res) => {
    res.redirect('/profile');
  });

  app.route('/login').post(passport.authenticate('local', { failureRedirect: '/' }), (req, res) => {
    res.redirect('/profile');
  });

  const ensureAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) return next();
    console.log('Non-authenticated user tried to access /profile page');
    return res.redirect('/');
  };

  app.route('/profile').get(ensureAuthenticated, (req, res) => {
    res.render('profile', { username: req.user.username });
  });

  app.route('/logout'). get((req, res) => {
    req.logout();
    res.redirect('/');
  });

  app.use((req, res, next) => {
    res.status(404).type('text').send('Not Found');
  });

}).catch(error => {
  app.route('/').get((req, res) => {
    res.render('index', { title: e, message: 'Unable to connect to database' });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Listening on port ' + PORT);
});
