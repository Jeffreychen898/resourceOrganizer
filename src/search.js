const MongoModels = require("./MongoModels");
const helper = require("./helper");

async function searchItem(req, res) {
	try {
		//verify the user
		const find_user = await MongoModels.users.findOne({ condensed_name: req.params.user });
		if(!find_user) {
			res.send("Cannot find user");
			return;
		}
		//search
		const query = helper.titleFilter(req.query.q);

		const result = await MongoModels.items.find({ user_id: find_user.id }).find({ filtered_title: { $regex: query }});
		if(result.length == 0) {
			res.send("no items can be found");
			return;
		}
		res.render("pages/search_result.ejs", {
			user: req.params.user,
			results: result
		});

	} catch(error) {
		console.log(error);
		res.send("an error has occured");
	}
}

module.exports = searchItem;
