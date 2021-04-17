const localStrategy = require("passport-local").Strategy;
const bcrypt = require("bcrypt");
const emailValidator = require("email-validator");

const mongooseModels = require("./MongoModels");

async function authenticateUser(mail, password, done) {
	if(emailValidator.validate(mail)) {
		try {
			const user = await mongooseModels.users.find({ email: mail }).limit(1);
			if(user.length > 0) {
				if(await bcrypt.compare(password, user[0].password)) {
					return done(null, user[0]);
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
			const user = await mongooseModels.users.find({ id: id }).limit(1);
			done(null, user[0]);
		} catch(error) {
			done(error);
		}
	});
}

module.exports = initialize;
