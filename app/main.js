"use strict";
const electron = require("electron");
let win;
const filesToOpen = [];
let addFileToOpen = filesToOpen.push.bind(filesToOpen);
if(process.argv[1] && process.argv[2] !== "dev") {
	addFileToOpen(process.argv[1]);
}
if(electron.app.makeSingleInstance(([, fileToOpen]) => {
	if(fileToOpen) {
		addFileToOpen(fileToOpen);
	}
	if(win) {
		if(win.isMinimized()) {
			win.restore();
		}
		win.focus();
	}
})) {
	electron.app.quit();
	return;
}
electron.app.once("window-all-closed", () => {
	electron.app.quit();
});
electron.app.once("ready", () => {
	win = new electron.BrowserWindow({
		title: "Miroware Dynamic",
		show: false,
		minWidth: 480,
		minHeight: 480,
		backgroundColor: "#e0e0e0"
	});
	win.once("ready-to-show", () => {
		win.maximize();
		while(filesToOpen.length) {
			win.webContents.send("argv", filesToOpen.pop());
		}
		addFileToOpen = win.webContents.send.bind(win.webContents, "argv");
	});
	win.loadURL(`file://${__dirname}/index.html`);
});
