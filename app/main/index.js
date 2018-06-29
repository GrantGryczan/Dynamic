"use strict";
global.Miro = {};
Miro.magic = {};
Miro.magic.magic = Miro.magic;
console.log(Miro.magic);
class MiroError extends Error {
	constructor() {
		const err = super(...arguments);
		err.name = "MiroError";
		return err;
	}
}
Miro.wait = delay => new Promise(resolve => {
	setTimeout(resolve, delay);
});
Miro.mdc = Symbol("mdc");
Miro.prepare = node => {
	if(!(node instanceof Element || node instanceof Document)) {
		throw new MiroError("The `node` parameter must be an element or a document.");
	}
	for(const elem of node.querySelectorAll("input[type='email']")) {
		elem.maxLength = 254;
	}
	for(const elem of node.querySelectorAll("button:not([type])")) {
		elem.type = "button";
	}
	for(const elem of node.querySelectorAll(".mdc-ripple:not(.mdc-ripple-upgraded)")) {
		elem[Miro.mdc] = new mdc.ripple.MDCRipple(elem);
	}
	for(const elem of node.querySelectorAll(".mdc-text-field:not(.mdc-text-field--upgraded)")) {
		elem[Miro.mdc] = new mdc.textField.MDCTextField(elem);
	}
	for(const elem of node.querySelectorAll(".mdc-checkbox:not(.mdc-checkbox--upgraded)")) {
		elem.querySelector(".mdc-checkbox__background").appendChild(checkmark.cloneNode(true));
		elem[Miro.mdc] = new mdc.checkbox.MDCCheckbox(elem);
	}
	for(const elem of node.querySelectorAll(".mdc-form-field")) {
		elem[Miro.mdc] = new mdc.formField.MDCFormField(elem);
	}
};
const htmlExps = ["$", "&"];
const htmlReplacements = [[/&/g, "&amp;"], [/</g, "&lt;"], [/>/g, "&gt;"], [/"/g, "&quot;"], [/'/g, "&#39;"], [/`/g, "&#96;"]];
global.html = (strs, ...exps) => {
	let str = strs[0];
	for(let i = 0; i < exps.length; i++) {
		let code = String(exps[i]);
		const expIndex = htmlExps.indexOf(strs[i].slice(-1));
		if(expIndex !== -1) {
			str = str.slice(0, -1);
			for(let j = expIndex; j < htmlReplacements.length; j++) {
				code = code.replace(...htmlReplacements[j]);
			}
		}
		str += code + strs[i + 1];
	}
	const elem = document.createElement("span");
	elem.innerHTML = str.trim() || str;
	Miro.prepare(elem);
	return elem.childNodes.length === 1 ? elem.firstChild : elem;
};
const mdcTypes = ["checkbox", "radio", "select", "slider", "text-field"];
const _disabled = Symbol("disabled");
const _prevDisabled = Symbol("prevDisabled");
Miro.formState = (form, state) => {
	if(!(form instanceof HTMLFormElement)) {
		throw new MiroError("The `form` parameter must be an HTML `form` element.");
	}
	state = !state;
	if(form[_disabled] !== state) {
		form[_disabled] = state;
		for(const elem of form.elements) {
			if(state) {
				elem[_prevDisabled] = elem.disabled;
				elem.disabled = true;
			} else if(!elem[_prevDisabled]) {
				elem.disabled = false;
			}
		}
		for(const mdcType of mdcTypes) {
			const mdcClass = `.mdc-${mdcType}`;
			const disabledClass = `mdc-${mdcType}--disabled`;
			for(const elem of form.querySelectorAll(mdcClass)) {
				if(state) {
					elem[_prevDisabled] = elem.classList.contains(disabledClass);
					elem.classList.add(disabledClass);
				} else if(!elem[_prevDisabled]) {
					elem.classList.remove(disabledClass);
				}
			}
		}
	}
};
const _dialog = Symbol("dialog");
const _promise = Symbol("promise");
const _close = Symbol("close");
class MiroDialog {
	constructor(title, body, buttons) {
		if(!(typeof title === "string")) {
			throw new MiroError("The `title` parameter must be a string.");
		}
		if(buttons === undefined) {
			buttons = ["Okay"];
		} else if(!(buttons instanceof Array)) {
			throw new MiroError("The `buttons` parameter must be an array if it is defined.");
		}
		if(typeof body === "string") {
			const lines = body.split("\n");
			body = document.createElement("span");
			for(let i = 0; i < lines.length; i++) {
				if(i !== 0) {
					body.appendChild(document.createElement("br"));
				}
				body.appendChild(document.createTextNode(lines[i]));
			}
		} else if(!(body instanceof Node)) {
			throw new MiroError("The `body` parameter must be a string or a DOM node.");
		}
		closeCtx();
		this.ready = false;
		if(body instanceof HTMLElement) {
			Miro.prepare(body);
		}
		const dialogElem = document.createElement("aside");
		dialogElem[_dialog] = this;
		dialogElem.classList.add("mdc-dialog");
		const surfaceElem = this.form = document.createElement("form");
		surfaceElem.classList.add("mdc-dialog__surface");
		const headerElem = document.createElement("header");
		headerElem.classList.add("mdc-dialog__header");
		const titleElem = document.createElement("h2");
		titleElem.classList.add("mdc-dialog__header__title");
		titleElem.textContent = title;
		headerElem.appendChild(titleElem);
		surfaceElem.appendChild(headerElem);
		const bodyElem = document.createElement("section");
		bodyElem.classList.add("mdc-dialog__body");
		bodyElem.appendChild(body);
		surfaceElem.appendChild(bodyElem);
		const footerElem = document.createElement("footer");
		footerElem.classList.add("mdc-dialog__footer");
		for(let i = 0; i < buttons.length; i++) {
			const item = buttons[i];
			buttons[i] = document.createElement("button");
			if(typeof item === "string") {
				buttons[i].type = "button";
				buttons[i].textContent = item;
			} else if(item instanceof Object) {
				buttons[i].type = item.type;
				buttons[i].textContent = item.text;
			} else {
				throw new MiroError("The `buttons` parameter's array must only include strings and objects.");
			}
			buttons[i].classList.add("mdc-button");
			buttons[i].classList.add("mdc-dialog__footer__button");
			footerElem.appendChild(buttons[i]);
		}
		surfaceElem.appendChild(footerElem);
		dialogElem.appendChild(surfaceElem);
		const backdropElem = document.createElement("div");
		backdropElem.classList.add("mdc-dialog__backdrop");
		dialogElem.appendChild(backdropElem);
		const dialog = new mdc.dialog.MDCDialog(dialogElem);
		container.appendChild(dialogElem);
		this[_promise] = new Promise(resolve => {
			let submitted = false;
			let formState = true;
			if(!(submitted = !footerElem.querySelector("button[type='submit']"))) {
				surfaceElem.addEventListener("submit", evt => {
					evt.preventDefault();
					submitted = true;
					setTimeout(() => {
						formState = !surfaceElem[_disabled];
						Miro.formState(surfaceElem, false);
					});
				});
			}
			this.value = null;
			const close = value => {
				this.closed = true;
				this.value = value;
				setTimeout(() => {
					container.removeChild(dialogElem);
					Miro.formState(surfaceElem, formState);
				}, 120);
				resolve(value);
			};
			this[_close] = close;
			const dialogButton = async evt => {
				if(!submitted && evt.target.type === "submit") {
					await Miro.wait();
					if(!submitted) {
						return;
					}
				}
				dialog.close();
				close(buttons.indexOf(evt.target));
			};
			for(const elem of buttons) {
				elem.addEventListener("click", dialogButton);
			}
			dialog.listen("MDCDialog:cancel", () => {
				close(-1);
			});
			setTimeout(() => {
				dialog.show();
				this.ready = true;
			});
		});
		this[_dialog] = dialog;
		this.element = dialogElem;
		this.body = bodyElem;
		this.buttons = buttons;
	}
	then(onFulfilled) {
		this[_promise].then(onFulfilled);
		return this;
	}
	finally(onFinally) {
		this[_promise].finally(onFinally);
		return this;
	}
	close(value) {
		setTimeout(() => {
			if(this.ready) {
				this[_dialog].close();
				this[_close](typeof value === "number" ? value : -1);
				return true;
			} else {
				throw new MiroError("The dialog has not finished instantiating and cannot be closed.");
			}
		});
	}
}
Miro.dialog = MiroDialog;
Miro.prepare(document);
const titleBar = document.querySelector("#titleBar");
const windowActions = titleBar.querySelector("#windowActions");
const minimizeWindow = windowActions.querySelector("#minimizeWindow");
const maximizeWindow = windowActions.querySelector("#maximizeWindow");
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
const addAsset = assetContainer.querySelector("#addAsset");
const assets = assetContainer.querySelector("#assets");
const propertyContainer = container.querySelector("#propertyContainer");
const timelineContainer = container.querySelector("#timelineContainer");
const ctxMenu = container.querySelector("#ctxMenu");
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
titleBar.querySelector(".label").textContent = `Miroware Dynamic ${navigator.userAgent.match(/ Dynamic\/([^ ]+) /)[1]}`;
if(win.isFullScreen()) {
	titleBar.classList.add("hidden");
}
let shiftKey = false;
let superKey = false;
let altKey = false;
const onFocus = () => {
	document.body.classList.add("focus");
};
const onBlur = () => {
	document.body.classList.remove("focus");
	shiftKey = false;
	superKey = false;
	altKey = false;
};
win.on("focus", onFocus);
win.on("blur", onBlur);
if(win.isFocused()) {
	onFocus();
} else {
	onBlur();
}
const onMaximize = () => {
	maximizeWindow.textContent = "fullscreen_exit";
};
const onUnmaximize = () => {
	maximizeWindow.textContent = "fullscreen";
};
win.on("maximize", onMaximize);
win.on("unmaximize", onUnmaximize);
if(win.isMaximized()) {
	onMaximize();
} else {
	onUnmaximize();
}
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
const scrollIntoView = elem => {
	if(elem.offsetTop < elem.parentNode.scrollTop) {
		elem.parentNode.scrollTop = elem.offsetTop;
	} else if(elem.offsetTop + elem.offsetHeight > elem.parentNode.scrollTop + elem.parentNode.offsetHeight) {
		elem.parentNode.scrollTop = elem.offsetTop + elem.offsetHeight - elem.parentNode.offsetHeight;
	}
};
const byName = file => file.name;
const _index = Symbol("_index");
let ctxTarget;
const openCtx = target => {
	ctxTarget = target;
	const items = [];
	const targetAsset = ctxTarget.classList.contains("asset");
	if(ctxTarget === assets || targetAsset) {
		if(targetAsset) {
			items.push({
				Remove: true,
				Rename: assets.querySelectorAll(".asset.selected").length === 1
			});
		}
		items.push(["Create object", "Create group", "Import image file(s)", "Import audio file(s)"]);
	}
	if(items.length) {
		let itemIndex = 0;
		for(let i = 0; i < items.length; i++) {
			if(i !== 0) {
				ctxMenu.appendChild(document.createElement("hr"));
			}
			const itemArray = items[i] instanceof Array;
			for(const item of itemArray ? items[i] : Object.keys(items[i])) {
				const button = html`<button class="mdc-typography">$${item}</button>`;
				if(!itemArray && !items[i][item]) {
					button.disabled = true;
				}
				button[_index] = itemIndex++;
				ctxMenu.appendChild(button);
			}
		}
		ctxMenu.classList.remove("hidden");
		ctxMenu.style.left = `${mouseX - ctxMenu.offsetWidth}px`;
		if(mouseX + ctxMenu.offsetWidth <= document.body.offsetWidth || ctxMenu.offsetLeft < 0) {
			ctxMenu.style.left = `${mouseX + 1}px`;
		}
		ctxMenu.style.top = `${mouseY - ctxMenu.offsetHeight}px`;
		if(mouseY + ctxMenu.offsetHeight <= document.body.offsetHeight || ctxMenu.offsetTop < 0) {
			ctxMenu.style.top = `${mouseY + 1}px`;
		}
	}
};
const closeCtx = () => {
	ctxMenu.classList.add("hidden");
	while(ctxMenu.children.length) {
		ctxMenu.lastChild.remove();
	}
}
const proj = {}; // the object of projects, the probject
let projID = 0;
let sel;
const prevSel = [];
const baseData = {
	service: "Miroware Dynamic",
	version: 0,
	scrollAssets: 0
};
const slashes = /[\\\/]/g;
const _proj = Symbol("proj");
const _saved = Symbol("saved");
const _name = Symbol("name");
const _location = Symbol("location");
const _selectedAsset = Symbol("selectedAsset");
const _focusedAsset = Symbol("focusedAsset");
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
	get selectedAsset() {
		return this[_selectedAsset];
	}
	set selectedAsset(value) {
		this.focusedAsset = this[_selectedAsset] = value;
	}
	get focusedAsset() {
		return this[_focusedAsset];
	}
	set focusedAsset(value) {
		for(const asset of assets.querySelectorAll(".asset.focus")) {
			asset.classList.remove("focus");
		}
		if(this[_focusedAsset] = value) {
			const asset = assets.querySelector(`#${value}`);
			asset.classList.add("focus");
			scrollIntoView(asset);
		}
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
		proj[sel].selectedAsset = null;
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
		while(assets.children.length) {
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
		for(const id of proj[sel].selected) {
			projectPage.querySelector(`#${id}`).classList.add("selected");
		}
		if(proj[sel].focusedAsset) {
			assets.querySelector(`#${proj[sel].focusedAsset}`).classList.add("focus");
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
const setActive = elem => {
	for(const active of document.querySelectorAll(".active")) {
		active.classList.remove("active");
	}
	elem.classList.add("active");
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
electron.ipcRenderer.on("argv", (evt, location) => {
	open(location);
});
const addFiles = async files => {
	setActive(assets);
	loadProgress(0);
	for(const asset of assets.querySelectorAll(".asset.selected")) {
		asset.classList.remove("selected");
	}
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
		const asset = appendAssetFile(file);
		asset.classList.add("selected");
		if(i === 0) {
			proj[sel].selectedAsset = asset.id;
		}
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
const selectAsset = (target, evtButton) => {
	setActive(assets);
	if(typeof evtButton !== "number") {
		evtButton = 0;
	}
	if(evtButton === 2 && !(superKey || shiftKey)) {
		if(!target.classList.contains("selected")) {
			for(const asset of assets.querySelectorAll(".asset.selected")) {
				if(asset !== target) {
					asset.classList.remove("selected");
				}
			}
			target.classList.add("selected");
			proj[sel].selectedAsset = target.id;
		}
	} else if(shiftKey) {
		let selecting = !proj[sel].selectedAsset;
		const classListMethod = superKey && proj[sel].selectedAsset && !assets.querySelector(`#${proj[sel].selectedAsset}`).classList.contains("selected") ? "remove" : "add";
		for(const asset of assets.children) {
			if(asset.id === proj[sel].selectedAsset || asset.id === target.id) {
				if(selecting) {
					asset.classList[classListMethod]("selected");
					selecting = false;
					continue;
				} else {
					asset.classList[classListMethod]("selected");
					if(proj[sel].selectedAsset !== target.id) {
						selecting = true;
					}
				}
			} else if(selecting) {
				asset.classList[classListMethod]("selected");
			} else if(!superKey) {
				asset.classList.remove("selected");
			}
		}
	} else {
		proj[sel].selectedAsset = target.id;
		if(superKey) {
			target.classList.toggle("selected");
		} else {
			let othersSelected = false;
			for(const asset of assets.querySelectorAll(".asset.selected")) {
				if(asset !== target) {
					othersSelected = true;
					asset.classList.remove("selected");
				}
			}
			if(target.classList[othersSelected ? "add" : "toggle"]("selected") === false) {
				proj[sel].selectedAsset = null;
			}
		}
	}
};
let mouseX = 0;
let mouseY = 0;
let mouseTarget;
let mouseTarget0;
let mouseTarget2;
let mouseDown = -1;
let mouseMoved = false;
let mouseUp = 0;
let initialTargetPos;
let targetOffset;
const onMouseDown = evt => {
	if(mouseDown !== -1) {
		onMouseUp(evt);
	}
	mouseDown = evt.button;
	mouseMoved = false;
	mouseX = evt.clientX;
	mouseY = evt.clientY;
	mouseTarget = evt.target;
	if(evt.button === 0) {
		mouseTarget0 = evt.target;
	} else if(evt.button === 2) {
		mouseTarget2 = evt.target;
	}
	if(mouseTarget !== ctxMenu) {
		if(!ctxMenu.classList.contains("hidden")) {
			if(mouseTarget0 && ctxMenu.contains(mouseTarget0)) {
				const targetAsset = ctxTarget.classList.contains("asset");
				if(ctxTarget === assets || targetAsset) {
					if(targetAsset) {
						mouseTarget0[_index] -= 2;
					}
					if(mouseTarget0[_index] === -2) {
						confirmRemoveAssets(assets.querySelectorAll(".asset.selected"));
					} else if(mouseTarget0[_index] === -1) {
						// TODO
					} else if(mouseTarget0[_index] === 0) {
						// TODO
					} else if(mouseTarget0[_index] === 1) {
						// TODO
					} else if(mouseTarget0[_index] === 2) {
						assetInput.accept = "image/*";
						assetInput.click();
					} else if(mouseTarget0[_index] === 3) {
						assetInput.accept = "audio/*";
						assetInput.click();
					}
				}
				closeCtx();
				return;
			}
			closeCtx();
		}
		if(mouseTarget.classList.contains("asset")) {
			proj[sel].focusedAsset = mouseTarget.id;
		} else if(evt.button === 0) {
			if(mouseTarget0.classList.contains("tab")) {
				if(mouseTarget0 === homeTab) {
					select("home");
				} else {
					select(mouseTarget0[_proj].id);
					const prevTabPos = mouseTarget0.offsetLeft;
					targetOffset = evt.clientX - prevTabPos;
					mouseTarget0.style.left = "";
					mouseTarget0.style.left = `${prevTabPos - (initialTargetPos = mouseTarget0.offsetLeft)}px`;
					for(let i = 1; i < tabs.children.length; i++) {
						tabs.children[i].classList[tabs.children[i] === mouseTarget0 ? "remove" : "add"]("smooth");
					}
				}
			} else if(mouseTarget0.classList.contains("handle")) {
				initialTargetPos = mouseTarget0.parentNode[mouseTarget0.classList.contains("horizontal") ? "offsetWidth" : "offsetHeight"];
				if(mouseTarget0.parentNode === assetContainer) {
					targetOffset = mouseTarget0.parentNode.offsetWidth - evt.clientX;
				} else if(mouseTarget0.parentNode === propertyContainer) {
					targetOffset = evt.clientX - mouseTarget0.parentNode.offsetLeft;
				} else if(mouseTarget0.parentNode === timelineContainer) {
					targetOffset = evt.clientY - mouseTarget0.parentNode.offsetTop;
				}
			}
		}
	}
};
window.addEventListener("mousedown", onMouseDown);
window.addEventListener("mousemove", evt => {
	if(evt.clientX === mouseX && evt.clientY === mouseY) {
		return;
	}
	mouseX = evt.clientX;
	mouseY = evt.clientY;
	if(mouseDown === -1) {
		return;
	}
	if(mouseTarget0) {
		if(mouseTarget0.classList.contains("asset")) {
			if(!mouseMoved) {
				selectAsset(mouseTarget0, 2);
			}
			// TODO
		} else if(mouseTarget0.classList.contains("tab")) {
			if(mouseTarget0 !== homeTab) {
				mouseTarget0.style.left = `${evt.clientX - initialTargetPos - targetOffset}px`;
				const tabWidth = mouseTarget0.offsetWidth + 1;
				let afterTarget = false;
				for(let i = 1; i < tabs.children.length; i++) {
					if(tabs.children[i] === mouseTarget0) {
						afterTarget = true;
					} else {
						if(afterTarget) {
							if(mouseTarget0.offsetLeft >= homeTab.offsetWidth + 1 + (i - 1.5) * tabWidth) {
								if(!tabs.children[i].style.left) {
									tabs.children[i].style.left = `-${tabWidth}px`;
								}
							} else if(tabs.children[i].style.left) {
								tabs.children[i].style.left = "";
							}
						} else {
							if(mouseTarget0.offsetLeft <= homeTab.offsetWidth + 1 + (i - 0.5) * tabWidth) {
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
		} else if(mouseTarget0.classList.contains("handle")) {
			let value = targetOffset;
			if(mouseTarget0.parentNode === assetContainer) {
				value += evt.clientX;
			} else if(mouseTarget0.parentNode === propertyContainer) {
				value += document.body.offsetWidth - evt.clientX;
			} else if(mouseTarget0.parentNode === timelineContainer) {
				value += document.body.offsetHeight - evt.clientY;
			}
			const horizontalTarget = mouseTarget0.classList.contains("horizontal");
			mouseTarget0.parentNode.style[horizontalTarget ? "width" : "height"] = `${storage.containerSizes[mouseTarget0.parentNode.id] = Math.max(185, value)}px`;
			if(!horizontalTarget) {
				mouseTarget0.parentNode.style.minHeight = mouseTarget0.parentNode.style.height;
			}
		}
	}
	mouseMoved = true;
});
let originalMouseTarget;
const makeTabRough = () => {
	originalMouseTarget.classList.remove("smooth");
};
const resetTabPos = () => {
	originalMouseTarget.style.left = "";
	setTimeout(makeTabRough, 150);
};
const handleMouseUp = (evt, evtButton) => {
	mouseX = evt.clientX;
	mouseY = evt.clientY;
	if(mouseDown === -1) {
		return;
	}
	const evtButton0 = evtButton === 0;
	const evtButton2 = evtButton === 2;
	if(mouseTarget && (evtButton0 || evtButton2)) {
		if(mouseTarget === assets || assets.contains(mouseTarget)) {
			if(!mouseMoved && evtButton === mouseDown) {
				setActive(assets);
				if(mouseTarget === assets && mouseX < assets.offsetLeft + assets.scrollWidth) {
					for(const asset of assets.querySelectorAll(".asset.selected")) {
						asset.classList.remove("selected");
					}
					proj[sel].selectedAsset = null;
				} else if(mouseTarget.classList.contains("asset")) {
					selectAsset(mouseTarget, evtButton);
				} else if(mouseTarget0.classList.contains("close") && mouseTarget0.parentNode.classList.contains("asset")) {
					confirmRemoveAsset(mouseTarget0.parentNode);
				}
			}
		} else if(evtButton0) {
			if(mouseTarget0) {
				if(mouseTarget0.classList.contains("tab")) {
					if(mouseTarget0 !== homeTab) {
						let afterTarget = false;
						let shifted;
						let shiftedAfterTarget = 2;
						for(let i = 1; i < tabs.children.length; i++) {
							if(tabs.children[i] === mouseTarget0) {
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
						const tabWidth = mouseTarget0.offsetWidth + 1;
						if(shifted) {
							const newPos = homeTab.offsetWidth + 1 + (shifted - shiftedAfterTarget) * tabWidth;
							mouseTarget0.style.left = `${mouseTarget0.offsetLeft - newPos}px`;
							for(let i = 1; i < tabs.children.length; i++) {
								if(tabs.children[i] !== mouseTarget0) {
									tabs.children[i].classList.remove("smooth");
									tabs.children[i].style.left = "";
								}
							}
							tabs.insertBefore(mouseTarget0, tabs.children[shifted]);
						}
						(originalMouseTarget = mouseTarget0).classList.add("smooth");
						setTimeout(resetTabPos);
					}
				} else if(mouseTarget0.classList.contains("handle")) {
					store();
				} else if(evt.target === mouseTarget0) {
					if(mouseTarget0.parentNode === windowActions) {
						if(mouseTarget0 === minimizeWindow) {
							win.minimize();
						} else if(mouseTarget0 === maximizeWindow) {
							if(win.isMaximized()) {
								win.unmaximize();
							} else {
								win.maximize();
							}
						} else if(mouseTarget0 === closeWindow) {
							win.close();
						}
					} else if(mouseTarget0.parentNode === toolbar) {
						if(mouseTarget0 === newProj) {
							new Project();
						} else if(mouseTarget0 === openProj) {
							open();
						} else if(mouseTarget0 === saveProj) {
							save();
						} else if(mouseTarget0 === saveProjAs) {
							save(true);
						} else if(mouseTarget0 === exportProj) {
							// TODO
						}
					} else if(mouseTarget0 === addAsset) {
						openCtx(assets);
					} else if(mouseTarget0.classList.contains("close") && mouseTarget0.parentNode.classList.contains("tab")) {
						mouseTarget0.parentNode[_proj].close();
					}
				}
			}
		}
		if(evtButton2 && evt.target === mouseTarget2 && mouseTarget2 !== ctxMenu && !ctxMenu.contains(mouseTarget2)) {
			openCtx(mouseTarget2);
		}
	}
};
const onMouseUp = evt => {
	handleMouseUp(evt, 0);
	handleMouseUp(evt, 1);
	handleMouseUp(evt, 2);
	mouseTarget0 = null;
	mouseTarget2 = null;
	mouseDown = -1;
	mouseUp = Date.now();
};
window.addEventListener("mouseup", onMouseUp);
window.addEventListener("click", evt => {
	if(Date.now() - mouseUp > 1) {
		onMouseDown(evt);
		onMouseUp(evt);
	}
});
window.addEventListener("dblclick", evt => {
	if(!mouseMoved) {
		if(evt.target === tabs) {
			new Project();
		} else if(evt.target.classList.contains("handle")) {
			evt.target.parentNode.style.width = evt.target.parentNode.style.height = evt.target.parentNode.style.minWidth = evt.target.parentNode.style.minHeight = "";
			delete storage.containerSizes[evt.target.parentNode.id];
			store();
		}
	}
});
const focused = () => !(document.querySelector(".mdc-dialog") || document.body.classList.contains("indeterminate") || document.body.classList.contains("loading"));
window.addEventListener("keydown", evt => {
	superKey = evt.metaKey || evt.ctrlKey;
	altKey = evt.altKey;
	shiftKey = evt.shiftKey;
	if(evt.keyCode === 38) { // `up`
		if(!ctxMenu.classList.contains("hidden")) {
			const buttons = ctxMenu.querySelectorAll("button");
			const focused = ctxMenu.querySelector("button:focus");
			buttons[focused ? (Array.prototype.indexOf.call(buttons, focused) || buttons.length) - 1 : 0].focus();
		} else if(focused() && assets.classList.contains("active")) {
			evt.preventDefault();
			const allAssets = assets.querySelectorAll(".asset");
			const asset = allAssets[proj[sel].focusedAsset ? ((Array.prototype.indexOf.call(allAssets, document.querySelector(`#${proj[sel].focusedAsset}`)) || allAssets.length) - 1) : 0];
			if(!superKey) {
				selectAsset(asset);
			}
			proj[sel].focusedAsset = asset.id;
		}
	} else if(evt.keyCode === 40) { // `down`
		if(!ctxMenu.classList.contains("hidden")) {
			const buttons = ctxMenu.querySelectorAll("button");
			const focused = ctxMenu.querySelector("button:focus");
			buttons[((focused ? Array.prototype.indexOf.call(buttons, focused) : -1) + 1) % buttons.length].focus();
		} else if(focused() && assets.classList.contains("active")) {
			evt.preventDefault();
			const allAssets = assets.querySelectorAll(".asset");
			const asset = allAssets[((proj[sel].focusedAsset ? Array.prototype.indexOf.call(allAssets, document.querySelector(`#${proj[sel].focusedAsset}`)) : -1) + 1) % allAssets.length];
			if(!superKey) {
				selectAsset(asset);
			}
			proj[sel].focusedAsset = asset.id;
		}
	} else if(superKey) {
		if((shiftKey && evt.keyCode === 9) || (!shiftKey && evt.keyCode === 33)) { // ^`shift`+`tab` || ^`page up`
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
		} else if(shiftKey) {
			if(evt.keyCode === 73) { // ^`shift`+`I`
				win.toggleDevTools();
			} else if(evt.keyCode === 83) { // ^`shift`+`S`
				if(focused()) {
					save(true);
				}
			}
		} else if(evt.keyCode === 9 || evt.keyCode === 34) { // ^`tab` || ^`page down`
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
		} else if(evt.keyCode === 57) { // ^`9`
			if(focused()) {
				if(Object.keys(proj).length) {
					select(tabs.lastElementChild[_proj].id);
				}
			}
		} else if(evt.keyCode === 65) { // ^`A`
			if(focused() && assets.classList.contains("active")) {
				for(const asset of assets.querySelectorAll(".asset:not(.selected)")) {
					asset.classList.add("selected");
				}
			}
		} else if(evt.keyCode === 78 || evt.keyCode === 84) { // ^`N` || ^`T`
			if(focused()) {
				new Project();
			}
		} else if(evt.keyCode === 79) { // ^`O`
			if(focused()) {
				open();
			}
		} else if(evt.keyCode === 83) { // ^`S`
			if(focused()) {
				save();
			}
		} else if(evt.keyCode === 87 || evt.keyCode === 115) { // ^`W` || ^`F4`
			if(focused()) {
				if(proj[sel]) {
					proj[sel].close();
				} else {
					win.close();
				}
			}
		} else if(evt.keyCode >= 49 && evt.keyCode <= 56) { // ^`1`-`8`
			if(focused()) {
				if(Object.keys(proj).length) {
					select((tabs.children[evt.keyCode - 48] || tabs.lastElementChild)[_proj].id);
				}
			}
		}
	} else if(altKey) {
		if(focused()) {
			if(evt.keyCode === 36) { // `alt`+`home`
				select("home");
			}
		}
	} else if(evt.keyCode === 8 || evt.keyCode === 46) { // `backspace` || `delete`
		if(focused() && assets.classList.contains("active")) {
			confirmRemoveAssets(assets.querySelectorAll(".asset.selected"));
		}
	} else if(evt.keyCode === 27) { // `esc`
		if(!ctxMenu.classList.contains("hidden")) {
			closeCtx();
		} else if(focused() && assets.classList.contains("active")) {
			proj[sel].selectedAsset = null;
			for(const asset of assets.querySelectorAll(".asset.selected")) {
				asset.classList.remove("selected");
			}
		}
	} else if(evt.keyCode === 122) { // `F11`
		const fullScreen = !win.isFullScreen();
		win.setFullScreen(fullScreen);
		titleBar.classList[fullScreen ? "add" : "remove"]("hidden");
	}
});
window.addEventListener("keyup", evt => {
	shiftKey = evt.keyCode !== 16 && evt.shiftKey;
	superKey = !(evt.keyCode === 17 || evt.keyCode === 91) && (evt.ctrlKey || evt.metaKey);
	altKey = evt.keyCode !== 18 && evt.altKey;
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
