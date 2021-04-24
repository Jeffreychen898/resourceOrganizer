// global variables
require("dotenv").config();
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const passport = require("passport");
const flash = require("express-flash");
const session = require("express-session");
const csurf = require("csurf");
const csrfProtection = csurf();

const emailValidator = require("email-validator");

const helper = require("./src/helper");
const initializePassport = require("./src/PassportConfig");
const register = require("./src/register");
const MongoModels = require("./src/MongoModels");

const PORT = process.env.PORT || 8080;

//connect to mongo db
mongoose.connect(process.env.MONGO_DATABASE, { useNewUrlParser: true, useUnifiedTopology: true })
.then(databaseConnected).catch((err) => {
	console.log(err);
});

function databaseConnected(result) {
	app.listen(PORT, () => {
		helper.init();
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
	//global search
	res.send("Hello " + req.user.name);
});
app.get("/account", checkAuthenticated, (req, res) => {
	res.send("account " + req.user);
});
app.get("/login", checkNotAuthenticated, (req, res) => {
	res.render("pages/login.ejs", { csrfToken: req.csrfToken() });
});
app.get("/register", checkNotAuthenticated, (req, res) => {
	res.render("pages/register.ejs", { csrfToken: req.csrfToken() });
});
app.get("/manage", checkAuthenticated, (req, res) => {
	//res.render("pages/manage.ejs", { csrfToken: req.csrfToken() });
	res.redirect("manage/1");
});
app.get("/manage/:page", checkAuthenticated, async (req, res) => {
	try {
		const result_list = await MongoModels.items.find({ user_id: req.user.id });
		res.render("pages/manage.ejs", { csrfToken: req.csrfToken(), items: result_list });
	} catch(error) {
		res.send("an unexpected error has occured");
	}
});

// post
app.post("/manage", checkAuthenticated, (req, res, next) => {
	if(req.body.title && req.body.url) {
		next();
	} else {
		req.flash("error", "Required parameters must be filled");
		res.redirect("/manage/1");
	}
}, async (req, res) => {
	try {
		const title = req.body.title;
		const filtered_title = helper.titleFilter(title);
		const insert = new MongoModels.items({
			title: title,
			filtered_title: filtered_title,
			url: req.body.url,
			user_id: req.user.id
		});
		await insert.save();

		res.redirect("/manage/1");
	} catch {
		req.flash("error", "an unexpected error has occured");
		res.redirect("/manage/1");
	}
});

app.post("/login", checkNotAuthenticated, (req, res, next) => {
	if(req.body.email && req.body.password) {
		next();
	} else {
		req.flash("error", "Required parameters must be filled");
		res.redirect("/login");
	}
}, passport.authenticate("local", {
	successRedirect: "/",
	failureRedirect: "/login",
	failureFlash: true
}));

app.post("/register", checkNotAuthenticated, (req, res, next) => {
	if(req.body.displayName && req.body.email && req.body.password) {
		next();
	} else {
		req.flash("error", "Required parameters must be filled");
		res.redirect("/register");
	}
}, register);

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
