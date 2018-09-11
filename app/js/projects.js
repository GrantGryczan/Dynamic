"use strict";
const projects = {}; // the object of projects, the probject
let projectID = 0;
let selectedProject;
let project;
const prevSelectedProjects = [];
const baseData = {
	service: "Miroware Dynamic",
	version: 0
};
class DynamicProject {
	constructor(value) {
		if(!(value instanceof Object)) {
			value = {};
		}
		if(!(value.data instanceof Object)) {
			value.data = {};
		}
		const validLocation = typeof value.location === "string";
		if(typeof value.name === "string") {
			this[_name] = value.name;
		} else if(!validLocation) {
			const projectValues = Object.values(projects);
			let i = 0;
			do {
				this[_name] = `Project ${++i}`;
			} while(projectValues.some(project => project.name === this[_name]));
		}
		Object.assign(this, {
			id: String(++projectID),
			tab: html`
				<div class="tab">
					<div class="label">$${this[_name]}</div>
					<div class="close material-icons"></div>
				</div>
			`,
			location: validLocation ? value.location : null,
			data: {
				...baseData,
				fps: value.data.fps >= 0 ? +value.data.fps : storage.fps,
				width: value.data.width > 0 ? +value.data.width : storage.canvasWidth,
				height: value.data.height > 0 ? +value.data.height : storage.canvasHeight,
				assets: [],
				scenes: []
			},
			time: 0,
			frames: {},
			loop: false,
			onionskin: storage.onionskin
		});
		const loadObjs = [];
		if(value.data.assets instanceof Array && value.data.assets.length) {
			for(const assetData of value.data.assets) {
				try {
					const asset = new DynamicAsset({
						project: this,
						...assetData
					});
					if(asset.objs) {
						loadObjs.push([asset, assetData.objs]);
					}
				} catch(err) {
					console.warn(err);
					new Miro.Dialog("Error", html`
						<span class="bold">${assetData.name}</span> is not a valid asset.
					`);
					continue;
				}
			}
		}
		if(value.data.scenes instanceof Array && value.data.scenes.length) {
			for(const sceneData of value.data.scenes) {
				loadObjs.push([new DynamicScene({
					project: this,
					...sceneData
				}), sceneData.objs]);
			}
		} else {
			new DynamicScene({
				project: this
			});
		}
		for(const [parent, objs] of loadObjs) {
			this.root = parent;
			for(const objData of objs) {
				try {
					new DynamicObject({
						project: this,
						...objData
					});
				} catch(err) {
					console.warn(err);
					new Miro.Dialog("Error", html`
						<span class="bold">${objData && objData.name}</span> is not a valid object.
					`);
				}
			}
		}
		for(const obj of (this.root = this.scene = this.data.scenes[0]).objs) {
			this.frames[obj.id] = new Array(this.root.duration).fill(0);
		}
		tabs.appendChild((this.tab._project = this).tab);
		this.saved = value.saved;
		select((projects[this.id] = this).id);
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
		if(this.id === selectedProject) {
			prevSelectedProjects.pop();
			select(prevSelectedProjects.pop());
		}
		this.tab.remove();
		delete projects[this.id];
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
	getAsset(id) {
		return this.data.assets.find(asset => asset.id === id);
	}
	getObject(id) {
		return this.root.objs.find(obj => obj.id === id);
	}
}
const select = id => {
	pause();
	if(!projects[id]) {
		id = "home";
	}
	const prevSelIndex = prevSelectedProjects.indexOf(id);
	if(prevSelIndex !== -1) {
		prevSelectedProjects.splice(prevSelIndex, 1);
	}
	if(project) {
		project.scrollAssets = assets.scrollTop;
		project.scrollProperties = propertyContainer.scrollTop;
		project.scrollContentLeft = contentContainer.scrollLeft;
		project.scrollContentTop = contentContainer.scrollTop;
		project.scrollLayers = layers.scrollTop;
		project.scrollTimelinesLeft = timelineBox.scrollLeft;
		project.scrollTimelinesTop = timelineBox.scrollTop;
		projectPage.classList.add("hidden");
	} else {
		homePage.classList.add("hidden");
	}
	if(project) {
		for(const elem of projectPage.querySelectorAll(".asset, .layer, .timelineItem")) {
			elem.remove();
		}
	}
	prevSelectedProjects.push(selectedProject = id);
	project = projects[selectedProject];
	for(const tab of tabs.children) {
		tab.classList.remove("current");
	}
	if(saveProjAs.disabled = exportProj.disabled = id === "home") {
		saveProj.disabled = true;
		homeTab.classList.add("current");
		homePage.classList.remove("hidden");
	} else {
		project.data.assets.forEach(appendAsset);
		project.root.objs.forEach(appendObj);
		updateLayers();
		saveProj.disabled = project.saved;
		content.style.width = `${project.data.width}px`;
		content.style.height = `${project.data.height}px`;
		project.tab.classList.add("current");
		sceneChipText.textContent = sceneChip.title = project.scene.name;
		if(project.root instanceof DynamicScene) {
			objChip.classList.add("hidden");
		} else {
			objChipText.textContent = objChip.title = project.root.name;
			objChip.classList.remove("hidden");
		}
		projectPage.classList.remove("hidden");
		updatePanels();
		assets.scrollTop = project.scrollAssets;
		propertyContainer.scrollTop = project.scrollProperties;
		contentContainer.scrollLeft = project.scrollContentLeft;
		contentContainer.scrollTop = project.scrollContentTop;
		layers.scrollTop = project.scrollLayers;
		timelineBox.scrollLeft = project.scrollTimelinesLeft;
		timelineBox.scrollTop = project.scrollTimelinesTop;
		updateOnionskin();
		updateProperties();
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
	if(project && (as || !project.saved) && (project.location = (!as && project.location) || electron.remote.dialog.showSaveDialog(win, fileOptions))) {
		loadIndeterminate(true);
		try {
			await fs.writeFile(project.location, await zip(JSON.stringify(project.data)));
		} catch(err) {
			console.warn(err);
			new Miro.Dialog("Error", "An error occurred while trying to save.");
			loadIndeterminate(false);
			return;
		}
		loadIndeterminate(false);
		project.saved = true;
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
			location,
			data
		});
		loadIndeterminate(false);
		loadProgress(0);
		for(let i = 0; i < project.data.assets.length; i++) {
			loadProgress(i / project.data.assets.length);
			try {
				const asset = project.data.assets[i];
				if(asset.type === "file") {
					await new Promise((resolve, reject) => {
						const media = new (asset.mime.startsWith("image/") ? Image : Audio)();
						media.addEventListener(media instanceof Image ? "load" : "canplay", resolve);
						media.addEventListener("error", reject);
						media.src = asset.url;
					});
				}
			} catch(err) {
				console.warn(err);
				new Miro.Dialog("Error", html`
					<span class="bold">${project.data.assets[i].name}</span> is not a valid asset.
				`);
			}
		}
		loadProgress(1);
		select(selectedProject);
	} else {
		return false;
	}
};
electron.ipcRenderer.on("argv", (evt, location) => {
	open(location);
});
const setRoot = data => {
	project.root = data || project.scene;
	if(project.root instanceof DynamicScene) {
		sceneChipText.textContent = sceneChip.title = (project.scene = project.root).name;
		objChip.classList.add("hidden");
		selectScene(project.scene.element);
	} else if(project.root) {
		objChipText.textContent = objChip.title = project.root.name;
		objChip.classList.remove("hidden");
	}
	for(const elem of projectPage.querySelectorAll(".layer, .timelineItem")) {
		elem.remove();
	}
	project.frames = {};
	for(const obj of project.root.objs) {
		project.frames[obj.id] = new Array(project.root.duration).fill(0);
		appendObj(obj);
	}
	updateLayers();
	project.time = 0;
	updateTimeRuler();
	updateProperties();
};
