"use strict";
const proj = {}; // the object of projects, the probject
let projID = 0;
let sel;
const prevSel = [];
const baseData = {
	service: "Miroware Dynamic",
	version: 0
};
class DynamicProject {
	constructor(value) {
		if(!(value instanceof Object)) {
			value = {};
		}
		const validLocation = typeof value.location === "string";
		if(typeof value.name === "string") {
			this[_name] = value.name;
		} else if(!validLocation) {
			const projects = Object.values(proj);
			let i = 0;
			do {
				this[_name] = `Project ${++i}`;
			} while(projects.some(project => project.name === this[_name]));
		}
		Object.assign(this, {
			id: String(++projID),
			tab: html`
				<div class="tab${(this[_saved] = !!value.saved) ? " saved" : ""}">
					<div class="label">$${this[_name]}</div>
					<div class="close material-icons"></div>
				</div>
			`,
			location: validLocation ? value.location : null,
			data: value.data || {
				...baseData,
				assets: [],
				objs: [],
				fps: storage.fps,
				duration: storage.fps * 2
			},
			time: 0,
			frames: {}
		});
		tabs.appendChild((this.tab._proj = this).tab);
		select((proj[this.id] = this).id);
		updateTimeRuler();
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
		if(!this.saved && await new Miro.Dialog("Confirm", html`
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
			scrollIntoView(assetElem.querySelector(".bar"), assets);
		}
	}
	get selectedLayer() {
		return this[_selectedLayer];
	}
	set selectedLayer(value) {
		this.focusedLayer = this[_selectedLayer] = value;
	}
	get focusedLayer() {
		return this[_focusedLayer];
	}
	set focusedLayer(value) {
		for(const layer of layers.querySelectorAll(".layer.focus")) {
			layer.classList.remove("focus");
		}
		if(this[_focusedLayer] = value) {
			const layer = layers.querySelector(`#${value}`);
			layer.classList.add("focus");
			scrollIntoView(layer.querySelector(".bar"), layerBox);
		}
	}
	get selectedTimelineItem() {
		return this[_selectedTimelineItem];
	}
	set selectedTimelineItem(value) {
		this.focusedTimelineItem = this[_selectedTimelineItem] = value;
	}
	get focusedTimelineItem() {
		return this[_focusedTimelineItem];
	}
	set focusedTimelineItem(value) {
		for(const timelineItem of timelineItems.querySelectorAll(".timelineItem.focus")) {
			timelineItem.classList.remove("focus");
		}
		if(this[_focusedTimelineItem] = value) {
			const timelineItem = timelineItems.querySelector(`#${value}`);
			timelineItem.classList.add("focus");
			scrollIntoView(timelineItem.querySelector(".bar"), timelineItems);
		}
	}
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
		proj[sel].scrollProperties = propertyContainer.scrollTop;
		proj[sel].scrollContentLeft = contentContainer.scrollLeft;
		proj[sel].scrollContentTop = contentContainer.scrollTop;
		proj[sel].scrollLayers = layers.scrollTop;
		proj[sel].scrollTimelinesLeft = timelineBox.scrollLeft;
		proj[sel].scrollTimelinesTop = timelineBox.scrollTop;
		projectPage.classList.add("hidden");
	} else {
		homePage.classList.add("hidden");
	}
	if(proj[sel]) {
		for(const elem of projectPage.querySelectorAll(".asset, .layer, .timelineItem")) {
			elem.remove();
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
		proj[sel].data.objs.forEach(appendObj);
		updateLayers();
		saveProj.disabled = proj[sel].saved;
		rootAsset(proj[sel].rootAsset ? getAsset(proj[sel].rootAsset) : null);
		openAsset(proj[sel].openAsset ? getAsset(proj[sel].openAsset) : null);
		updateProperties();
		proj[sel].tab.classList.add("current");
		projectPage.classList.remove("hidden");
		prop.fps.elements[0].value = proj[sel].data.fps;
		content.style.width = `${prop.canvasSize.elements[0].value = proj[sel].data.width || storage.canvasWidth}px`;
		content.style.height = `${prop.canvasSize.elements[1].value = proj[sel].data.height || storage.canvasHeight}px`;
		updatePanels();
		assets.scrollTop = proj[sel].scrollAssets;
		propertyContainer.scrollTop = proj[sel].scrollProperties;
		contentContainer.scrollLeft = proj[sel].scrollContentLeft;
		contentContainer.scrollTop = proj[sel].scrollContentTop;
		layers.scrollTop = proj[sel].scrollLayers;
		timelineBox.scrollLeft = proj[sel].scrollTimelinesLeft;
		timelineBox.scrollTop = proj[sel].scrollTimelinesTop;
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
const save = async as => {
	if(proj[sel] && (as || !proj[sel].saved) && (proj[sel].location = (!as && proj[sel].location) || electron.remote.dialog.showSaveDialog(win, fileOptions))) {
		loadIndeterminate(true);
		try {
			await fs.writeFile(proj[sel].location, await zip(JSON.stringify(proj[sel].data)));
		} catch(err) {
			console.warn(err);
			new Miro.Dialog("Error", "An error occurred while trying to save.");
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
			console.warn(err);
			new Miro.Dialog("Error", "That is not a valid MWD file.");
			loadIndeterminate(false);
			return false;
		}
		new DynamicProject({
			saved: true,
			location
		});
		loadIndeterminate(false);
		loadProgress(0);
		for(let i = 0; i < data.assets.length; i++) {
			loadProgress(i / data.assets.length);
			try {
				const asset = new DynamicAsset(data.assets[i]);
				if(asset.type === "file") {
					await new Promise((resolve, reject) => {
						const media = new (asset.mime.startsWith("image/") ? Image : Audio)();
						media.src = asset.url;
						media.addEventListener(media instanceof Image ? "load" : "canplay", resolve);
						media.addEventListener("error", reject);
					});
				}
			} catch(err) {
				console.warn(err);
				new Miro.Dialog("Error", html`
					<span class="bold">${data.assets[i].id}</span> is not a valid asset.
				`);
			}
		}
		storeAssets();
		for(const dataObj of data.objs) {
			try {
				const obj = new DynamicObject(dataObj);
			} catch(err) {
				console.warn(err);
				new Miro.Dialog("Error", html`
					<span class="bold">${dataObj.id}</span> is not a valid object.
				`);
			}
		}
		storeObjs();
		updateTimelines();
		loadProgress(1);
	} else {
		return false;
	}
};
electron.ipcRenderer.on("argv", (evt, location) => {
	open(location);
});
