const { v4: uuidv4 } = require("uuid");
const emailValidator = require("email-validator");
const bcrypt = require("bcrypt");

const mongooseModels = require("./MongoModels");

async function storeUser(name, email, password, done) {
	try {
		const hashed_password = await bcrypt.hash(password, 10);
		const register = new mongooseModels.users({
			id: uuidv4(),
			name: name,
			email: email,
			password: hashed_password
		});
		register.save();
		done(true, "success");
	} catch(err) {
		done(false, "unexpected error");
	}
}

async function registerUser(req, res) {
	if(req.body.password == req.body.confirmPassword) {
		const name = req.body.displayName;
		const email = req.body.email;
		const password = req.body.password;
		if(emailValidator.validate(email)) {
			try {
				const existingUser = await mongooseModels.users.findOne({ email: email });
				if(existingUser == null) {
					storeUser(name, email, password, (error, result) => {
						if(error) {
							res.redirect("/login");
						} else {
							req.flash("error", result);
							res.redirect("/register");
						}
					});
				} else {
					req.flash("error", "username already exist");
					res.redirect("/register");
				}
			} catch(error) {
				req.flash("error", "unexpected error");
				res.redirect("/register");
			}
		} else {
			req.flash("error", "invalid email");
			res.redirect("/register");
		}
	} else {
		req.flash("error", "passwords do not match");
		res.redirect("/register");
	}
}

module.exports = registerUser;
