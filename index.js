// global variables
require("dotenv").config();
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const emailValidator = require("email-validator");

const mongooseModels = require("./src/MongoModels");

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
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.set("view engine", "ejs");

// routes
// get
app.get("/login", (req, res) => {
	res.render("pages/login.ejs");
});
app.get("/register", (req, res) => {
	res.render("pages/register.ejs");
});

// post
app.post("/loginuser", (req, res) => {
	console.log(req.body);
	res.send("login");
});
app.post("/register", async (req, res) => {
	if(req.body.password == req.body.confirmPassword) {
		const name = req.body.displayName;
		const email = req.body.email;
		const password = req.body.password;
		if(emailValidator.validate(email)) {
			//hash the password
			try {
				const hashed_password = await bcrypt.hash(password, 10);
				const register = new mongooseModels.users({
					id: 1,
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

