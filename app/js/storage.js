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
if(!(storage.size instanceof Object)) {
	storage.size = {};
}
if(typeof storage.canvasWidth !== "number") {
	storage.canvasWidth = 650;
}
if(typeof storage.canvasHeight !== "number") {
	storage.canvasHeight = 450;
}
if(typeof storage.fps !== "number") {
	storage.fps = 30;
}
if(typeof storage.frameWidth !== "number") {
	storage.frameWidth = 10;
}
if(typeof storage.clipCanvas !== "boolean") {
	storage.clipCanvas = false;
}
if(typeof storage.onionskin !== "boolean") {
	storage.onionskin = true;
}
store();
