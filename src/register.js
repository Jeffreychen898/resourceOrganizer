const { v4: uuidv4 } = require("uuid");
const emailValidator = require("email-validator");
const bcrypt = require("bcrypt");

const mongooseModels = require("./MongoModels");
const helper = require("./helper");

async function storeUser(name, email, password, done) {
	try {
		const hashed_password = await bcrypt.hash(password, 10);
		const register = new mongooseModels.users({
			id: uuidv4(),
			name: name,
			condensed_name: helper.titleFilter(name),
			email: email,
			password: hashed_password
		});
		register.save();
		done(true, "");
	} catch(err) {
		done(false, "An unexpected error has occurred!");
	}
}

async function registerUser(req, res) {
	const name = req.body.displayName;
	const email = req.body.email;
	const password = req.body.password;

	try {
		//check if password matches confirm password
		if(req.body.password != req.body.confirmPassword) {
			req.flash("error", "The passwords does not match!");
			res.redirect("/register");
			return;
		}

		//check if email is valid
		if(!emailValidator.validate(email)) {
			req.flash("error", "The email is not valid!");
			res.redirect("/register");
			return;
		}

		//check if the name already exist
		const condensed_display_name = helper.titleFilter(name);
		const existingName = await mongooseModels.users.findOne({ condensed_name: condensed_display_name });
		if(existingName != null) {
			req.flash("error", "The display name is already in use!");
			res.redirect("/register");
			return;
		}

		//check if the user already exist
		const existingUser = await mongooseModels.users.findOne({ email: email });
		if(existingUser != null) {
			req.flash("error", "The email is already in use!");
			res.redirect("/register");
			return;
		}

		//store the user
		storeUser(name, email, password, (success, result) => {
			if(success) {
				res.redirect("/login");
			} else {
				req.flash("error", result);
				res.redirect("/register");
			}
		});
	} catch(error) {
		res.flash("error", "An unexpected error has occurred!");
		res.redirect("/register");
	}
}

module.exports = registerUser;
