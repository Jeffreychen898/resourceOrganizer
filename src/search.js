const MongoModels = require("./MongoModels");
const helper = require("./helper");

async function searchItem(req, res) {
	try {
		const query = helper.titleFilter(req.query.q);

		const regexFind = new RegExp(query);
		const result = await MongoModels.items.find({ filtered_title: { $regex: query }});
		res.render("pages/search_result.ejs", {
			user: req.params.user,
			results: result
		});

	} catch(error) {
		res.send("an error has occured");
	}
}

module.exports = searchItem;
