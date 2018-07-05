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
		hideFullPreview();
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
const assetHead = assetContainer.querySelector(".head");
const addAsset = assetHead.querySelector("#addAsset");
const sortAssets = assetHead.querySelector("#sortAssets");
const assets = assetContainer.querySelector("#assets");
const assetDrag = assets.querySelector("#assetDrag");
const content = container.querySelector("#content");
const timelineContainer = container.querySelector("#timelineContainer");
const assetPath = timelineContainer.querySelector("#assetPath");
const propertyContainer = container.querySelector("#propertyContainer");
const properties = container.querySelector("#properties");
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
win.setProgressBar(-1);
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
if(typeof storage.defaultCanvasWidth !== "number") {
	storage.defaultCanvasWidth = 650;
}
if(typeof storage.defaultCanvasHeight !== "number") {
	storage.defaultCanvasHeight = 450;
}
store();
const scrollIntoView = elem => {
	if(elem.offsetTop < elem.parentNode.scrollTop) {
		elem.parentNode.scrollTop = elem.offsetTop;
	} else if(elem.offsetTop + elem.offsetHeight > elem.parentNode.scrollTop + elem.parentNode.offsetHeight) {
		elem.parentNode.scrollTop = elem.offsetTop + elem.offsetHeight - elem.parentNode.offsetHeight;
	}
};
const propElems = properties.querySelectorAll(".property");
const prop = {};
for(const propElem of propElems) {
	prop[propElem.getAttribute("data-property")] = propElem;
}
const previewImage = prop.preview.querySelector("img");
const previewAudio = prop.preview.querySelector("audio");
const fullPreview = container.querySelector("#fullPreview");
const fullPreviewImage = fullPreview.querySelector("img");
const makeFullPreviewHidden = fullPreview.classList.add.bind(fullPreview.classList, "hidden");
const hideFullPreview = () => {
	setActive();
	fullPreview.classList.remove("opaque");
	setTimeout(makeFullPreviewHidden, 150);
};
const absoluteCenter = elem => {
	setActive(fullPreview);
	elem.style.left = `${Math.max(0, (elem.parentNode.offsetWidth === elem.parentNode.scrollWidth ? elem.parentNode.offsetWidth : elem.parentNode.offsetWidth - 12) / 2 - elem.offsetWidth / 2)}px`;
	elem.style.top = `${Math.max(0, (elem.parentNode.offsetHeight === elem.parentNode.scrollHeight ? elem.parentNode.offsetHeight : elem.parentNode.offsetHeight - 12) / 2 - elem.offsetHeight / 2)}px`;
};
const makeFullPreviewOpaque = () => {
	fullPreview.classList.add("opaque");
};
fullPreview.addEventListener("mousemove", evt => {
	fullPreview.classList.remove("hoverScrollbar");
	let targetRect;
	let setHoverScrollbar = false;
	if(fullPreview.offsetHeight !== fullPreview.scrollHeight && mouseX >= (targetRect = fullPreview.getBoundingClientRect()).left + targetRect.width - 12) {
		setHoverScrollbar = true;
		fullPreview.classList.add("hoverScrollbar");
	}
	if(!setHoverScrollbar && fullPreview.offsetWidth !== fullPreview.scrollWidth && mouseY >= (targetRect = fullPreview.getBoundingClientRect()).top + targetRect.height - 12) {
		fullPreview.classList.add("hoverScrollbar");
	}
});
const updateProperties = () => {
	for(const propElem of propElems) {
		propElem.classList.add("hidden");
	}
	previewImage.classList.add("hidden");
	previewAudio.classList.add("hidden");
	previewImage.src = previewAudio.src = "";
	const assetElems = assets.querySelectorAll(".asset.selected");
	if(assetElems.length) {
		if(assetElems.length === 1) {
			prop.name.elements[0].value = assetElems[0][_asset].name;
			prop.name.elements[0].labels[0].classList.add("mdc-floating-label--float-above");
			prop.name.classList.remove("hidden");
		}
		let typeGroup = false;
		let typeObj = false;
		let typeFile = false;
		for(const assetElem of assetElems) {
			if(assetElem[_asset].type === "group") {
				typeGroup = true;
			} else if(assetElem[_asset].type === "obj") {
				typeObj = true;
			} else if(assetElem[_asset].type === "file") {
				typeFile = true;
			}
		}
		if(!typeGroup && !typeObj && typeFile) {
			let mime = assetElems[0][_asset].mime;
			for(let i = 1; i < assetElems.length; i++) {
				if(assetElems[i][_asset].mime !== mime) {
					mime = false;
					break;
				}
			}
			prop.mime.classList.remove("hidden");
			prop.mime.elements[0].value = mime || "< mixed >";
			if(mime) {
				const previewMedia = mime.startsWith("image/") ? previewImage : previewAudio;
				previewMedia.src = assetElems[0][_asset].url;
				previewMedia.classList.remove("hidden");
				prop.preview.classList.remove("hidden");
			}
		}
	} else {
		prop.canvasSize.classList.remove("hidden");
	}
};
const menuSeparator = {
	type: "separator"
};
const textMenu = electron.remote.Menu.buildFromTemplate([{
	label: "Undo",
	accelerator: "CmdOrCtrl+Z",
	role: "undo"
}, {
	label: "Redo",
	accelerator: "CmdOrCtrl+Shift+Z",
	role: "redo"
}, {
	type: "separator"
}, {
	label: "Cut",
	accelerator: "CmdOrCtrl+X",
	role: "cut"
}, {
	label: "Copy",
	accelerator: "CmdOrCtrl+C",
	role: "copy"
}, {
	label: "Paste",
	accelerator: "CmdOrCtrl+V",
	role: "paste"
}, {
	label: "Select all",
	accelerator: "CmdOrCtrl+A",
	role: "selectall"
}]);
const assetMenuItems = [{
	label: "Create object",
	click: () => {
		let assetParent = assets;
		if(ctxTarget && ctxTarget.classList.contains("assetBar")) {
			if(ctxTarget.parentNode[_asset].type === "group") {
				assetParent = ctxTarget.parentNode.lastElementChild;
			} else if(ctxTarget.parentNode[_asset].parent) {
				assetParent = getAssetElemByID(ctxTarget.parentNode[_asset].parent).lastElementChild;
			}
		}
		setActive(assetContainer);
		for(const assetElem of assets.querySelectorAll(".asset.selected")) {
			assetElem.classList.remove("selected");
		}
		const names = proj[sel].data.assets.map(byLowerCaseName);
		let name = "Object";
		for(let i = 2; names.includes(name.toLowerCase()); i++) {
			name = `Object ${i}`;
		}
		const asset = new Asset({
			type: "obj",
			name
		});
		proj[sel].data.assets.push(asset);
		const assetObj = appendAsset(asset);
		assetParent.appendChild(assetObj);
		storeAssets();
		assetObj.classList.add("selected");
		proj[sel].selectedAsset = assetObj.id;
		updateProperties();
	}
}, {
	label: "Create group",
	click: () => {
		setActive(assetContainer);
		const assetElems = assets.querySelectorAll(".asset.selected");
		for(const assetElem of assetElems) {
			assetElem.classList.remove("selected");
		}
		const names = proj[sel].data.assets.map(byLowerCaseName);
		let name = "Group";
		for(let i = 2; names.includes(name.toLowerCase()); i++) {
			name = `Group ${i}`;
		}
		const asset = new Asset({
			type: "group",
			name
		});
		proj[sel].data.assets.push(asset);
		const assetGroup = appendAsset(asset);
		if(ctxTarget.classList.contains("assetBar")) {
			ctxTarget.parentNode.before(assetGroup);
			assetElems.forEach(assetGroup.lastElementChild.appendChild.bind(assetGroup.lastElementChild));
		}
		assetGroup.classList.add("open");
		storeAssets();
		assetGroup.classList.add("selected");
		proj[sel].selectedAsset = assetGroup.id;
		updateProperties();
	}
}, {
	label: "Import image file(s)",
	click: () => {
		assetInput.accept = "image/*";
		win.webContents.executeJavaScript("assetInput.click()", true);
	}
}, {
	label: "Import audio file(s)",
	click: () => {
		assetInput.accept = "audio/*";
		win.webContents.executeJavaScript("assetInput.click()", true);
	}
}];
const assetMenu = electron.remote.Menu.buildFromTemplate(assetMenuItems);
const removeSelectedAssets = () => {
	confirmRemoveAssets(assets.querySelectorAll(".asset.selected"));
};
const selectedAssetMenu = electron.remote.Menu.buildFromTemplate([{
	label: "Remove asset",
	click: removeSelectedAssets
}, {
	label: "Rename asset",
	accelerator: "F2",
	click: prop.name.elements[0].select.bind(prop.name.elements[0])
}, menuSeparator, ...assetMenuItems]);
const selectedAssetsMenu = electron.remote.Menu.buildFromTemplate([{
	label: "Remove assets",
	click: removeSelectedAssets
}, {
	label: "Rename asset",
	accelerator: "F2",
	enabled: false
}, menuSeparator, ...assetMenuItems]);
const sortAssetsMenu = electron.remote.Menu.buildFromTemplate([{
	label: "Sort by asset type",
	click: () => {
		for(const assetChildren of [assets, ...assets.querySelectorAll(".assetChildren")]) {
			const assetElems = Array.prototype.filter.call(assetChildren.children, byAssets);
			let afterGroup = null;
			let afterObj = null;
			let afterImage = null;
			for(const assetElem of assetElems) {
				if(assetElem[_asset].type === "obj") {
					if(!afterGroup) {
						afterGroup = assetElem;
					}
				} else if(assetElem[_asset].type === "file") {
					if(assetElem[_asset].mime.startsWith("image/")) {
						if(!afterObj) {
							afterObj = assetElem;
						}
					} else {
						if(!afterImage) {
							afterImage = assetElem;
						}
					}
				}
			}
			if(!afterObj) {
				afterObj = afterImage;
			}
			if(!afterGroup) {
				afterGroup = afterObj;
			}
			for(const assetElem of assetElems) {
				if(assetElem[_asset].type === "group") {
					assetChildren.insertBefore(assetElem, afterGroup);
				} else if(assetElem[_asset].type === "obj") {
					assetChildren.insertBefore(assetElem, afterObj);
				} else if(assetElem[_asset].type === "file") {
					if(assetElem[_asset].mime.startsWith("image/")) {
						assetChildren.insertBefore(assetElem, afterImage);
					} else {
						assetChildren.appendChild(assetElem);
					}
				}
			}
		}
		storeAssets();
	}
}, {
	label: "Sort alphabetically",
	click: () => {
		for(const assetChildren of [assets, ...assets.querySelectorAll(".assetChildren")]) {
			const assetElems = Array.prototype.filter.call(assetChildren.children, byAssets);
			for(const name of assetElems.map(assetElemsAlphabetically).sort()) {
				assetChildren.lastChild.after(assetElems.find(assetElem => assetElem[_asset].name.toLowerCase() === name.slice(name.indexOf(" ") + 1)));
			}
		}
		storeAssets();
	}
}, {
	label: "Reverse",
	click: () => {
		for(const assetElem of assets.querySelectorAll(".asset")) {
			assetElem.parentNode.firstChild.before(assetElem);
		}
		storeAssets();
	}
}]);
let ctxTarget;
const openCtx = target => {
	ctxTarget = target;
	const items = [];
	const targetAsset = ctxTarget.classList.contains("assetBar");
	if(ctxTarget === assets) {
		assetMenu.popup(win);
	} else if(targetAsset) {
		if(assets.querySelectorAll(".asset.selected").length === 1) {
			selectedAssetMenu.popup(win);
		} else {
			selectedAssetsMenu.popup(win);
		}
	} else if(ctxTarget === sortAssets) {
		sortAssetsMenu.popup(win);
	} else if((ctxTarget instanceof HTMLInputElement && ctxTarget.type !== "button" && ctxTarget.type !== "submit" && ctxTarget.type !== "reset") || ctxTarget instanceof HTMLTextAreaElement) {
		textMenu.popup(win);
	}
};
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
	constructor(projectData) {
		if(!(projectData instanceof Object)) {
			projectData = {};
		}
		const validLocation = typeof projectData.location === "string";
		if(typeof projectData.name === "string") {
			this[_name] = projectData.name;
		} else if(!validLocation) {
			const projects = Object.values(proj);
			let i = 0;
			do {
				this[_name] = `Project ${++i}`;
			} while(projects.some(project => project.name === this[_name]));
		}
		tabs.appendChild(this.tab = html`
			<div class="tab${(this[_saved] = !!projectData.saved) ? " saved" : ""}">
				<div class="label">$${this[_name]}</div>
				<div class="close material-icons"></div>
			</div>
		`);
		this.tab[_proj] = this;
		this.location = validLocation ? projectData.location : null;
		this.data = projectData.data || {
			...baseData,
			assets: []
		};
		this.selected = [];
		this.open = [];
		const id = String(++projID);
		(proj[id] = this).id = id;
		select(id);
		for(const assetElem of assets.querySelectorAll(".asset.group")) {
			assetElem.classList.add("open");
		}
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
		for(const assetElem of assets.querySelectorAll(".asset.focus")) {
			assetElem.classList.remove("focus");
		}
		if(this[_focusedAsset] = value) {
			const assetElem = assets.querySelector(`#${value}`);
			assetElem.classList.add("focus");
			scrollIntoView(assetElem);
		}
	}
}
const _asset = Symbol("asset");
const getAssetElemByID = id => assets.querySelector(`#asset_${id}`);
class Asset {
	constructor(assetData) {
		if(!(assetData instanceof Object)) {
			throw new MiroError("The `assetData` parameter must be an object.");
		}
		this.type = assetData.type;
		this[_name] = assetData.name;
		if(this.type === "file") {
			if(!assetData.mime.startsWith("image/") && !assetData.mime.startsWith("audio/")) {
				throw new MiroError("The `mime` value is invalid.");
			}
			this.mime = assetData.mime;
			this.data = assetData.data;
		} else if(this.type !== "group" && this.type !== "obj") {
			throw new MiroError("The `type` value is invalid.");
		}
		if(assetData.parent) {
			this.parent = assetData.parent;
		}
		this.id = assetData.id || uid(proj[sel].data.assets.map(byID));
	}
	get name() {
		return this[_name];
	}
	set name(value) {
		this[_name] = value;
		const assetElem = getAssetElemByID(this.id);
		if(assetElem) {
			assetElem.querySelector(".label").textContent = assetElem.title = value;
		}
	}
	toJSON() {
		return {
			...this,
			name: this.name
		};
	}
	get url() {
		if(this.type === "file") {
			return `data:${this.mime};base64,${this.data}`;
		}
	}
}
const appendAsset = asset => {
	let assetElem;
	if(asset.type === "group") {
		assetElem = html`
			<div id="asset_${asset.id}" class="asset group" title="$${asset.name}">
				<div class="assetBar">
					<div class="icon material-icons"></div>
					<div class="label">$${asset.name}</div>
					<div class="close material-icons"></div>
				</div>
				<div class="assetChildren"></div>
			</div>
		`;
	} else if(asset.type === "file") {
		assetElem = html`
			<div id="asset_${asset.id}" class="asset file" title="$${asset.name}">
				<div class="assetBar">
					<div class="icon material-icons">${asset.mime.startsWith("image/") ? "image" : "audiotrack"}</div>
					<div class="label">$${asset.name}</div>
					<div class="close material-icons"></div>
				</div>
			</div>
		`;
	} else if(asset.type === "obj") {
		assetElem = html`
			<div id="asset_${asset.id}" class="asset obj" title="$${asset.name}">
				<div class="assetBar">
					<div class="icon material-icons">widgets</div>
					<div class="label">$${asset.name}</div>
					<div class="close material-icons"></div>
				</div>
			</div>
		`;
	}
	assetElem[_asset] = asset;
	(assetElem[_asset].parent ? getAssetElemByID(assetElem[_asset].parent).lastElementChild : assets).appendChild(assetElem);
	return assetElem;
};
const storeAssets = () => {
	proj[sel].data.assets = [];
	for(const assetElem of assets.querySelectorAll(".asset")) {
		if(assetElem.parentNode === assets) {
			delete assetElem[_asset].parent;
		} else {
			assetElem[_asset].parent = assetElem.parentNode.parentNode[_asset].id;
		}
		proj[sel].data.assets.push(assetElem[_asset]);
	}
	proj[sel].saved = false;
};
const removeAsset = assetElem => {
	if(`asset_${assetElem[_asset].id}` === proj[sel].selectedAsset) {
		proj[sel].selectedAsset = null;
	}
	if(assetElem[_asset].type === "group") {
		assetElem.lastElementChild.children.forEach(assetElem.before.bind(assetElem));
	}
	assetElem.remove();
	updateProperties();
};
const confirmRemoveAsset = assetElem => {
	const actuallyRemoveAsset = value => {
		if(value === 0) {
			removeAsset(assetElem);
			storeAssets();
		}
	};
	if(assetElem[_asset].type === "file" || assetElem[_asset].type === "obj") {
		new Miro.dialog("Remove Asset", html`
			Are you sure you want to remove <span class="bold">${assetElem[_asset].name}</span>?<br>
			This cannot be undone.
		`, ["Yes", "No"]).then(actuallyRemoveAsset);
	} else if(assetElem[_asset].type === "group") {
		new Miro.dialog("Remove Group", html`
			Are you sure you want to remove <span class="bold">${assetElem[_asset].name}</span>?<br>
			All assets inside the group will be taken out.
		`, ["Yes", "No"]).then(actuallyRemoveAsset);
	}
};
const confirmRemoveAssets = assetElems => {
	if(assetElems.length === 1) {
		confirmRemoveAsset(assetElems[0]);
	} else if(assetElems.length > 1) {
		new Miro.dialog("Remove Assets", html`
			Are you sure you want to remove all those assets?<br>
			This cannot be undone.
		`, ["Yes", "No"]).then(value => {
			if(value === 0) {
				assetElems.forEach(removeAsset);
				storeAssets();
			}
		});
	}
};
const toggleAssetGroup = assetGroup => {
	if(!assetGroup.classList.toggle("open")) {
		for(const assetElem of assetGroup.querySelectorAll(".asset.selected")) {
			assetElem.classList.remove("selected");
		}
	}
	proj[sel].selectedAsset = null;
	updateProperties();
}
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
		proj[sel].open = [];
		for(const assetElem of assets.querySelectorAll(".asset")) {
			if(assetElem.classList.contains("selected")) {
				proj[sel].selected.push(assetElem.id);
			}
			if(assetElem.classList.contains("open")) {
				proj[sel].open.push(assetElem.id);
			}
			assetElem.remove();
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
		proj[sel].data.assets.forEach(appendAsset);
		for(const id of proj[sel].selected) {
			projectPage.querySelector(`#${id}`).classList.add("selected");
		}
		for(const id of proj[sel].open) {
			projectPage.querySelector(`#${id}`).classList.add("open");
		}
		if(proj[sel].focusedAsset) {
			assets.querySelector(`#${proj[sel].focusedAsset}`).classList.add("focus");
		}
		rootAsset(proj[sel].rootAsset ? getAssetElemByID(proj[sel].rootAsset)[_asset] : null);
		openAsset(proj[sel].openAsset ? getAssetElemByID(proj[sel].openAsset)[_asset] : null);
		saveProj.disabled = proj[sel].saved;
		updateProperties();
		proj[sel].tab.classList.add("current");
		projectPage.classList.remove("hidden");
		assets.scrollTop = proj[sel].scrollAssets;
		content.style.width = `${prop.canvasSize.elements[0].value = proj[sel].data.width || storage.defaultCanvasWidth}px`;
		content.style.height = `${prop.canvasSize.elements[1].value = proj[sel].data.height || storage.defaultCanvasHeight}px`;
		absoluteCenter(content);
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
	tabs.classList[classListMethod]("intangible");
	toolbar.classList[classListMethod]("intangible");
	projectPage.classList[classListMethod]("intangible");
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
	const active = container.querySelector(".active");
	if(active) {
		active.classList.remove("active");
	}
	if(elem) {
		elem.classList.add("active");
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
		loadProgress(0);
		for(let i = 0; i < data.assets.length; i++) {
			loadProgress(i / data.assets.length);
			try {
				if((data.assets[i] = new Asset(data.assets[i])).type === "file") {
					await new Promise((resolve, reject) => {
						const media = new (data.assets[i].mime.startsWith("image/") ? Image : Audio)();
						media.src = data.assets[i].url;
						media.addEventListener("load", resolve);
						media.addEventListener("error", reject);
					});
				}
			} catch(err) {
				new Miro.dialog("Error", html`
					<span class="bold">${data.assets[i].name}</span> is not a valid asset.
				`);
			}
		}
		loadProgress(1);
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
const selectAsset = (target, evtButton) => {
	setActive(assetContainer);
	if(typeof evtButton !== "number") {
		evtButton = 0;
	}
	if(evtButton === 2 && !(superKey || shiftKey)) {
		if(!target.classList.contains("selected")) {
			for(const assetElem of assets.querySelectorAll(".asset.selected")) {
				if(assetElem !== target) {
					assetElem.classList.remove("selected");
				}
			}
			target.classList.add("selected");
			proj[sel].selectedAsset = target.id;
		}
	} else if(shiftKey) {
		let selecting = !proj[sel].selectedAsset;
		const classListMethod = superKey && proj[sel].selectedAsset && !assets.querySelector(`#${proj[sel].selectedAsset}`).classList.contains("selected") ? "remove" : "add";
		for(const assetElem of assets.querySelectorAll(".asset")) {
			if(assetElem.id === proj[sel].selectedAsset || assetElem.id === target.id) {
				if(selecting) {
					assetElem.classList[classListMethod]("selected");
					selecting = false;
					continue;
				} else {
					assetElem.classList[classListMethod]("selected");
					if(proj[sel].selectedAsset !== target.id) {
						selecting = true;
					}
				}
			} else if(selecting) {
				assetElem.classList[classListMethod]("selected");
			} else if(!superKey) {
				assetElem.classList.remove("selected");
			}
		}
	} else {
		proj[sel].selectedAsset = target.id;
		if(superKey) {
			target.classList.toggle("selected");
		} else {
			let othersSelected = false;
			for(const assetElem of assets.querySelectorAll(".asset.selected")) {
				if(assetElem !== target) {
					othersSelected = true;
					assetElem.classList.remove("selected");
				}
			}
			if(target.classList[othersSelected ? "add" : "toggle"]("selected") === false) {
				proj[sel].selectedAsset = null;
			}
		}
	}
	updateProperties();
};
const byLowerCaseName = asset => asset.name.toLowerCase();
const byID = asset => asset.id;
const addFiles = async files => {
	let assetParent = assets;
	if(ctxTarget && ctxTarget.classList.contains("assetBar")) {
		if(ctxTarget.parentNode[_asset].type === "group") {
			assetParent = ctxTarget.parentNode.lastElementChild;
		} else if(ctxTarget.parentNode[_asset].parent) {
			assetParent = getAssetElemByID(ctxTarget.parentNode[_asset].parent).lastElementChild;
		}
	}
	setActive(assetContainer);
	loadProgress(0);
	for(const assetElem of assets.querySelectorAll(".asset.selected")) {
		assetElem.classList.remove("selected");
	}
	proj[sel].selectedAsset = null;
	for(let i = 0; i < files.length; i++) {
		loadProgress(i / files.length);
		let data;
		try {
			data = (await fs.readFile(files[i].path)).toString("base64");
		} catch(err) {
			new Miro.dialog("Error", html`
				An error occurred while encoding <span class="bold">${files[i].name}</span>.<br>
				${err.message}
			`);
			continue;
		}
		const names = proj[sel].data.assets.map(byLowerCaseName);
		let name = files[i].name;
		for(let j = 2; names.includes(name.toLowerCase()); j++) {
			name = `${files[i].name} ${j}`;
		}
		let asset;
		try {
			asset = new Asset({
				type: "file",
				name,
				mime: files[i].type,
				data
			});
			await new Promise((resolve, reject) => {
				const media = new (asset.mime.startsWith("image/") ? Image : Audio)();
				media.src = asset.url;
				media.addEventListener("load", resolve);
				media.addEventListener("error", reject);
			});
		} catch(err) {
			new Miro.dialog("Error", html`
				<span class="bold">${files[i].name}</span> is not a valid asset.
			`);
			continue;
		}
		proj[sel].data.assets.push(asset);
		const assetFile = appendAsset(asset);
		assetParent.appendChild(assetFile);
		assetFile.classList.add("selected");
		if(i === 0) {
			proj[sel].selectedAsset = assetFile.id;
		}
	}
	storeAssets();
	updateProperties();
	loadProgress(1);
};
const assetInput = document.createElement("input");
assetInput.type = "file";
assetInput.multiple = true;
assetInput.addEventListener("change", async () => {
	await addFiles(assetInput.files);
	assetInput.value = null;
});
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
const byAssets = assetElem => assetElem[_asset];
const numericAssetType = asset => asset.type === "group" ? 0 : (asset.type === "obj" ? 1 : (asset.mime.startsWith("image/") ? 2 : 3));
const assetElemsAlphabetically = assetElem => `${"abcd"[numericAssetType(assetElem[_asset])]} ${assetElem[_asset].name.toLowerCase()}`;
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
	if(assetContainer.contains(mouseTarget)) {
		setActive(assetContainer);
	} else {
		setActive();
	}
	if(mouseTarget.classList.contains("assetBar")) {
		proj[sel].focusedAsset = mouseTarget.parentNode.id;
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
};
document.addEventListener("mousedown", onMouseDown, true);
document.addEventListener("mousemove", evt => {
	if(evt.clientX === mouseX && evt.clientY === mouseY) {
		return;
	}
	mouseX = evt.clientX;
	mouseY = evt.clientY;
	if(mouseDown === -1) {
		return;
	}
	if(mouseTarget) {
		if(mouseTarget.classList.contains("assetBar")) {
			if(!mouseMoved) {
				selectAsset(mouseTarget.parentNode, 2);
				assetDrag.classList.remove("hidden");
			}
			let side;
			let minDist = Infinity;
			let minAssetElem;
			for(const assetElem of assets.querySelectorAll(".asset")) {
				const distTop = mouseY - assetElem.firstElementChild.getBoundingClientRect().top - assetElem.firstElementChild.offsetHeight / 2;
				const absDistTop = Math.abs(distTop);
				if(absDistTop < minDist) {
					minDist = absDistTop;
					minAssetElem = assetElem;
					side = distTop < 0 ? "before" : "after";
				}
			}
			if(side === "after" && minAssetElem[_asset].type === "group" && minAssetElem.classList.contains("open")) {
				minAssetElem.lastElementChild.insertBefore(assetDrag, minAssetElem.lastElementChild.firstChild);
			} else {
				minAssetElem[side](assetDrag);
			}
		} else if(mouseTarget0) {
			if(mouseTarget0.classList.contains("tab")) {
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
				mouseTarget0.parentNode.style[horizontalTarget ? "width" : "height"] = `${storage.containerSizes[mouseTarget0.parentNode.id] = Math.max(150, value)}px`;
				if(!horizontalTarget) {
					mouseTarget0.parentNode.style.minHeight = mouseTarget0.parentNode.style.height;
				}
				absoluteCenter(content);
			}
		}
	}
	mouseMoved = true;
}, true);
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
			if(evtButton === mouseDown) {
				if(mouseTarget.classList.contains("assetBar") && mouseMoved) {
					for(const assetElem of assets.querySelectorAll(".asset.selected")) {
						try {
							assetDrag.before(assetElem);
						} catch(err) {}
					}
					storeAssets();
					assetDrag.classList.add("hidden");
				} else {
					if(mouseTarget === assets) {
						if(mouseX < assets.offsetLeft + assets.scrollWidth) {
							for(const assetElem of assets.querySelectorAll(".asset.selected")) {
								assetElem.classList.remove("selected");
							}
							proj[sel].selectedAsset = null;
							updateProperties();
						}
					} else if(mouseTarget.classList.contains("assetBar")) {
						selectAsset(mouseTarget.parentNode, evtButton);
					} else if(evtButton0 && mouseTarget0.parentNode.classList.contains("assetBar")) {
						if(mouseTarget0.classList.contains("close")) {
							confirmRemoveAsset(mouseTarget0.parentNode.parentNode);
						} else if(mouseTarget0.classList.contains("icon")) {
							toggleAssetGroup(mouseTarget0.parentNode.parentNode);
						}
					}
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
					} else if(mouseTarget0.parentNode === assetHead) {
						if(mouseTarget0 === addAsset) {
							openCtx(assets);
						} else if(mouseTarget0 === sortAssets) {
							openCtx(sortAssets);
						}
					} else if(mouseTarget0.parentNode.parentNode === assetPath) {
						if(mouseTarget0.parentNode === assetPath.firstElementChild) {
							rootAsset();
						} else {
							// TODO
						}
					} else if(mouseTarget0 === previewImage) {
						fullPreviewImage.src = previewImage.src;
						fullPreview.classList.remove("hidden");
						absoluteCenter(fullPreviewImage);
						setTimeout(makeFullPreviewOpaque);
					} else if(mouseTarget0.classList.contains("close") && mouseTarget0.parentNode.classList.contains("tab")) {
						mouseTarget0.parentNode[_proj].close();
					} else if(fullPreviewImage.contains(mouseTarget0) || (mouseTarget0 === fullPreview && !mouseTarget0.classList.contains("hoverScrollbar"))) {
						hideFullPreview();
					}
				}
			}
		}
	}
	if(evtButton2 && evt.target === mouseTarget2) {
		openCtx(mouseTarget2);
	}
};
const onMouseUp = evt => {
	handleMouseUp(evt, 0);
	handleMouseUp(evt, 2);
	mouseTarget0 = null;
	mouseTarget2 = null;
	mouseDown = -1;
	mouseUp = evt.timeStamp;
};
document.addEventListener("mouseup", onMouseUp, true);
document.addEventListener("click", evt => {
	if(evt.timeStamp !== mouseUp) {
		onMouseDown(evt);
		onMouseUp(evt);
	}
}, true);
document.addEventListener("dragstart", evt => {
	if(mouseDown !== -1) {
		mouseTarget = mouseTarget0 = mouseTarget2 = null;
		mouseDown = -1;
	}
}, true);
document.addEventListener("dragover", evt => {
	evt.preventDefault();
}, true);
document.addEventListener("drop", evt => {
	evt.preventDefault();
	const files = [...evt.dataTransfer.files];
	for(let i = 0; i < files.length; i++) {
		if(files[i].path.toLowerCase().endsWith(".mwd")) {
			open(files.splice(i, 1)[0].path);
		}
	}
	if(sel !== "home" && files.length) {
		addFiles(files);
	}
	win.focus();
}, true);
document.addEventListener("dblclick", evt => {
	if(!mouseMoved) {
		if(evt.target === tabs) {
			new Project();
		} else if(evt.target.classList.contains("handle")) {
			evt.target.parentNode.style.width = evt.target.parentNode.style.height = evt.target.parentNode.style.minWidth = evt.target.parentNode.style.minHeight = "";
			delete storage.containerSizes[evt.target.parentNode.id];
			store();
		} else if(evt.target.classList.contains("assetBar")) {
			selectAsset(evt.target.parentNode, 2);
			if(evt.target.parentNode[_asset].type === "group") {
				toggleAssetGroup(evt.target.parentNode);
			} else if(evt.target.parentNode[_asset].type === "obj") {
				rootAsset(evt.target.parentNode[_asset]);
			}
		}
	}
}, true);
const focused = () => !(container.querySelector(".mdc-dialog") || tabs.classList.contains("intangible"));
document.addEventListener("focus", evt => {
	for(const target of evt.path) {
		if(target === document.body) {
			break;
		}
		if(target.classList.contains("intangible")) {
			setTimeout(evt.target.blur.bind(evt.target));
		}
	}
}, true);
document.addEventListener("keydown", evt => {
	superKey = evt.metaKey || evt.ctrlKey;
	altKey = evt.altKey;
	shiftKey = evt.shiftKey;
	if(evt.keyCode === 38) { // `up`
		if(focused() && assetContainer.classList.contains("active")) {
			evt.preventDefault();
			const allAssets = assets.querySelectorAll(".asset");
			const assetElem = allAssets[proj[sel].focusedAsset ? ((Array.prototype.indexOf.call(allAssets, assets.querySelector(`#${proj[sel].focusedAsset}`)) || allAssets.length) - 1) : 0];
			if(!superKey) {
				selectAsset(assetElem);
			}
			proj[sel].focusedAsset = assetElem.id;
		}
	} else if(evt.keyCode === 40) { // `down`
		if(focused() && assetContainer.classList.contains("active")) {
			evt.preventDefault();
			const allAssets = assets.querySelectorAll(".asset");
			const assetElem = allAssets[((proj[sel].focusedAsset ? Array.prototype.indexOf.call(allAssets, assets.querySelector(`#${proj[sel].focusedAsset}`)) : -1) + 1) % allAssets.length];
			if(!superKey) {
				selectAsset(assetElem);
			}
			proj[sel].focusedAsset = assetElem.id;
		}
	} else if(evt.keyCode === 93) { // `context menu`
		const ctxCandidates = document.querySelectorAll(":hover, :focus");
		if(ctxCandidates.length) {
			openCtx(ctxCandidates[ctxCandidates.length - 1]);
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
			if(focused() && assetContainer.classList.contains("active")) {
				for(const assetElem of assets.querySelectorAll(".asset:not(.selected)")) {
					assetElem.classList.add("selected");
				}
				updateProperties();
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
		if(focused() && assetContainer.classList.contains("active")) {
			confirmRemoveAssets(assets.querySelectorAll(".asset.selected"));
		}
	} else if(evt.keyCode === 13) { // `enter`
		if(focused() && assetContainer.classList.contains("active")) {
			const focusedAssetElem = assets.querySelector(".asset.focus");
			if(focusedAssetElem && focusedAssetElem[_asset].type === "obj") {
				rootAsset(focusedAssetElem[_asset]);
			} else {
				for(const assetElem of assets.querySelectorAll(".asset.selected")) {
					if(assetElem[_asset].type === "group") {
						assetElem.classList.toggle("open");
					}
				}
			}
		}
	} else if(evt.keyCode === 27) { // `esc`
		if(focused()) {
			if(assetContainer.classList.contains("active")) {
				for(const assetElem of assets.querySelectorAll(".asset.selected")) {
					assetElem.classList.remove("selected");
				}
				proj[sel].selectedAsset = null;
				updateProperties();
			} else if(fullPreview.classList.contains("active")) {
				hideFullPreview();
			}
		}
	} else if(evt.keyCode === 113) { // `F2`
		setTimeout(prop.name.elements[0].select.bind(prop.name.elements[0]));
	} else if(evt.keyCode === 122) { // `F11`
		const fullScreen = !win.isFullScreen();
		win.setFullScreen(fullScreen);
		titleBar.classList[fullScreen ? "add" : "remove"]("hidden");
	}
}, true);
document.addEventListener("keyup", evt => {
	shiftKey = evt.keyCode !== 16 && evt.shiftKey;
	superKey = !(evt.keyCode === 17 || evt.keyCode === 91) && (evt.ctrlKey || evt.metaKey);
	altKey = evt.keyCode !== 18 && evt.altKey;
}, true);
document.addEventListener("input", evt => {
	if(!evt.target.checkValidity()) {
		return;
	}
	if(evt.target === prop.canvasSize.elements[0]) {
		content.style.width = `${proj[sel].data.width = evt.target.value}px`;
		absoluteCenter(content);
	} else if(evt.target === prop.canvasSize.elements[1]) {
		content.style.height = `${proj[sel].data.height = evt.target.value}px`;
		absoluteCenter(content);
	} else if(evt.target === prop.name.elements[0]) {
		const names = proj[sel].data.assets.map(byLowerCaseName);
		if(names.includes(evt.target.value)) {
			new Miro.dialog("Error", "That asset name is already in use.");
		} else {
			assets.querySelector(".asset.selected")[_asset].name = evt.target.value;
			proj[sel].saved = false;
		}
	}
}, true);
document.addEventListener("submit", evt => {
	evt.preventDefault();
}, true);
window.addEventListener("resize", () => {
	absoluteCenter(content);
	if(!fullPreview.classList.contains("hidden")) {
		absoluteCenter(fullPreviewImage);
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
const assetLink = (asset, selected) => {
	if(selected) {
		const selectedElem = assetPath.querySelector(".assetLink .mdc-chip--selected");
		if(selectedElem) {
			selectedElem.classList.remove("mdc-chip--selected");
		}
	}
	const assetLinkElem = html`
		<span class="assetLink">
			<span class="material-icons">arrow_right</span>
			<div class="mdc-chip${selected ? " mdc-chip--selected" : ""}">
				<div class="mdc-chip__text">$${asset.name}</div>
			</div>
		</span>
	`;
	assetLinkElem[_asset] = asset;
	assetPath.appendChild(assetLinkElem);
};
const rootAsset = asset => {
	if(asset && proj[sel].rootAsset === asset.id) {
		return;
	}
	while(assetPath.children[1]) {
		assetPath.children[1].remove();
	}
	openAsset(asset, true, true);
	if(asset) {
		proj[sel].rootAsset = asset.id;
	} else {
		delete proj[sel].rootAsset;
	}
};
const openAsset = (asset, selected, finish) => {
	if(asset) {
		proj[sel].openAsset = asset.id;
		assetLink(asset, selected);
		if(finish) {
			// TODO
		}
	} else {
		assetPath.firstElementChild.firstElementChild.classList.add("mdc-chip--selected");
		delete proj[sel].openAsset;
	}
};
