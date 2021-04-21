let filteredTitleCharacters = new Set();

function init() {
	for(let c of "abcdefghijklmnopqrstuvwxyz1234567890") {
		filteredTitleCharacters.add(c);
	}
}

function filterTitle(title) {
	let result = "";
	for(let c of title.toLowerCase()) {
		if(filteredTitleCharacters.has(c)) {
			result += c;
		}
	}
	return result;
}

module.exports = {
	init: init,
	titleFilter: filterTitle
}
