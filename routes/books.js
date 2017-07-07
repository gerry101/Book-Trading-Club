var Book       = require('../models/book'),
    User       = require('../models/user'),
    middleware = require('../middleware'),
    nodemailer = require('nodemailer'),
    config     = require('../config'),
    multerS3   = require('multer-s3'),
    aws        = require('aws-sdk'),
    express    = require('express'),
    multer     = require('multer'),
    router     = express.Router();

aws.config.update({
    secretAccessKey: config.aws_secret_access_key,
    accessKeyId: config.aws_access_key_id,
    region: 'us-east-2'
});

var s3 = new aws.S3();

var upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: config.s3_bucket_user,
        key: function (req, file, cb) {
            var fileExtension = file.originalname.split(".")[1];
            var path = "uploads/" + req.user._id + Date.now() + "." + fileExtension;
            cb(null, path); 
        }
    })
});

router.get('/books', middleware.isLoggedIn, function(req, res) {
   Book.find({}).sort({date: -1}).exec(function(err, books) {
       if(err) {
           req.flash('error', 'An error seems to have occurred');
           return res.redirect('/');
       }
        res.render('books/index', {books: books});
   });
});

router.get('/profile', middleware.isLoggedIn, function(req, res) {
    User.findOne({username: req.user.username}).populate('books').exec(function(err, user) {
       if(err) {
           req.flash('error', 'An error seems to have occurred');
           return res.redirect('back');
       } 
        res.render('books/profile', {user: user});
    });
});

router.get('/books/new', middleware.isLoggedIn, function(req, res) {
   res.render('books/new'); 
});

router.post('/books', middleware.isLoggedIn, upload.array('image',1), function(req, res) {
   
    var filepath = undefined;

    if(req.files[0]) {
        filepath = req.files[0].key; 
    } 
    
    var book = {
        name: req.body.name,
        link: req.body.link,
        image: filepath
    }
    
    Book.create(book, function(err, book) {
       if(err) {
           req.flash('error', 'An error seems to have occurred');
           return res.redirect('/books/new');
       }
        book.author = req.user;
        book.authorName = req.user.username;
        book.save();
        req.user.books.unshift(book);
        req.user.save();
        res.redirect('/profile')
    });
});

router.get('/books/:id/trade/:userId', middleware.isLoggedIn, function(req, res) {
   Book.findById(req.params.id, function(err, book) {
      if(err) {
          return res.redirect('/books');
      }
       var author = book.authorName;
       User.findOne({username: author}, function(err, user) {
          if(err) {
          return res.redirect('/books');
      }
        var userRequest = req.params.userId;
        User.findById(userRequest, function(err, userRequested) {
           if(err) {
          return res.redirect('/books');
      }
        var client = nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
          user: config.sendgrid_username,
          pass: config.sendgrid_password
        }
      });
          var email = {
            from: 'Shelf <teamkyama@gmail.com>',
            to: user.email,
            subject: 'Shelf Book Trade Request',
            html: '<p>Hey there,</p>' +
                  '<p>' + userRequested.username + ' has requested a trade for the book -' + book.name + '.</p>' +
                  '<p>To accept this request, please email ' + userRequested.username + ' at ' + userRequested.email +'</p>' +
                  '<p>From the Shelf team,<br>' +
                  'Have a  :-)  time<br>' +
                  'Feel free to reach out at kyama@gmail.com</p>'
          };
          client.sendMail(email, function(err) {
            done(err);
          });
        });
       });
       res.redirect('/profile')
   }); 
});

module.exports = router;