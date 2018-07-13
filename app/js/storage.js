"use strict";
let storage;
try {
	storage = JSON.parse(localStorage.data);
} catch(err) {
	storage = {};
}
const store = () => {
	try {
		localStorage.data = JSON.stringify(storage);
	} catch(err) {
		console.warn(err);
		new Miro.Dialog("Error", "An error occurred while trying to save your user data.");
	}
};
if(storage.size instanceof Object) {
	for(const id of Object.keys(storage.size)) {
		const elem = document.querySelector(`#${id}`);
		if(elem) {
			const handle = elem.querySelector(".handle");
			if(handle) {
				const verticalHandle = handle.classList.contains("top") || handle.classList.contains("bottom");
				const px = `${storage.size[id]}px`;
				elem.style[verticalHandle ? "height" : "width"] = px;
				if(verticalHandle) {
					elem.style.minHeight = px;
				}
			}
		}
	}
} else {
	storage.size = {};
}
if(typeof storage.canvasWidth !== "number") {
	storage.canvasWidth = 650;
}
if(typeof storage.canvasHeight !== "number") {
	storage.canvasHeight = 450;
}
store();
