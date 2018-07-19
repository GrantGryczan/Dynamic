const electron = require("electron");
let win;
const filesToOpen = [];
let addFileToOpen = filesToOpen.push.bind(filesToOpen);
if(process.argv[1]) {
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
const rootURL = `file://${__dirname}`;
let noClosedIntent = true;
electron.app.once("window-all-closed", () => {
	if(noClosedIntent) {
		electron.app.quit();
	}
});
electron.app.once("ready", () => {
	win = new electron.BrowserWindow({
		title: "Miroware Dynamic",
		show: false,
		center: true,
		width: 512,
		height: 512,
		resizable: false,
		frame: false,
		transparent: true,
		webPreferences: {
			devTools: false
		}
	});
	win.webContents.once("did-finish-load", () => {
		win.show();
		setTimeout(() => {
			win.once("closed", () => {
				win = new electron.BrowserWindow({
					title: "Miroware Dynamic",
					show: false,
					minWidth: 480,
					minHeight: 480
				});
				noClosedIntent = true;
				win.webContents.once("did-finish-load", () => {
					win.show();
					while(filesToOpen.length) {
						win.webContents.send("argv", filesToOpen.pop());
					}
					addFileToOpen = win.webContents.send.bind(win.webContents, "argv");
				});
				win.maximize();
				win.loadURL(`${rootURL}/index.html`);
			});
			noClosedIntent = false;
			win.destroy();
		}, 2560);
	});
	win.setMenu(null);
	win.loadURL(`${rootURL}/splash/index.html`);
});
