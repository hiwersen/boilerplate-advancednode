const passport = require('passport');
const LocalStrategy = require('passport-local');
const bcrypt = require('bcrypt');
const { ObjectID } = require('mongodb');

module.exports = function (app, myDataBase) {

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

};