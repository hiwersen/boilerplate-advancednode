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
const routes = require('./routes.js');
const auth = require('./auth.js');

const app = express();

const http = require('http').createServer(app);
const io = require('socket.io')(http);


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

  let currentUsers = 0;
  io.on('connection', socket => {
    console.log('A user has connected');
    ++currentUsers;
    io.emit('user count', currentUsers);

    socket.on('disconnect', () => {
      console.log('A user has disconnected');
      --currentUsers;
      io.emit('user count', currentUsers);
    });
  });

  auth(app, myDataBase);
  routes(app, myDataBase);

}).catch(error => {
  app.route('/').get((req, res) => {
    res.render('index', { title: e, message: 'Unable to connect to database' });
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log('Listening on port ' + PORT);
});
