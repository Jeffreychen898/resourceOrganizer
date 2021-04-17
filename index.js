// global variables
require("dotenv").config();
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const emailValidator = require("email-validator");
const passport = require("passport");
const flash = require("express-flash");
const session = require("express-session");
const { v4: uuidv4 } = require("uuid");
const csurf = require("csurf");
const csrfProtection = csurf();

const mongooseModels = require("./src/MongoModels");
const initializePassport = require("./src/PassportConfig");

const PORT = process.env.PORT || 8080;

//connect to mongo db
mongoose.connect(process.env.MONGO_DATABASE, { useNewUrlParser: true, useUnifiedTopology: true })
.then(databaseConnected).catch((err) => {
	console.log(err);
});

function databaseConnected(result) {
	app.listen(PORT, () => {
		console.log(PORT);
	});
}

//configs
initializePassport(passport);

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(flash());
app.use(session({
	secret: process.env.SESSION_SECRET,
	resave: false,
	saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(csurfErrorHandling);

// routes
// get
app.get("/", checkAuthenticated, (req, res) => {
	res.send("Hello " + req.user.name);
});
app.get("/login", checkNotAuthenticated, (req, res) => {
	res.render("pages/login.ejs", { csrfToken: req.csrfToken() });
});
app.get("/register", checkNotAuthenticated, (req, res) => {
	res.render("pages/register.ejs", { csrfToken: req.csrfToken() });
});

// post
app.post("/login", checkNotAuthenticated, passport.authenticate("local", {
	successRedirect: "/",
	failureRedirect: "/login",
	failureFlash: true
}));
app.post("/register", checkNotAuthenticated, async (req, res) => {
	if(req.body.password == req.body.confirmPassword) {
		const name = req.body.displayName;
		const email = req.body.email;
		const password = req.body.password;
		if(emailValidator.validate(email)) {
			//hash the password
			try {
				const hashed_password = await bcrypt.hash(password, 10);
				const register = new mongooseModels.users({
					id: uuidv4(),
					name: name,
					email: email,
					password: hashed_password
				});
				register.save()
				res.send("success");
			} catch(err) {
				console.log(err);
				res.send("unexpected error");
			}
		} else {
			res.send("invalid email");
		}
	} else {
		res.send("passwords do not match");
	}
});

// methods
function checkNotAuthenticated(req, res, next) {
	if(!req.isAuthenticated()) {
		next();
	} else {
		res.redirect("/");
	}
}

function checkAuthenticated(req, res, next) {
	if(req.isAuthenticated()) {
		next();
	} else {
		res.redirect("/login");
	}
}

function csurfErrorHandling(req, res, next) {
	csrfProtection(req, res, (err) => {
		if(err) {
			res.send("invalid token");
		} else {
			next();
		}
	})
}
