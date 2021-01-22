const express = require('express');
const expressLayouts = require('express-ejs-layouts');
// const mongoose = require('mongoose');
const flash = require('connect-flash');
const session = require('express-session');
const passport = require('passport');
const morgan = require('morgan');
const path = require('path');
const favicon = require("serve-favicon");

const app = express();

// console logs Dev information
app.use(morgan('dev'));

// set favicon
app.use(favicon(__dirname + "/public/img/favicon.ico"));

// Passport Config
require('./config/passport')(passport);

// Mongo DB config
// const db = require('./config/keys').MongoURI;
// mongoose.set('useCreateIndex', true);

// MySQL DB config and connect
const conn = require('./config/keys').MYSQL_CONNECTION;
const db_name = require('./config/keys').DATABASE_NAME;
const tableCreation = require('./models/tableCreation');
conn.connect(error => {
	if (error) throw error;
	console.log("Successfully connected to MySQL server.");
	conn.query(`CREATE DATABASE IF NOT EXISTS\`${db_name}\`;`, (err) => {
		if (err) throw err;
		console.log("Database created.");
	});
	conn.changeUser({database : 'matcha'}, function(err) {
		if (err) throw err;
	  });
	tableCreation.createUserTable(conn);
	tableCreation.createTokenTable(conn);
	tableCreation.createViewsTable(conn);
	tableCreation.createLikesTable(conn);
	tableCreation.createChatsTable(conn);
  });

// Connect to Mongo
// mongoose.connect(db, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false})
// 	.then(() => console.log('MongoDb Connected... '))
// 	.catch(err => console.log(err));

// ejs
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'uploads')));

// Bodypaser
app.use(express.urlencoded({ extended: false }));
// app.use(express.json());

// Express session
app.use(session({
	secret: 'slacker',
	resave: true,
	saveUninitialized: true
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Connect flash
app.use(flash());

// Global Variables
app.use((req, res, next) => {
	res.locals.success_msg = req.flash('success_msg');
	res.locals.error_msg = req.flash('error_msg');
	res.locals.error = req.flash('error');
	res.locals.message = req.flash('message');
	next();
});

// Routes
app.use('/', require('./routes/index'));
app.use('/users', require('./routes/users'));

module.exports = app;