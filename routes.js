const bcrypt = require('bcrypt');
const passport = require('passport');


module.exports = function (app, myDataBase) {

    app.route('/').get((req, res) => {
        res.render('index', { 
          title: `Connected to Database - ${myDataBase.databaseName}`, 
          message: 'Please log in',
          showLogin: true,
          showRegistration: true,
          showSocialAuth: true
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
            return next(null, insertResult.ops[0]);
        });
    });
    
    }, passport.authenticate('local', { failureRedirect: '/' }), (req, res) => {
    res.redirect('/profile');
    });
    
    app.route('/login').post(passport.authenticate('local', { failureRedirect: '/' }), (req, res) => {
    res.redirect('/chat');
    });

    app.route('/auth/github').get(passport.authenticate('github'));
    
    app.route('/auth/github/callback').get(passport.authenticate('github', { failureRedirect: '/' }), (req, res) => {
    req.session.user_id = req.user.id;
    res.redirect('/chat');
    });

    const ensureAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) return next();
    console.log('Non-authenticated user tried to access /profile page');
    return res.redirect('/');
    };

    app.route('/profile').get(ensureAuthenticated, (req, res) => {
    res.render('profile', { username: req.user.username });
    });

    app.route('/chat').get(ensureAuthenticated, (req, res) => {
        res.render('chat', { user: req.user });
    });

    app.route('/logout'). get((req, res) => {
    req.logout();
    res.redirect('/');
    });

    app.use((req, res, next) => {
    res.status(404).type('text').send('Not Found');
    });

};