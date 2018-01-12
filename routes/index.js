var User       = require('../models/user'),
    middleware = require('../middleware'),
    nodemailer = require('nodemailer'),
    passport   = require('passport'),
    express    = require('express'),
    crypto     = require('crypto'),
    asyncc     = require('async'),
    router     = express.Router();

// Landing page route
router.get('/', function(req, res) {
   res.render('landing'); 
});

// Register form route
router.get("/register", function(req, res) {
   res.render("register"); 
});

// Register post route
router.post("/register", function(req, res) {
   var newUser = new User({username: req.body.username, email: req.body.email, image: null});
   User.register(newUser, req.body.password, function(err, user) {
      if(err) {
          var emailErr = "E11000 duplicate key error index: book_club.users.$email_1 dup key: { :"
          if(err.message.substring(0, emailErr.length) === emailErr) {
              return res.render("register", {"error": "A user with that email address already exists"});
          } else {
              return res.render("register", {"error": err.message});
          }
      } 
      passport.authenticate("local") (req, res, function() {
          req.flash("profileSuccess", "You are now a Kyama member " + user.username);
          res.redirect("/books"); 
      });
   });
});

// Login form route
router.get("/login", function(req, res) {
   res.render("login");
});

// Login post route
router.post('/login', function(req, res, next) {
  passport.authenticate('local', function(err, user, info) {
    if (err) { return next(err); }
    if (!user) { return res.render('login', {"error": "Username or password is incorrect"}); }
    req.logIn(user, function(err) {
      if (err) { return next(err); }
      var redirectTo = req.session.redirectTo ? req.session.redirectTo : '/books';
      delete req.session.redirectTo;
      res.redirect(redirectTo);
    });
  })(req, res, next);
});

// User update form route
router.get('/users/:id/update', middleware.isLoggedIn, function(req, res) {
   res.render('update');
});

// User show route
router.put('/users/:id', middleware.isLoggedIn, function(req, res) {
   User.findByIdAndUpdate(req.params.id, {
        $set: {
            fullName: req.body.fullName,
            city: req.body.city,
            country: req.body.country
        } 
     }, {new: true}, function(err, user) {
         if(err) {
             req.flash("error", "Something wrong seems to have occurred. Please try again");
             res.redirect("/profile");
         } else {
             req.flash("success", "Profile edited successfully");
             res.redirect("/profile");
         }
     }); 
});

// Forgot password form route
router.get("/forgot", function(req, res) {
   res.render("forgot"); 
});

// Forgot password post route
router.post('/forgot', function(req, res, next) {
 asyncc.waterfall([
 function(done) {
 crypto.randomBytes(20, function(err, buf) {
 var token = buf.toString('hex');
 done(err, token);
 });
 },
 function(token, done) {
 User.findOne({email: req.body.email }, function(err, user) {
 if(!user) {
 req.flash('error', "No Shelf account matched that email address");
 return res.redirect('/forgot');
 }
 user.resetPasswordToken = token;
 user.resetPasswordExpires = Date.now() + 3600000; 
 user.save(function(err) {
 done(err, token, user);
 });
 });
 }, function(token, user, done) {
 var client = nodemailer.createTransport({
 service: 'SendGrid',
 auth: {
 user: process.env.SENDGRID_USERNAME,
 pass: process.env.SENDGRID_PASSWORD
 }
 });
 var email = {
 from: 'Shelf <gmigwi.projects@gmail.com>',
 to: user.email,
 subject: 'Shelf Account Password Reset',
 html: '<p>Hello,</p>' +
       '<p>You are receiving this because you (or someone else) has requested the reset of the password for your Shelf account.</p>' +
       '<p>Please click on the following link, or paste this into your browser to complete the process:</p>' +
       '<p> http://' + req.headers.host + '/reset/' + token + '</p>' +
       '<p>If you did not request this, please ignore this email and your password will remain unchanged.</p>' +
       '<p>From the Shelf team,<br>' +
       'Have a  :-)  time<br>' +
       'Feel free to reach out at gmigwi.projects@gmail.com</p>'
      };
 client.sendMail(email, function(err) {
 req.flash('success', 'An e-mail has been sent to \'' + user.email + '\' with further instructions.');
 req.flash('info', 'It might take a few minutes as Shelf does it\'s thing :-)'); 
     
 done(err, 'done');
 });
 }
 ], function(err) {
 if(err) return next(err.message);
 res.redirect('/forgot');
 });
});

// Get request token route
router.get('/reset/:token', function(req, res) {
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
    if (!user) {
      req.flash('error', 'Password reset token is invalid or has expired.');
      return res.redirect('/forgot');
    }
    res.render('reset', {
        user: req.user
    });
  });
});

// Post route request token
router.post('/reset/:token', function(req, res) {
  asyncc.waterfall([
    function(done) {
      User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if (!user) {
          req.flash('error', 'Password reset token is invalid or has expired.');
          return res.redirect('back');
        }
        user.setPassword(req.body.password, function(err, user) {
                if(err) {
                    req.flash("error", "Something wrong seems to have occurred. Please try again");
                    res.redirect("/forgot");
                } else {
                    user.save();
                }
        });
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
          user.save(function(err) {
          req.logIn(user, function(err) {
            done(err, user);
          });
        });
      });
    },
    function(user, done) {
      var client = nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
          user: process.env.SENDGRID_USERNAME,
          pass: process.env.SENDGRID_PASSWORD
        }
      });
      var email = {
        from: 'Shelf <gmigwi.projects@gmail.com>',
        to: user.email,
        subject: 'Shelf Account Password Reset',
        html: '<p>Hey there,</p>' +
              '<p>This is a confirmation that the password for your Shelf account ' + user.email + ' has just been changed.</p>' +
              '<p>From the Shelf team,<br>' +
              'Have a  :-)  time<br>' +
              'Feel free to reach out at gmigwi.projects@gmail.com</p>'
      };
      client.sendMail(email, function(err) {
        req.flash('success', 'Your password has been changed.');
        done(err);
      });
    }
  ], function(err) {
    res.redirect('/reset');
  });
});  

// Logout post route
router.get("/logout", function(req, res) {
   req.logout();
   res.redirect("/");
});


module.exports = router;