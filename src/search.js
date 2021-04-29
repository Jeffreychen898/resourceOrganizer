const MongoModels = require("./MongoModels");
const helper = require("./helper");

async function searchItem(req, res) {
	try {
		const find_user = await MongoModels.users.findOne({ condensed_name: req.params.user });
		const query = helper.titleFilter(req.query.q);

		const result = await MongoModels.items.find({ user_id: find_user.id }).find({ filtered_title: { $regex: query }});
		res.render("pages/search_result.ejs", {
			user: req.params.user,
			results: result
		});

	} catch(error) {
		res.render("pages/error.ejs", {
			error: "An unexpected error has occurred!"
		});
	}
}

module.exports = searchItem;
