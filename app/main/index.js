const fs = require("fs-extra");
const crypto = require("crypto");
const zlib = require("zlib");
const electron = require("electron");
const uid = keys => {
	let key;
	do {
		key = crypto.createHash("sha256").update(crypto.randomBytes(8)).digest("hex").slice(0, 8);
	} while(keys.includes(key));
	return key;
};
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
		Miro.dialog("Error", "An error occurred while trying to save your user data.");
	}
};
const win = electron.remote.getCurrentWindow();
electron.webFrame.setVisualZoomLevelLimits(1, 1);
const titleBar = document.querySelector("#titleBar");
titleBar.querySelector(".label").textContent = `Miroware Dynamic ${navigator.userAgent.match(/ Dynamic\/([^ ]+) /)[1]}`;
if(win.isFullScreen()) {
	titleBar.classList.add("hidden");
}
const windowActions = titleBar.querySelector("#windowActions");
const minimizeWindow = windowActions.querySelector("#minimizeWindow");
const maximizeWindow = windowActions.querySelector("#maximizeWindow");
const onMaximize = () => {
	maximizeWindow.textContent = "fullscreen_exit";
};
const onUnmaximize = () => {
	maximizeWindow.textContent = "fullscreen";
};
if(win.isMaximized()) {
	onMaximize();
} else {
	onUnmaximize();
}
win.on("maximize", onMaximize);
win.on("unmaximize", onUnmaximize);
const closeWindow = windowActions.querySelector("#closeWindow");
const container = document.querySelector("#container");
const tabs = container.querySelector("#tabs");
const homeTab = tabs.querySelector("#homeTab");
const toolbar = container.querySelector("#toolbar");
const loading = container.querySelector("#loading");
const newProj = toolbar.querySelector("#newProj");
const openProj = toolbar.querySelector("#openProj");
const saveProj = toolbar.querySelector("#saveProj");
const saveProjAs = toolbar.querySelector("#saveProjAs");
const exportProj = toolbar.querySelector("#exportProj");
const homePage = container.querySelector("#homePage");
const projectPage = container.querySelector("#projectPage");
const assetContainer = container.querySelector("#assetContainer");
const assetHead = assetContainer.querySelector("#assetHead");
const createObj = assetHead.querySelector("#createObj");
const createGroup = assetHead.querySelector("#createGroup");
const importImage = assetHead.querySelector("#importImage");
const importAudioj = assetHead.querySelector("#importAudio");
const assets = assetContainer.querySelector("#assets");
const propertyContainer = container.querySelector("#propertyContainer");
const timelineContainer = container.querySelector("#timelineContainer");
if(storage.containerSizes instanceof Object) {
	if(storage.containerSizes.assetContainer) {
		assetContainer.style.width = `${storage.containerSizes.assetContainer}px`;
	}
	if(storage.containerSizes.propertyContainer) {
		propertyContainer.style.width = `${storage.containerSizes.propertyContainer}px`;
	}
	if(storage.containerSizes.timelineContainer) {
		timelineContainer.style.height = timelineContainer.style.minHeight = `${storage.containerSizes.timelineContainer}px`;
	}
} else {
	storage.containerSizes = {};
}
store();
const slashes = /[\\\/]/g;
const byName = file => file.name;
const proj = {}; // the object of projects, the probject
let projID = 0;
let sel;
const prevSel = [];
const baseData = {
	service: "Miroware Dynamic",
	version: 0,
	scrollAssets: 0
};
const _proj = Symbol("proj");
const _saved = Symbol("saved");
const _name = Symbol("name");
const _location = Symbol("location");
class Project {
	constructor(thisProject) {
		if(!(thisProject instanceof Object)) {
			thisProject = {};
		}
		const validLocation = typeof thisProject.location === "string";
		if(typeof thisProject.name === "string") {
			this[_name] = thisProject.name;
		} else if(!validLocation) {
			const projects = Object.values(proj);
			let i = 0;
			do {
				this[_name] = `Project ${++i}`;
			} while(projects.some(project => project.name === this[_name]));
		}
		tabs.appendChild(this.tab = html`
			<div class="tab${(this[_saved] = !!thisProject.saved) ? " saved" : ""}">
				<div class="label">$${this[_name]}</div>
				<div class="close material-icons"></div>
			</div>
		`);
		this.tab[_proj] = this;
		this.location = validLocation ? thisProject.location : null;
		this.data = thisProject.data || {
			...baseData,
			groups: {},
			files: {},
			objs: {}
		};
		this.selected = [];
		const id = String(++projID);
		(proj[id] = this).id = id;
		select(id);
	}
	get location() {
		return this[_location];
	}
	set location(value) {
		if(value) {
			this[_location] = this.tab.title = value;
			this.name = this[_location].slice(this[_location].replace(slashes, "/").lastIndexOf("/") + 1);
		}
	}
	get name() {
		return this[_name];
	}
	set name(value) {
		this[_name] = this.tab.querySelector(".label").textContent = value;
	}
	get saved() {
		return this[_saved];
	}
	set saved(value) {
		this.tab.classList[(saveProj.disabled = this[_saved] = !!value) ? "add" : "remove"]("saved");
	}
	async close() {
		if(!this.saved && await new Miro.dialog("Confirm", html`
			Are you sure you want to close <span class="bold">${this.name}</span>?<br>
			All unsaved changes will be lost.
		`, ["Yes", "No"]) !== 0) {
			return;
		}
		if(this.id === sel) {
			prevSel.pop();
			select(prevSel.pop());
		}
		this.tab.remove();
		delete proj[this.id];
	}
}
const _asset = Symbol("asset");
const _assetID = Symbol("assetID");
const appendAssetFile = file => {
	const type = proj[sel].data.files[file].type.slice(0, proj[sel].data.files[file].type.indexOf("/"));
	const asset = html`
		<div id="asset_$${file}" class="asset file" title="$${proj[sel].data.files[file].name}">
			<div class="icon material-icons">${type === "image" ? "image" : (type === "audio" ? "audiotrack" : "error")}</div>
			<div class="label">$${proj[sel].data.files[file].name}</div>
			<div class="close material-icons"></div>
		</div>
	`;
	asset[_asset] = proj[sel].data.files[asset[_assetID] = file];
	assets.appendChild(asset);
	return asset;
};
const removeAsset = asset => {
	if(asset[_asset].id === proj[sel].selectedAsset) {
		delete proj[sel].selectedAsset;
	}
	delete proj[sel].data[`${asset.classList[1]}s`][asset[_assetID]];
	asset.remove();
};
const confirmRemoveAsset = asset => {
	if(asset.classList.contains("file")) {
		new Miro.dialog("Remove Asset", html`
			Are you sure you want to remove <span class="bold">${asset[_asset].name}</span>?<br>
			This cannot be undone.
		`, ["Yes", "No"]).then(value => {
			if(value === 0) {
				removeAsset(asset);
			}
		});
	}
};
const confirmRemoveAssets = assets => {
	if(assets.length === 1) {
		confirmRemoveAsset(assets[0]);
	} else if(assets.length > 1) {
		new Miro.dialog("Remove Assets", html`
			Are you sure you want to remove all those assets?<br>
			This cannot be undone.
		`, ["Yes", "No"]).then(value => {
			if(value === 0) {
				assets.forEach(removeAsset);
			}
		});
	}
};
const select = id => {
	if(!proj[id]) {
		id = "home";
	}
	const prevSelIndex = prevSel.indexOf(id);
	if(prevSelIndex !== -1) {
		prevSel.splice(prevSelIndex, 1);
	}
	if(proj[sel]) {
		proj[sel].scrollAssets = assets.scrollTop;
		projectPage.classList.add("hidden");
	} else {
		homePage.classList.add("hidden");
	}
	if(proj[sel]) {
		proj[sel].selected = [];
		while(assets.lastChild) {
			if(assets.lastChild.classList.contains("selected")) {
				proj[sel].selected.push(assets.lastChild.id);
			}
			assets.lastChild.remove();
		}
	}
	prevSel.push(sel = id);
	for(const tab of tabs.children) {
		tab.classList.remove("current");
	}
	if(saveProjAs.disabled = exportProj.disabled = id === "home") {
		saveProj.disabled = true;
		homeTab.classList.add("current");
		homePage.classList.remove("hidden");
	} else {
		for(const file of Object.keys(proj[sel].data.files)) {
			appendAssetFile(file);
		}
		for(const selected of proj[sel].selected) {
			projectPage.querySelector(`#${selected}`).classList.add("selected");
		}
		saveProj.disabled = proj[sel].saved;
		proj[sel].tab.classList.add("current");
		projectPage.classList.remove("hidden");
		assets.scrollTop = proj[sel].scrollAssets;
	}
};
select("home");
const fileOptions = {
	properties: ["openFile", "createDirectory"],
	filters: [{
		name: "Miroware Dynamic Files",
		extensions: ["mwd"]
	}, {
		name: "All Files",
		extensions: ["*"]
	}]
};
const block = state => {
	const classListMethod = state ? "add": "remove";
	tabs.classList[classListMethod]("disabled");
	toolbar.classList[classListMethod]("disabled");
	if(proj[sel]) {
		projectPage.classList[classListMethod]("disabled");
	}
};
const loadIndeterminate = value => {
	block(value);
	if(value) {
		document.body.classList.add("indeterminate");
		win.setProgressBar(0, {
			mode: "indeterminate"
		});
	} else {
		document.body.classList.remove("indeterminate");
		win.setProgressBar(-1);
	}
};
const loadProgress = value => {
	if(value === 0) {
		document.body.classList.add("loading");
		win.setProgressBar(0);
		block(true);
	} else if(value === 1) {
		document.body.classList.remove("loading");
		loading.style.width = "";
		win.setProgressBar(-1);
		block(false);
	} else {
		loading.style.width = `${100 * value}%`;
		win.setProgressBar(value);
	}
};
const zip = data => new Promise((resolve, reject) => {
	zlib.gzip(data, (err, result) => {
		if(err) {
			reject(err);
		} else {
			resolve(result);
		}
	});
});
const unzip = data => new Promise((resolve, reject) => {
	zlib.unzip(data, (err, result) => {
		if(err) {
			reject(err);
		} else {
			resolve(result);
		}
	});
});
const save = async as => {
	if(proj[sel] && (as || !proj[sel].saved) && (proj[sel].location = (!as && proj[sel].location) || electron.remote.dialog.showSaveDialog(win, fileOptions))) {
		loadIndeterminate(true);
		try {
			await fs.writeFile(proj[sel].location, await zip(JSON.stringify(proj[sel].data)));
		} catch(err) {
			new Miro.dialog("Error", `An error occurred while trying to save.\n${err.message}`);
			loadIndeterminate(false);
			return;
		}
		loadIndeterminate(false);
		proj[sel].saved = true;
	}
};
const open = async location => {
	if(!location) {
		location = electron.remote.dialog.showOpenDialog(win, fileOptions);
		if(location) {
			location = location[0];
		}
	}
	if(location) {
		loadIndeterminate(true);
		let data;
		try {
			if((data = JSON.parse(await unzip(await fs.readFile(location)))).service !== "Miroware Dynamic") {
				throw null;
			}
		} catch(err) {
			new Miro.dialog("Error", "That is not a valid MWD file.");
			loadIndeterminate(false);
			return false;
		}
		loadIndeterminate(false);
		return new Project({
			saved: true,
			location,
			data
		});
	} else {
		return false;
	}
};
electron.ipcRenderer.on("argv", (event, location) => {
	open(location);
});
const addFiles = async files => {
	loadProgress(0);
	for(let i = 0; i < files.length; i++) {
		loadProgress(i / files.length);
		let data;
		try {
			data = (await fs.readFile(files[i].path)).toString("base64");
		} catch(err) {
			new Miro.dialog("Error", html`
				An error occurred while encoding <span class="bold">${files[i].name}</span>.<br>
				Perhaps the file is too large.
			`);
			continue;
		}
		const names = Object.values(proj[sel].data.files).map(byName);
		let name = files[i].name;
		for(let j = 2; names.includes(name); j++) {
			name = `${files[i].name} ${j}`;
		}
		const file = uid([...Object.keys(proj[sel].data.groups), ...Object.keys(proj[sel].data.files), ...Object.keys(proj[sel].data.objs)]);
		proj[sel].data.files[file] = {
			name,
			type: files[i].type,
			data
		};
		appendAssetFile(file);
	}
	loadProgress(1);
};
const assetInput = document.createElement("input");
assetInput.type = "file";
assetInput.multiple = true;
assetInput.addEventListener("change", async () => {
	await addFiles(assetInput.files);
	assetInput.value = null;
});
let mouseTarget;
let down = false;
let downX;
let downY;
let initialTargetPos;
let targetOffset;
window.addEventListener("mousedown", event => {
	if(event.button === 0 && !down) {
		down = true;
		downX = event.clientX;
		downY = event.clientY;
		mouseTarget = event.target;
		if(assets.contains(mouseTarget)) {
			for(const active of projectPage.querySelectorAll(".active")) {
				active.classList.remove("active");
			}
			assets.classList.add("active");
		}
		if(mouseTarget === assets) {
			for(const selected of assets.querySelectorAll(".asset.selected")) {
				selected.classList.remove("selected");
			}
			delete proj[sel].selectedAsset;
		} else if(mouseTarget.classList.contains("tab")) {
			if(mouseTarget === homeTab) {
				select("home");
			} else {
				select(mouseTarget[_proj].id);
				const prevTabPos = mouseTarget.offsetLeft;
				targetOffset = downX - prevTabPos;
				mouseTarget.style.left = "";
				mouseTarget.style.left = `${prevTabPos - (initialTargetPos = mouseTarget.offsetLeft)}px`;
				for(let i = 1; i < tabs.children.length; i++) {
					tabs.children[i].classList[tabs.children[i] === mouseTarget ? "remove" : "add"]("smooth");
				}
			}
		} else if(mouseTarget.classList.contains("handle")) {
			initialTargetPos = mouseTarget.parentNode[mouseTarget.classList.contains("horizontal") ? "offsetWidth" : "offsetHeight"];
			if(mouseTarget.parentNode === assetContainer) {
				targetOffset = mouseTarget.parentNode.offsetWidth - downX;
			} else if(mouseTarget.parentNode === propertyContainer) {
				targetOffset = downX - mouseTarget.parentNode.offsetLeft;
			} else if(mouseTarget.parentNode === timelineContainer) {
				targetOffset = downY - mouseTarget.parentNode.offsetTop;
			}
		}
	}
});
window.addEventListener("mousemove", event => {
	if(down) {
		if(mouseTarget.classList.contains("asset")) {
			// TODO
		} else if(mouseTarget.classList.contains("tab")) {
			if(mouseTarget !== homeTab) {
				mouseTarget.style.left = `${event.clientX - initialTargetPos - targetOffset}px`;
				const tabWidth = mouseTarget.offsetWidth + 1;
				let afterTarget = false;
				for(let i = 1; i < tabs.children.length; i++) {
					if(tabs.children[i] === mouseTarget) {
						afterTarget = true;
					} else {
						if(afterTarget) {
							if(mouseTarget.offsetLeft >= homeTab.offsetWidth + 1 + (i - 1.5) * tabWidth) {
								if(!tabs.children[i].style.left) {
									tabs.children[i].style.left = `-${tabWidth}px`;
								}
							} else if(tabs.children[i].style.left) {
								tabs.children[i].style.left = "";
							}
						} else {
							if(mouseTarget.offsetLeft <= homeTab.offsetWidth + 1 + (i - 0.5) * tabWidth) {
								if(!tabs.children[i].style.left) {
									tabs.children[i].style.left = `${tabWidth}px`;
								}
							} else if(tabs.children[i].style.left) {
								tabs.children[i].style.left = "";
							}
						}
					}
				}
			}
		} else if(mouseTarget.classList.contains("handle")) {
			let value = targetOffset;
			if(mouseTarget.parentNode === assetContainer) {
				value += event.clientX;
			} else if(mouseTarget.parentNode === propertyContainer) {
				value += document.body.offsetWidth - event.clientX;
			} else if(mouseTarget.parentNode === timelineContainer) {
				value += document.body.offsetHeight - event.clientY;
			}
			const horizontalTarget = mouseTarget.classList.contains("horizontal");
			mouseTarget.parentNode.style[horizontalTarget ? "width" : "height"] = `${storage.containerSizes[mouseTarget.parentNode.id] = Math.max(185, value)}px`;
			if(!horizontalTarget) {
				mouseTarget.parentNode.style.minHeight = mouseTarget.parentNode.style.height;
			}
		}
	}
});
const makeTabRough = () => {
	mouseTarget.classList.remove("smooth");
};
const resetTabPos = () => {
	mouseTarget.style.left = "";
	setTimeout(makeTabRough, 150);
};
window.addEventListener("mouseup", event => {
	if(event.button === 0) {
		if(mouseTarget) {
			if(mouseTarget.classList.contains("tab")) {
				if(mouseTarget !== homeTab) {
					let afterTarget = false;
					let shifted;
					let shiftedAfterTarget = 2;
					for(let i = 1; i < tabs.children.length; i++) {
						if(tabs.children[i] === mouseTarget) {
							afterTarget = true;
						} else if(tabs.children[i].style.left) {
							shifted = i;
							if(afterTarget) {
								shifted++;
							} else {
								shiftedAfterTarget = 1;
								break;
							}
						} else if(afterTarget) {
							break;
						}
					}
					const tabWidth = mouseTarget.offsetWidth + 1;
					if(shifted) {
						const newPos = homeTab.offsetWidth + 1 + (shifted - shiftedAfterTarget) * tabWidth;
						mouseTarget.style.left = `${mouseTarget.offsetLeft - newPos}px`;
						for(let i = 1; i < tabs.children.length; i++) {
							if(tabs.children[i] !== mouseTarget) {
								tabs.children[i].classList.remove("smooth");
								tabs.children[i].style.left = "";
							}
						}
						tabs.insertBefore(mouseTarget, tabs.children[shifted]);
					}
					mouseTarget.classList.add("smooth");
					setTimeout(resetTabPos);
				}
			} else if(mouseTarget.classList.contains("handle")) {
				store();
			} else if(event.target === mouseTarget) {
				if(mouseTarget.parentNode === windowActions) {
					if(mouseTarget === minimizeWindow) {
						win.minimize();
					} else if(mouseTarget === maximizeWindow) {
						if(win.isMaximized()) {
							win.unmaximize();
						} else {
							win.maximize();
						}
					} else if(mouseTarget === closeWindow) {
						win.close();
					}
				} else if(mouseTarget.parentNode === toolbar) {
					if(mouseTarget === newProj) {
						new Project();
					} else if(mouseTarget === openProj) {
						open();
					} else if(mouseTarget === saveProj) {
						save();
					} else if(mouseTarget === saveProjAs) {
						save(true);
					} else if(mouseTarget === exportProj) {
						// TODO
					}
				} else if(mouseTarget.parentNode === assetHead) {
					if(mouseTarget === createObj) {
						// TODO
					} else if(mouseTarget === createGroup) {
						// TODO
					} else if(mouseTarget === importImage) {
						assetInput.accept = "image/*";
						assetInput.click();
					} else if(mouseTarget === importAudio) {
						assetInput.accept = "audio/*";
						assetInput.click();
					}
				} else if(mouseTarget.classList.contains("asset")) {
					if(event.shiftKey) {
						let selecting = !proj[sel].selectedAsset;
						const classListMethod = event.ctrlKey && proj[sel].selectedAsset && !document.querySelector(`#${proj[sel].selectedAsset}`).classList.contains("selected") ? "remove" : "add";
						for(const asset of assets.children) {
							if(asset.id === proj[sel].selectedAsset || asset.id === mouseTarget.id) {
								if(selecting) {
									asset.classList[classListMethod]("selected");
									selecting = false;
									continue;
								} else {
									asset.classList[classListMethod]("selected");
									if(proj[sel].selectedAsset !== mouseTarget.id) {
										selecting = true;
									}
								}
							} else if(selecting) {
								asset.classList[classListMethod]("selected");
							} else if(!event.ctrlKey) {
								asset.classList.remove("selected");
							}
						}
					} else {
						proj[sel].selectedAsset = mouseTarget.id;
						if(event.ctrlKey) {
							mouseTarget.classList.toggle("selected");
						} else {
							let othersSelected = false;
							for(const asset of assets.querySelectorAll(".asset.selected")) {
								if(asset !== mouseTarget) {
									othersSelected = true;
									asset.classList.remove("selected");
								}
							}
							if(mouseTarget.classList[othersSelected ? "add" : "toggle"]("selected") === false) {
								delete proj[sel].selectedAsset;
							}
						}
					}
				} else if(mouseTarget.classList.contains("close")) {
					if(mouseTarget.parentNode.classList.contains("asset")) {
						confirmRemoveAsset(mouseTarget.parentNode);
					} else if(mouseTarget.parentNode.classList.contains("tab")) {
						mouseTarget.parentNode[_proj].close();
					}
				}
			}
		}
		down = false;
	}
});
window.addEventListener("dblclick", event => {
	if(downX === event.clientX && downY === event.clientY) {
		if(event.target === tabs) {
			new Project();
		} else if(event.target.classList.contains("handle")) {
			event.target.parentNode.style.width = event.target.parentNode.style.height = event.target.parentNode.style.minWidth = event.target.parentNode.style.minHeight = "";
			delete storage.containerSizes[event.target.parentNode.id];
			store();
		}
	}
});
const focused = () => !(document.querySelector(".mdc-dialog") || document.body.classList.contains("indeterminate") || document.body.classList.contains("loading"));
window.addEventListener("keydown", event => {
	if(event.ctrlKey || event.metaKey) {
		if((event.shiftKey && event.keyCode === 9) || (!event.shiftKey && event.keyCode === 33)) { // ^`shift`+`tab` || ^`page up`
			if(focused()) {
				if(sel === "home") {
					if(Object.keys(proj).length) {
						select(tabs.lastElementChild[_proj].id);
					}
				} else if(proj[sel].tab.previousElementSibling === homeTab) {
					select("home");
				} else {
					select(proj[sel].tab.previousElementSibling[_proj].id);
				}
			}
		} else if(event.shiftKey) {
			if(event.keyCode === 73) { // ^`shift`+`I`
				win.toggleDevTools();
			} else if(event.keyCode === 83) { // ^`shift`+`S`
				if(focused()) {
					save(true);
				}
			}
		} else if(event.keyCode === 9 || event.keyCode === 34) { // ^`tab` || ^`page down`
			if(focused()) {
				if(sel === "home") {
					if(Object.keys(proj).length) {
						select(homeTab.nextElementSibling[_proj].id);
					}
				} else if(proj[sel].tab.nextElementSibling) {
					select(proj[sel].tab.nextElementSibling[_proj].id);
				} else {
					select("home");
				}
			}
		} else if(event.keyCode === 57) { // ^`9`
			if(focused()) {
				if(Object.keys(proj).length) {
					select(tabs.lastElementChild[_proj].id);
				}
			}
		} else if(event.keyCode === 78 || event.keyCode === 84) { // ^`N` || ^`T`
			if(focused()) {
				new Project();
			}
		} else if(event.keyCode === 79) { // ^`O`
			if(focused()) {
				open();
			}
		} else if(event.keyCode === 83) { // ^`S`
			if(focused()) {
				save();
			}
		} else if(event.keyCode === 87 || event.keyCode === 115) { // ^`W` || ^`F4`
			if(focused()) {
				if(proj[sel]) {
					proj[sel].close();
				} else {
					win.close();
				}
			}
		} else if(event.keyCode >= 49 && event.keyCode <= 56) { // ^`1`-`8`
			if(focused()) {
				if(Object.keys(proj).length) {
					select((tabs.children[event.keyCode - 48] || tabs.lastElementChild)[_proj].id);
				}
			}
		}
	} else if(event.altKey) {
		if(focused()) {
			if(event.keyCode === 36) { // `alt`+`home`
				select("home");
			}
		}
	} else if(event.keyCode === 8 || event.keyCode === 46) { // `backspace` || `delete`
		if(focused() && assets.classList.contains("active")) {
			confirmRemoveAssets(assets.querySelectorAll(".asset.selected"));
		}
	} else if(event.keyCode === 27) { // `esc`
		if(focused() && assets.classList.contains("active")) {
			delete proj[sel].selectedAsset;
			for(const asset of assets.querySelectorAll(".asset.selected")) {
				asset.classList.remove("selected");
			}
		}
	} else if(event.keyCode === 122) { // `F11`
		const fullScreen = !win.isFullScreen();
		win.setFullScreen(fullScreen);
		titleBar.classList[fullScreen ? "add" : "remove"]("hidden");
	}
});
let notConfirmingClose = true;
let shouldNotClose = true;
const confirmClose = value => {
	notConfirmingClose = true;
	if(value === 0) {
		shouldNotClose = false;
		win.close();
	}
};
const unsaved = project => !project.saved;
window.onbeforeunload = () => {
	if(shouldNotClose && notConfirmingClose) {
		if(Object.values(proj).some(unsaved)) {
			notConfirmingClose = false;
			new Miro.dialog("Confirm", "Are you sure you want to exit?\nAll unsaved changes will be lost.", ["Yes", "No"]).then(confirmClose);
			return true;
		}
	}
};
