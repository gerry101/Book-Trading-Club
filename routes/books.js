var Book       = require('../models/book'),
    User       = require('../models/user'),
    middleware = require('../middleware'),
    nodemailer = require('nodemailer'),
    express    = require('express'),
    router     = express.Router();

// Configure multer and cloudinary
var multer = require('multer');
var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter})

var cloudinary = require('cloudinary');
cloudinary.config({ 
  cloud_name: 'gmigwiprojects', 
  api_key: "773588939367444", 
  api_secret: "aPAA4HJlp-z-Z8uqKLqkssAY6Es"
});

// All books show route
router.get('/books', middleware.isLoggedIn, function(req, res) {
   Book.find({}).sort({date: -1}).exec(function(err, books) {
       if(err) {
           req.flash('error', 'An error seems to have occurred');
           return res.redirect('/');
       }
        res.render('books/index', {books: books});
   });
});

// Profile show page
router.get('/profile', middleware.isLoggedIn, function(req, res) {
    User.findOne({username: req.user.username}).populate('books').exec(function(err, user) {
       if(err) {
           req.flash('error', 'An error seems to have occurred');
           return res.redirect('back');
       } 
        res.render('books/profile', {user: user});
    });
});

// New book form route
router.get('/books/new', middleware.isLoggedIn, function(req, res) {
   res.render('books/new'); 
});

// New book post route
router.post('/books', middleware.isLoggedIn, upload.single('image'), function(req, res) {
   
    var filepath = undefined;

    cloudinary.uploader.upload(req.file.path, function(result) {
       filepath = result.secure_url; 
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
        req.flash('success', 'Your book has been successfully created');
        res.redirect('/profile')
     });
    });
});

// Send book trade request route
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
          user: "gmigwi",
          pass: "Chatinter1"
        }
      });
          var email = {
            from: 'Shelf <gmigwi.projects@gmail.com>',
            to: user.email,
            subject: 'Shelf Book Trade Request',
            html: '<p>Hey there,</p>' +
                  '<p>' + userRequested.username + ' has requested a trade for the book -' + book.name + '.</p>' +
                  '<p>To accept this request, please email ' + userRequested.username + ' at ' + userRequested.email +'</p>' +
                  '<p>From the Shelf team,<br>' +
                  'Have a  :-)  time<br>' +
                  'Feel free to reach out at gmigwi.projects@gmail.com</p>'
          };
          client.sendMail(email, function(err) {
              done(err);
          });
        });
       });
       req.flash('success', 'Trade request sent via email to author');
       res.redirect('/profile')
   }); 
});

module.exports = router;