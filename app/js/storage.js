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
	storage.fps = 60;
}
if(typeof storage.timeUnitWidth !== "number") {
	storage.timeUnitWidth = 10;
}
store();
