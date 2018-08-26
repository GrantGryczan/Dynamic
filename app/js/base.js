"use strict";
const todo = () => { // TODO: Resolve all calls of this function and remove function
	new Miro.Dialog("Error", "Miroware Dynamic is still under development and does not yet support that feature.");
};
const fs = require("fs-extra");
const crypto = require("crypto");
const zlib = require("zlib");
const http = require("http");
const https = require("https");
const electron = require("electron");
const _saved = Symbol("saved");
const _name = Symbol("name");
const _location = Symbol("location");
const _selectedAsset = Symbol("selectedAsset");
const _focusedAsset = Symbol("focusedAsset");
const _selectedLayer = Symbol("selectedLayer");
const _focusedLayer = Symbol("focusedLayer");
const _selectedTimelineItem = Symbol("selectedTimelineItem");
const _focusedTimelineItem = Symbol("focusedTimelineItem");
const slashes = /[\\\/]/g;
const htmlFilenameTest = /\/([^\/]+?)"/;
const translateX = /translateX\(.*?\)/;
const translateY = /translateY\(.*?\)/;
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
const panels = projectPage.querySelectorAll(".container");
const handles = projectPage.querySelectorAll(".handle");
const assetContainer = projectPage.querySelector("#assetContainer");
const assetHead = assetContainer.querySelector(".head");
const addAsset = assetHead.querySelector("#addAsset");
const sortAssets = assetHead.querySelector("#sortAssets");
const assets = assetContainer.querySelector("#assets");
const assetDrag = assets.querySelector(".drag");
assetDrag.remove();
const content = projectPage.querySelector("#content");
const timelineContainer = projectPage.querySelector("#timelineContainer");
const timelineHead = timelineContainer.querySelector(".head");
const addObj = timelineHead.querySelector("#addObj");
const sortObjs = timelineHead.querySelector("#sortObjs");
const timelineContainerContents = timelineContainer.querySelector(".contents");
const timelineItemContainer = timelineContainerContents.querySelector("#timelineItemContainer");
const timelineItems = timelineItemContainer.querySelector("#timelineItems");
const timelineItemDrag = timelineItems.querySelector(".drag");
timelineItemDrag.remove();
const timelineArea = timelineContainerContents.querySelector("#timelineArea");
const scrubber = timelineArea.querySelector("#scrubber");
const timeRuler = timelineArea.querySelector("#timeRuler");
const timeRulerFiller = timeRuler.querySelector(".filler");
const loopField = timeRulerFiller.querySelector("#loopField");
const loopRangeEnd = loopField.querySelector(".loopRange.end");
const loopRangeStart = loopField.querySelector(".loopRange.start");
const timeUnits = timeRuler.querySelector("#timeUnits");
const timelineBox = timelineArea.querySelector("#timelineBox");
const timelineFiller = timelineBox.querySelector(".filler");
const timelines = timelineBox.querySelector("#timelines");
const timelineFoot = timelineContainer.querySelector(".foot");
const currentFrame = timelineFoot.querySelector("#currentFrame");
const jumpToStart = timelineFoot.querySelector("#jumpToStart");
const jumpToPrev = timelineFoot.querySelector("#jumpToPrev");
const playButton = timelineFoot.querySelector("#playButton");
const pauseButton = timelineFoot.querySelector("#pauseButton");
const jumpToNext = timelineFoot.querySelector("#jumpToNext");
const jumpToEnd = timelineFoot.querySelector("#jumpToEnd");
const alignScrubberLeft = timelineFoot.querySelector("#alignScrubberLeft");
const alignScrubberCenter = timelineFoot.querySelector("#alignScrubberCenter");
const alignScrubberRight = timelineFoot.querySelector("#alignScrubberRight");
const enableLoop = timelineFoot.querySelector("#enableLoop");
const disableLoop = timelineFoot.querySelector("#disableLoop");
const propertyContainer = projectPage.querySelector("#propertyContainer");
const properties = propertyContainer.querySelector("#properties");
const propElems = properties.querySelectorAll("[data-key]");
const prop = {};
for(const propElem of propElems) {
	prop[propElem.getAttribute("data-key")] = propElem;
}
const previewImage = prop.preview.querySelector("img");
const previewAudio = prop.preview.querySelector("audio");
const downloadAsset = prop.preview.querySelector("#downloadAsset");
const fullPreview = container.querySelector("#fullPreview");
const fullPreviewImage = fullPreview.querySelector("img");
const layerContainer = projectPage.querySelector("#layerContainer");
const layerBox = layerContainer.querySelector("#layerBox");
const layers = layerBox.querySelector("#layers");
const layerDrag = layerBox.querySelector(".drag");
layerDrag.remove();
const statusElems = projectPage.querySelectorAll("#statusBar [data-key]");
const status = {};
for(const statusElem of statusElems) {
	status[statusElem.getAttribute("data-key")] = statusElem;
}
const targetIndicator = container.querySelector("#targetIndicator");
const byInsensitiveName = obj => obj.name.trim().toLowerCase();
const win = electron.remote.getCurrentWindow();
electron.webFrame.setVisualZoomLevelLimits(1, 1);
win.setProgressBar(-1);
const capturePassive = {
	capture: true,
	passive: true
};
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
const SCROLLBAR_SIZE = 12;
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
const scrollIntoView = (elem, parent) => {
	if(!parent) {
		parent = elem.parentNode;
	}
	const yOffset = parent === timelineItems ? SCROLLBAR_SIZE + 2 : 0;
	if(elem.offsetTop < parent.scrollTop) {
		parent.scrollTop = elem.offsetTop;
	} else if(elem.offsetTop + elem.offsetHeight > parent.scrollTop + parent.offsetHeight - yOffset) {
		parent.scrollTop = elem.offsetTop + elem.offsetHeight - parent.offsetHeight + yOffset;
	}
	if(elem.offsetLeft < parent.scrollLeft) {
		parent.scrollLeft = elem.offsetLeft;
	} else if(elem.offsetLeft + elem.offsetWidth > parent.scrollLeft + parent.offsetWidth) {
		parent.scrollLeft = elem.offsetLeft + elem.offsetWidth - parent.offsetWidth;
	}
};
const absoluteCenter = elem => {
	elem.style.left = `${Math.max(0, (elem.parentNode.offsetWidth === elem.parentNode.scrollWidth ? elem.parentNode.offsetWidth : elem.parentNode.offsetWidth - SCROLLBAR_SIZE) / 2 - elem.offsetWidth / 2)}px`;
	elem.style.top = `${Math.max(0, (elem.parentNode.offsetHeight === elem.parentNode.scrollHeight ? elem.parentNode.offsetHeight : elem.parentNode.offsetHeight - SCROLLBAR_SIZE) / 2 - elem.offsetHeight / 2)}px`;
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
let indicated;
const indicateTarget = target => {
	const indicated = target;
	if(target) {
		const rect = target.getBoundingClientRect();
		targetIndicator.style.transform = `translate(${rect.left + rect.width / 2 - 0.5}px, ${rect.top + rect.height / 2 - 0.5}px) scale(${rect.width}, ${rect.height})`;
		targetIndicator.classList.add("visible");
	} else if(targetIndicator.classList.contains("visible")) {
		targetIndicator.style.transform = "";
		targetIndicator.classList.remove("visible");
	}
};
const setProperties = elem => {
	const active = container.querySelector(".activeProperties");
	if(active) {
		active.classList.remove("activeProperties");
	}
	if(elem) {
		elem.classList.add("activeProperties");
	}
	updateProperties();
};
const setActive = elem => {
	const active = container.querySelector(".active");
	if(active) {
		active.classList.remove("active");
	}
	if(elem) {
		elem.classList.add("active");
		if(elem.classList.contains("panel") && elem !== propertyContainer) {
			setProperties(elem);
		}
	}
};
document.addEventListener("submit", evt => {
	evt.preventDefault();
}, true);
const updatePanels = () => {
	for(const handle of handles) {
		handle.parentNode.style.width = handle.parentNode.style.height = handle.parentNode.style.minHeight = "";
	}
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
	const statusTop = statusBar.getBoundingClientRect().top;
	timelineContainer.style.height = timelineContainer.style.minHeight = `${Math.max(150, statusTop - timelineContainer.getBoundingClientRect().top)}px`;
	layerContainer.style.height = layerContainer.style.minHeight = `${Math.max(150, statusTop - layerContainer.getBoundingClientRect().top)}px`;
	absoluteCenter(content);
	timelineContainerContents.style.width = "";
	for(const child of timelineContainerContents.children) {
		child.classList.add("hidden");
	}
	timelineContainerContents.style.width = `${timelineContainerContents.offsetWidth}px`;
	for(const child of timelineContainerContents.children) {
		child.classList.remove("hidden");
	}
	updateTimeRuler();
	timelineFoot.style.paddingLeft = `${timelineItemContainer.offsetWidth - 12}px`;
};
window.addEventListener("resize", () => {
	if(sel !== "home") {
		if(!fullPreview.classList.contains("hidden")) {
			absoluteCenter(fullPreviewImage);
		}
		updatePanels();
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
