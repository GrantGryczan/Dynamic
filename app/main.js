"use strict";
const electron = require("electron");
let win;
const filesToOpen = [];
let addFileToOpen = filesToOpen.push.bind(filesToOpen);
if(process.argv[1] && process.argv[2] !== "dev") {
	addFileToOpen(process.argv[1]);
}
if(electron.app.requestSingleInstanceLock()) {
	electron.app.on("second-instance", (evt, [, fileToOpen]) => {
		if(fileToOpen) {
			addFileToOpen(fileToOpen);
		}
		if(win) {
			if(win.isMinimized()) {
				win.restore();
			}
			win.focus();
		}
	});
} else {
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
		backgroundColor: "#e0e0e0",
		webPreferences: {
			nodeIntegration: true
		}
	});
	win.once("ready-to-show", () => {
		win.maximize();
		win.show();
		while(filesToOpen.length) {
			win.webContents.send("argv", filesToOpen.pop());
		}
		addFileToOpen = win.webContents.send.bind(win.webContents, "argv");
	});
	win.loadURL(`file://${__dirname}/index.html`);
});
