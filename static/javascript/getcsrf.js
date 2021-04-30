function getCsrfToken() {
	const meta_tag = document.getElementById("csrf-token");
	return meta_tag.getAttribute("content");
}
