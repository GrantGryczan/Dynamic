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
const byObjArrays = data => data.objs;
const _saved = Symbol("saved");
const _name = Symbol("name");
const _location = Symbol("location");
const _selectedAsset = Symbol("selectedAsset");
const _focusedAsset = Symbol("focusedAsset");
const _selectedLayer = Symbol("selectedLayer");
const _focusedLayer = Symbol("focusedLayer");
const _selectedTimelineItem = Symbol("selectedTimelineItem");
const _focusedTimelineItem = Symbol("focusedTimelineItem");
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
		(this.tab = html`
			<div class="tab">
				<div class="label">$${this[_name]}</div>
				<div class="close material-icons"></div>
			</div>
		`)._label = this.tab.querySelector(".label");
		Object.assign(this, {
			id: String(++projectID),
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
			clipCanvas: storage.clipCanvas,
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
						<b>$${assetData.name}</b> is not a valid asset.
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
						<b>$${objData && objData.name}</b> is not a valid object.
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
		this[_name] = this.tab._label.textContent = value;
	}
	get saved() {
		return this[_saved];
	}
	set saved(value) {
		this.tab.classList[(saveProj.disabled = this[_saved] = !!value) ? "add" : "remove"]("saved");
	}
	async close() {
		if(!this.saved && await new Miro.Dialog("Close Project", html`
			Are you sure you want to close <b>$${this.name}</b>?<br>
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
			value.classList.add("focus");
			scrollIntoView(value.firstElementChild, assets);
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
			value.classList.add("focus");
			scrollIntoView(value.firstElementChild, layerBox);
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
			value.classList.add("focus");
			scrollIntoView(value.firstElementChild, timelineItems);
		}
	}
	get objects() {
		return [...this.data.scenes, ...this.data.assets.filter(byObjArrays)].flatMap(byObjArrays);
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
		updateLoop();
		updateClipCanvas();
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
		let loaded = 0;
		let totalLoad = project.data.assets.length + project.objects.length;
		for(const asset of project.data.assets) {
			loadProgress(++loaded / totalLoad);
			try {
				if(asset.preview) {
					await new Promise((resolve, reject) => {
						if(asset.preview instanceof Audio && asset.preview.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA) {
							resolve();
						} else {
							asset.preview.addEventListener(asset.preview instanceof Image ? "load" : "canplaythrough", resolve);
							asset.preview.addEventListener("error", reject);
						}
					});
				}
			} catch(err) {
				console.warn(err);
				new Miro.Dialog("Error", html`
					<b>$${asset.name}</b> is not a valid asset.
				`);
			}
		}
		for(const obj of project.objects) {
			loadProgress(++loaded / totalLoad);
			try {
				if(obj.element instanceof Audio || obj.element instanceof Image) {
					await new Promise((resolve, reject) => {
						if(obj.element instanceof Audio && obj.element.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA) {
							resolve();
						} else {
							obj.element.addEventListener(obj.element instanceof Image ? "load" : "canplaythrough", resolve);
							obj.element.addEventListener("error", reject);
						}
					});
				}
			} catch(err) {
				console.warn(err);
				new Miro.Dialog("Error", html`
					<b>$${obj.name}</b> is not a valid object.
				`);
			}
		}
		select(selectedProject);
		loadProgress(1);
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
	killAudio();
	if(playing) {
		updateLiveAudio();
	}
	updateProperties();
};
