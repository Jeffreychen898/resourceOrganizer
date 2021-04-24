const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// users 
const UsersSchema = new Schema({
	id: {
		type: String,
		required: true
	},
	name: {
		type: String,
		required: true
	},
	email: {
		type: String,
		required: true
	},
	password: {
		type: String,
		required: true
	}
});

const Users = mongoose.model("Users", UsersSchema);

// items
const ItemsSchema = new Schema({
	id: {
		type: String,
		required: true
	},
	title: {
		type: String,
		required: true
	},
	filtered_title: {
		type: String,
		required: true
	},
	url: {
		type: String,
		required: true
	},
	user_id: {
		type: String,
		required: true
	}
});

const Items = mongoose.model("Items", ItemsSchema);

module.exports = {
	users: Users,
	items: Items
};
