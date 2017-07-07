var methodOverride = require("method-override"),
    session        = require('express-session'),
    LocalStrategy  = require('passport-local'),
    User           = require('./models/user'),
    flash          = require('connect-flash'),
    bodyParser     = require('body-parser'),
    passport       = require('passport'),
    mongoose       = require('mongoose'),
    express        = require('express'),
    app            = express();

var indexRoutes = require('./routes/index'),
    bookRoutes  = require('./routes/books');

//book_club
mongoose.connect(process.env.DATABASEURL);

app.use(session({
    secret: 'Book trade trade club',
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride('_method'));
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
app.use(flash());
app.use(function(req, res, next) {
   res.locals.currentUser = req.user;
   res.locals.success = req.flash('success');
   res.locals.info = req.flash('info');
   res.locals.error = req.flash('error');
   next(); 
});
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + '/public'));
app.use(indexRoutes);
app.use(bookRoutes);
app.set('view engine', 'ejs');


var port = process.env.PORT || 3000;
app.listen(port);