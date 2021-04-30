// global variables
if(process.env.NODE_ENV != "production") {
	require("dotenv").config();
}
const express = require("express");
const app = express();
const { v4: uuidv4 } = require("uuid");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const passport = require("passport");
const flash = require("express-flash");
const session = require("express-session");
const csurf = require("csurf");
const csrfProtection = csurf();
const emailValidator = require("email-validator");
const url = require("url");

const helper = require("./src/helper");
const initializePassport = require("./src/PassportConfig");
const register = require("./src/register");
const MongoModels = require("./src/MongoModels");
const search = require("./src/search");

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

//static
app.use("/css", express.static("static/css"));
app.use("/javascript", express.static("static/javascript"));

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

// routes
//routes not protected by csrf

app.get("/search/:user", async (req, res, next) => {
	try {
		const find_user = await MongoModels.users.findOne({ condensed_name: req.params.user });
		if(find_user) {
			return next();
		}
		res.render("pages/error.ejs", {
			error: "User cannot be found!",
			login: req.isAuthenticated()
		});
	} catch(error) {
		res.render("pages/error.ejs", {
			error: "An unexpected error has occurred!",
			login: req.isAuthenticated()
		});
	}
}, (req, res, next) => {
	let search_query = req.query.q;
	if(search_query) {
		search_query.trim();
	}

	if(search_query && search_query != "") {
		return next();
	}

	res.render("pages/search.ejs", {
		user: req.params.user,
		login: req.isAuthenticated()
	});

}, search);

app.use(csurfErrorHandling);

// get
app.get("/", checkAuthenticated, (req, res) => {
	res.redirect("/manage");
});
app.get("/account", checkAuthenticated, (req, res) => {
	res.send("account " + req.user);
});
app.get("/login", checkNotAuthenticated, (req, res) => {
	res.render("pages/login.ejs", {
		csrfToken: req.csrfToken(),
		login: req.isAuthenticated()
	});
});
app.get("/register", checkNotAuthenticated, (req, res) => {
	res.render("pages/register.ejs", {
		csrfToken: req.csrfToken(),
		login: req.isAuthenticated()
	});
});
app.get("/manage", checkAuthenticated, async (req, res) => {
	try {
		const link = url.format({
			protocol: req.protocol,
			host: req.hostname
		})
		const result_list = await MongoModels.items.find({ user_id: req.user.id });
		const search_url = link + "/search/" + req.user.condensed_name;
		res.render("pages/manage.ejs", {
			csrfToken: req.csrfToken(),
			items: result_list,
			search_url: search_url,
			login: req.isAuthenticated()
		});
	} catch(error) {
		res.render("pages/error.ejs", {
			error: "An unexpected error has occurred!",
			login: req.isAuthenticated()
		});
	}
});

app.get("*", (req, res) => {
	res.render("pages/error.ejs", {
		error: "404 Not Found!",
		login: req.isAuthenticated()
	});
})

// post
app.post("/manage/remove", checkAuthenticated, async (req, res) => {
	try {
		if(req.body.id) {
			await MongoModels.items.deleteOne({ id: req.body.id });
			res.send("success");
		} else {
			res.send("error");
		}
	} catch(error) {
		res.send("error");
	}
});
app.post("/manage", checkAuthenticated, (req, res, next) => {
	if(req.body.title && req.body.url) {
		next();
	} else {
		req.flash("error", "Required parameters must be filled!");
		res.redirect("/manage");
	}
}, async (req, res) => {
	try {
		const title = req.body.title;
		const filtered_title = helper.titleFilter(title);
		const insert = new MongoModels.items({
			id: uuidv4(),
			title: title,
			filtered_title: filtered_title,
			url: req.body.url,
			user_id: req.user.id
		});
		await insert.save();

		res.redirect("/manage");
	} catch {
		req.flash("error", "An unexpected error has occurred!");
		res.redirect("/manage");
	}
});

app.post("/logout", checkAuthenticated, (req, res) => {
	req.logOut();
	res.redirect("/login");
});

app.post("/login", checkNotAuthenticated, (req, res, next) => {
	if(req.body.email && req.body.password) {
		next();
	} else {
		req.flash("error", "Required parameters must be filled!");
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
		req.flash("error", "Required parameters must be filled!");
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
			res.render("pages/error.ejs", {
				error: "Invalid/Missing CSRF token!",
				login: req.isAuthenticated()
			});
		} else {
			next();
		}
	})
}
