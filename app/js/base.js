"use strict";
const fs = require("fs-extra");
const crypto = require("crypto");
const zlib = require("zlib");
const http = require("http");
const https = require("https");
const electron = require("electron");
const _proj = Symbol("proj");
const _saved = Symbol("saved");
const _name = Symbol("name");
const _location = Symbol("location");
const _selectedAsset = Symbol("selectedAsset");
const _focusedAsset = Symbol("focusedAsset");
const _asset = Symbol("asset");
const _obj = Symbol("obj");
const slashes = /[\\\/]/g;
const htmlFilenameTest = /\/([^\/]+?)"/;
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
const assetContainer = projectPage.querySelector("#assetContainer");
const assetHead = assetContainer.querySelector(".head");
const addAsset = assetHead.querySelector("#addAsset");
const sortAssets = assetHead.querySelector("#sortAssets");
const assets = assetContainer.querySelector("#assets");
const assetDrag = assets.querySelector("#assetDrag");
const content = projectPage.querySelector("#content");
const timelineContainer = projectPage.querySelector("#timelineContainer");
const assetPath = timelineContainer.querySelector("#assetPath");
const propertyContainer = projectPage.querySelector("#propertyContainer");
const properties = propertyContainer.querySelector("#properties");
const propElems = properties.querySelectorAll(".property");
const prop = {};
for(const propElem of propElems) {
	prop[propElem.getAttribute("data-property")] = propElem;
}
const previewImage = prop.preview.querySelector("img");
const previewAudio = prop.preview.querySelector("audio");
const downloadAsset = prop.preview.querySelector("#downloadAsset");
const fullPreview = container.querySelector("#fullPreview");
const fullPreviewImage = fullPreview.querySelector("img");
const layerContainer = projectPage.querySelector("#layerContainer");
const layers = layerContainer.querySelector("#layers");
const targetIndicator = container.querySelector("#targetIndicator");
const win = electron.remote.getCurrentWindow();
electron.webFrame.setVisualZoomLevelLimits(1, 1);
win.setProgressBar(-1);
const flashFrame = () => {
	if(!win.isFocused()) {
		win.flashFrame(true);
	}
};
const onFocus = () => {
	win.flashFrame(false);
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
const uid = keys => {
	let key;
	do {
		key = crypto.createHash("sha256").update(crypto.randomBytes(8)).digest("hex").slice(0, 8);
	} while(keys.includes(key));
	return key;
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
const scrollIntoView = elem => {
	if(elem.offsetTop < elem.parentNode.scrollTop) {
		elem.parentNode.scrollTop = elem.offsetTop;
	} else if(elem.offsetTop + elem.offsetHeight > elem.parentNode.scrollTop + elem.parentNode.offsetHeight) {
		elem.parentNode.scrollTop = elem.offsetTop + elem.offsetHeight - elem.parentNode.offsetHeight;
	}
};
const absoluteCenter = elem => {
	elem.style.left = `${Math.max(0, (elem.parentNode.offsetWidth === elem.parentNode.scrollWidth ? elem.parentNode.offsetWidth : elem.parentNode.offsetWidth - 12) / 2 - elem.offsetWidth / 2)}px`;
	elem.style.top = `${Math.max(0, (elem.parentNode.offsetHeight === elem.parentNode.scrollHeight ? elem.parentNode.offsetHeight : elem.parentNode.offsetHeight - 12) / 2 - elem.offsetHeight / 2)}px`;
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
		flashFrame();
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
		flashFrame();
	} else {
		loading.style.width = `${100 * value}%`;
		win.setProgressBar(value);
	}
};
const indicateTarget = target => {
	if(target) {
		const rect = target.getBoundingClientRect();
		targetIndicator.style.left = `${rect.left}px`;
		targetIndicator.style.top = `${rect.top}px`;
		targetIndicator.style.width = `${rect.width}px`;
		targetIndicator.style.height = `${rect.height}px`;
		targetIndicator.classList.add("visible");
	} else if(targetIndicator.classList.contains("visible")) {
		targetIndicator.style.left = "";
		targetIndicator.style.top = "";
		targetIndicator.style.width = "";
		targetIndicator.style.height = "";
		targetIndicator.classList.remove("visible");
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
			new Miro.Dialog("Confirm", "Are you sure you want to exit?\nAll unsaved changes will be lost.", ["Yes", "No"]).then(confirmClose);
			return true;
		}
	}
};
const focused = () => !(container.querySelector(".mdc-dialog") || tabs.classList.contains("intangible"));
const notTyping = () => !container.querySelector("input:not([type='button']):not([type='submit']):not([type='reset']):focus, textarea:focus");
