function removeItem(element) {
	const xhr = new XMLHttpRequest();
	xhr.onload = () => {
		element.parentElement.remove();
	}
	xhr.open("POST", "/manage/remove", true);
	xhr.setRequestHeader("Content-Type", "application/json");
	xhr.send(JSON.stringify({_csrf: getCsrfToken(), id: element.getAttribute("data-id")}));
}

function copyText(element) {
	element.select();
	element.setSelectionRange(0, 99999);
	document.execCommand("copy");
}
