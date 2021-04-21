const localStrategy = require("passport-local").Strategy;
const bcrypt = require("bcrypt");
const emailValidator = require("email-validator");

const mongooseModels = require("./MongoModels");

async function authenticateUser(email, password, done) {
	if(emailValidator.validate(email)) {
		try {
			const user = await mongooseModels.users.findOne({ email: email });
			if(user != null) {
				if(await bcrypt.compare(password, user.password)) {
					return done(null, user);
				} else {
					return done(null, false, { message: "invalid password" });
				}
			} else {
				done(null, false, { message: "No user with that email" });
			}
		} catch(error) {
			done(error);
		}
	} else {
		done(null, false, { message: "invalid email" });
	}
}

function initialize(passport, getUserByID) {
	passport.use(new localStrategy({ usernameField: 'email'}, authenticateUser));
	passport.serializeUser((user, done) => {
		done(null, user.id);
	});
	passport.deserializeUser(async (id, done) => {
		try {
			const user = await mongooseModels.users.findOne({ id: id });
			done(null, user);
		} catch(error) {
			done(error);
		}
	});
}

module.exports = initialize;
