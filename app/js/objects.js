"use strict";
const onlyGraphics = obj => obj.type === "obj" || obj.type === "image";
const byDate = (a, b) => a.date - b.date;
const byZ = obj => obj.get("z");
const byZIndex = (a, b) => b.get("z") - a.get("z");
class DynamicObject {
	constructor(value) {
		this.project = project;
		if(typeof value === "string") {
			this.id = uid(this.project.root.objs.map(byID));
			this.date = Date.now();
			const asset = this.project.getAsset(value);
			if(asset.type === "group") {
				this.type = "group";
				const names = this.project.root.objs.map(byInsensitiveName);
				this[_name] = asset.name;
				for(let i = 2; names.includes(this[_name].toLowerCase()); i++) {
					this[_name] = `${asset.name} ${i}`;
				}
			} else {
				if((this.asset = asset) === this.project.root) {
					throw new MiroError("You cannot put an object inside of itself.");
				}
				if(asset.type === "obj") {
					this.type = "obj";
				} else {
					this.type = asset.mime.slice(0, asset.mime.indexOf("/"));
				}
			}
			this.keyframes = new Array(this.project.root.duration).fill(null);
			if(onlyGraphics(this)) {
				this.set("z", Math.max(0, ...this.project.root.objs.filter(onlyGraphics).map(byZ)) + 1);
			}
		} else if(value instanceof Object) {
			if(value.project instanceof DynamicProject) {
				this.project = value.project;
			}
			delete value.project;
			this.id = typeof value.id === "string" ? value.id : uid(this.project.root.objs.map(byID));
			this.date = isFinite(value.date) ? +value.date : Date.now();
			if(value.parent) {
				this.parent = this.project.getObject(value.parent);
			}
			if((this.type = value.type) === "group") {
				this.name = String(value.name);
			} else {
				if(value.type !== "obj" && value.type !== "image" && value.type !== "audio") {
					throw new MiroError("The `type` value must be a valid object type.");
				}
				if(!(this.asset = this.project.getAsset(value.asset))) {
					throw new MiroError("The `asset` value must be a string of an asset ID.");
				}
			}
			this.keyframes = new Array(this.project.root.duration).fill(null);
			if(value.keyframes instanceof Array) {
				for(const keyframe of value.keyframes) {
					if(keyframe instanceof Object && keyframe.time >= 0 && keyframe.time < this.project.root.duration && keyframe.set instanceof Object) {
						const keys = Object.keys(keyframe.set);
						if(keys.length) {
							const thisProperty = this.keyframes[keyframe.time] = {};
							for(const key of keys) {
								// TODO: Validate property data
								const property = keyframe.set[key];
								if(property.values instanceof Array) {
									const values = [];
									for(const value of property.values) {
										if(typeof value.name === "string") {
											values.push({
												name: value.name,
												value: value.value
											});
										}
									}
									thisProperty[key] = {
										values
									};
								} else {
									thisProperty[key] = {
										value: property.value
									};
								}
							}
						}
					}
				}
			}
		} else {
			throw new MiroError("The `value` parameter must be an object or a string of an asset ID.");
		}
		this.project.root.objs.push(this);
		this.project.frames[this.id] = new Array(this.project.root.duration).fill(0);
		if(this.type === "group") {
			this.timelineItem = html`
				<div id="timelineItem_$${this.id}" class="timelineItem typeGroup" title="$${this.name}">
					<div class="bar">
						<div class="icon material-icons"></div>
						<div class="label">$${this.name}</div>
						<div class="close material-icons"></div>
					</div>
					<div class="children"></div>
				</div>
			`;
		} else if(this.type === "audio") {
			this.timelineItem = html`
				<div id="timelineItem_$${this.id}" class="timelineItem typeAudio" title="$${this.name}">
					<div class="bar">
						<div class="icon material-icons"></div>
						<div class="label">$${this.name}</div>
						<div class="close material-icons"></div>
					</div>
				</div>
			`;
		} else {
			this.layer = html`
				<table>
					<tbody>
						<tr id="layer_$${this.id}" class="layer" title="$${this.name}">
							<td class="z">${this.get("z")}</td>
							<td class="barCell">
								<div class="bar">
									<div class="label">$${this.name}</div>
									<div class="close material-icons"></div>
								</div>
							</td>
						</tr>
					</tbody>
				</table>
			`.firstElementChild.firstElementChild;
			this.layer._obj = this;
			if(this.type === "obj") {
				this.timelineItem = html`
					<div id="timelineItem_$${this.id}" class="timelineItem typeObj" title="$${this.name}">
						<div class="bar">
							<div class="icon material-icons"></div>
							<div class="label">$${this.name}</div>
							<div class="close material-icons"></div>
						</div>
						<div class="children"></div>
					</div>
				`;
			} else if(this.type === "image") {
				this.timelineItem = html`
					<div id="timelineItem_$${this.id}" class="timelineItem typeImage" title="$${this.name}">
						<div class="bar">
							<div class="icon material-icons"></div>
							<div class="label">$${this.name}</div>
							<div class="close material-icons"></div>
						</div>
						<div class="children"></div>
					</div>
				`;
			}
		}
		appendObj(this.timelineItem._obj = this);
		if(this.asset) {
			for(const obj of this.asset.presentObjects) {
				obj.updateName();
			}
		}
	}
	get name() {
		return this[_name];
	}
	set name(value) {
		if(this.type === "group") {
			this[_name] = value;
			this.updateName();
		} else {
			throw new MiroError("The name of an object may only be set for groups.");
		}
	}
	updateName() {
		if(this.asset) {
			this[_name] = this.asset.name;
			if(this.asset.presentObjects.length !== 1) {
				this[_name] += ` [${this.asset.presentObjects.sort(byDate).indexOf(this) + 1}]`;
			}
		}
		if(this.timelineItem) {
			this.timelineItem.querySelector(".label").textContent = this.timelineItem.title = this[_name];
		}
		if(this.layer) {
			this.layer.querySelector(".label").textContent = this.layer.title = this[_name];
		}
	}
	toJSON() {
		const obj = {
			...this
		};
		delete obj.project;
		if(this.parent) {
			obj.parent = this.parent.id;
		}
		if(this.type === "group") {
			obj.name = this.name;
		} else {
			obj.asset = this.asset.id;
		}
		delete obj.layer;
		delete obj.timelineItem;
		obj.keyframes = [];
		for(let i = 0; i < this.keyframes.length; i++) {
			const keyframe = this.keyframes[i];
			if(keyframe) {
				obj.keyframes.push({
					time: i,
					set: keyframe
				});
			}
		}
		return obj;
	}
	get timeline() {
		return timelines.querySelector(`#timeline_${this.id}`);
	}
	get(key, time) {
		time = time >= 0 ? +time : this.project.time;
		let value;
		for(const keyframe of this.keyframes) {
			if(keyframe && key in keyframe) {
				({value} = keyframe[key]);
			}
		}
		return value;
	}
	set(key, value, time) {
		// TODO: Validate key/value
		time = time >= 0 ? +time : this.project.time;
		if(!this.keyframes[time]) {
			this.keyframes[time] = {};
		}
		this.keyframes[time][key] = {
			value
		};
		this.project.saved = false;
	}
	add(parent, key, value, time) {
		
	}
}
const appendObj = (obj, create) => {
	if(obj.layer) {
		let sibling = null;
		for(const eachLayer of layers.querySelectorAll(".layer")) {
			if(eachLayer._obj.get("z") < obj.get("z")) {
				sibling = eachLayer;
				break;
			}
		}
		layers.insertBefore(obj.layer, sibling);
	}
	(obj.parent ? obj.parent.timelineItem.lastElementChild : timelineItems).appendChild(obj.timelineItem);
};
const updateLayers = () => {
	for(const obj of project.root.objs.filter(onlyGraphics).sort(byZIndex)) {
		obj.layer.querySelector(".z").textContent = obj.get("z");
		layers.appendChild(obj.layer);
	}
};
const storeObjs = () => {
	for(const obj of project.root.objs) {
		obj._frames = project.frames[obj.id];
	}
	project.root.objs = [];
	project.frames = {};
	for(const timelineItem of timelineItems.querySelectorAll(".timelineItem")) {
		if(timelineItem.parentNode === timelineItems) {
			delete timelineItem._obj.parent;
		} else {
			timelineItem._obj.parent = timelineItem.parentNode.parentNode._obj;
		}
		project.root.objs.push(timelineItem._obj);
		project.frames[timelineItem._obj.id] = timelineItem._obj._frames;
		delete timelineItem._obj._frames;
	}
	project.saved = false;
};
const removeObj = objElem => {
	if(project.selectedTimelineItem === `timelineItem_${objElem._obj.id}`) {
		project.selectedTimelineItem = null;
	}
	if(project.selectedLayer === `layer_${objElem._obj.id}`) {
		project.selectedLayer = null;
	}
	while(objElem._obj.timelineItem.lastElementChild.firstElementChild) {
		objElem._obj.timelineItem.before(objElem._obj.timelineItem.lastElementChild.firstElementChild);
	}
	if(onlyGraphics(objElem._obj)) {
		objElem._obj.layer.remove();
	}
	objElem._obj.timelineItem.remove();
};
const confirmRemoveObjElem = objElem => {
	const actuallyRemoveObjElem = value => {
		if(value === 0) {
			removeObj(objElem);
			storeObjs();
			if(objElem._obj.asset) {
				for(const obj of objElem._obj.asset.presentObjects) {
					obj.updateName();
				}
			}
			updateTimelines();
			updateProperties();
		}
	};
	if(objElem._obj.type === "group") {
		new Miro.Dialog("Remove Group", html`
			Are you sure you want to remove <span class="bold">${objElem._obj.name}</span>?<br>
			All objects inside the group will be taken out.
		`, ["Yes", "No"]).then(actuallyRemoveObjElem);
	} else {
		new Miro.Dialog("Remove Object", html`
			Are you sure you want to remove <span class="bold">${objElem._obj.name}</span>?
		`, ["Yes", "No"]).then(actuallyRemoveObjElem);
	}
};
const confirmRemoveObjElems = objElems => {
	if(objElems.length === 1) {
		confirmRemoveObjElem(objElems[0]);
	} else if(objElems.length !== 1) {
		new Miro.Dialog("Remove Objects", "Are you sure you want to remove all those objects?", ["Yes", "No"]).then(value => {
			if(value === 0) {
				objElems.forEach(removeObj);
				storeObjs();
				for(const objElem of objElems) {
					if(objElem._obj.asset) {
						for(const obj of objElem._obj.asset.presentObjects) {
							obj.updateName();
						}
					}
				}
				updateTimelines();
				updateProperties();
			}
		});
	}
};
const removeSelectedLayers = () => {
	confirmRemoveObjElems(layers.querySelectorAll(".layer.selected"));
};
const deselectLayers = () => {
	for(const layer of layers.querySelectorAll(".layer.selected")) {
		layer.classList.remove("selected");
		layer.classList.remove("focus");
	}
	project.selectedLayer = null;
};
const selectAllLayers = () => {
	for(const layer of layers.querySelectorAll(".layer:not(.selected)")) {
		layer.classList.add("selected");
	}
	updateProperties();
};
const selectLayer = (target, button) => {
	if(typeof button !== "number") {
		button = 0;
	}
	if(button === 2 && !(superKey || shiftKey)) {
		if(!target.classList.contains("selected")) {
			for(const layer of layers.querySelectorAll(".layer.selected")) {
				layer.classList.remove("selected");
			}
			target.classList.add("selected");
			project.selectedLayer = target.id;
		}
	} else if(shiftKey) {
		let selecting = !project.selectedLayer;
		const classListMethod = superKey && project.selectedLayer && !layers.querySelector(`#${project.selectedLayer}`).classList.contains("selected") ? "remove" : "add";
		for(const layer of layers.querySelectorAll(".layer")) {
			if(layer.id === project.selectedLayer || layer.id === target.id) {
				if(selecting) {
					layer.classList[classListMethod]("selected");
					selecting = false;
					continue;
				} else {
					layer.classList[classListMethod]("selected");
					if(project.selectedLayer !== target.id) {
						selecting = true;
					}
				}
			} else if(selecting) {
				layer.classList[classListMethod]("selected");
			} else if(!superKey) {
				layer.classList.remove("selected");
			}
		}
	} else {
		project.selectedLayer = target.id;
		if(superKey) {
			target.classList.toggle("selected");
		} else {
			let othersSelected = false;
			for(const layer of layers.querySelectorAll(".layer.selected")) {
				if(layer !== target) {
					othersSelected = true;
					layer.classList.remove("selected");
				}
			}
			if(target.classList[othersSelected ? "add" : "toggle"]("selected") === false) {
				project.selectedLayer = null;
				project.focusedLayer = target.id;
			}
		}
	}
	setActive(layerContainer);
};
const removeSelectedTimelineItems = () => {
	confirmRemoveObjElems(timelineItems.querySelectorAll(".timelineItem.selected"));
};
const deselectTimelineItems = () => {
	for(const timelineItem of timelineItems.querySelectorAll(".timelineItem.selected")) {
		timelineItem.classList.remove("selected");
		timelineItem.classList.remove("focus");
	}
	project.selectedTimelineItem = null;
	updateSelectedTimelineItems();
};
const selectAllTimelineItems = () => {
	for(const timelineItem of timelineItems.querySelectorAll(".timelineItem:not(.selected)")) {
		timelineItem.classList.add("selected");
	}
	updateSelectedTimelineItems();
	updateProperties();
};
const updateSelectedTimelineItems = () => {
	const topFrames = getTopFrames();
	for(const obj of project.root.objs) {
		const frames = project.frames[obj.id] = new Array(project.root.duration).fill(0);
		if(obj.timelineItem.classList.contains("selected")) {
			const focus = obj.timelineItem.classList.contains("focus");
			for(let i = 0; i < topFrames.length; i++) {
				if(topFrames[i] !== 0) {
					frames[i] = (focus && topFrames[i] === 2) ? 2 : 1;
				}
			}
		}
	}
	updateTimelines();	
};
const selectTimelineItem = (target, button) => {
	if(typeof button !== "number") {
		button = 0;
	}
	if(button === 2 && !(superKey || shiftKey)) {
		if(!target.classList.contains("selected")) {
			for(const timelineItem of timelineItems.querySelectorAll(".timelineItem.selected")) {
				timelineItem.classList.remove("selected");
			}
			target.classList.add("selected");
			project.selectedTimelineItem = target.id;
		}
	} else if(shiftKey) {
		let selecting = !project.selectedTimelineItem;
		const classListMethod = superKey && project.selectedTimelineItem && !timelineItems.querySelector(`#${project.selectedTimelineItem}`).classList.contains("selected") ? "remove" : "add";
		for(const timelineItem of timelineItems.querySelectorAll(".timelineItem")) {
			if(timelineItem.id === project.selectedTimelineItem || timelineItem.id === target.id) {
				if(selecting) {
					timelineItem.classList[classListMethod]("selected");
					selecting = false;
					continue;
				} else {
					timelineItem.classList[classListMethod]("selected");
					if(project.selectedTimelineItem !== target.id) {
						selecting = true;
					}
				}
			} else if(selecting) {
				timelineItem.classList[classListMethod]("selected");
			} else if(!superKey) {
				timelineItem.classList.remove("selected");
			}
		}
	} else {
		project.selectedTimelineItem = target.id;
		if(superKey) {
			target.classList.toggle("selected");
		} else {
			let othersSelected = false;
			for(const timelineItem of timelineItems.querySelectorAll(".timelineItem.selected")) {
				if(timelineItem !== target) {
					othersSelected = true;
					timelineItem.classList.remove("selected");
				}
			}
			if(target.classList[othersSelected ? "add" : "toggle"]("selected") === false) {
				project.selectedTimelineItem = null;
				project.focusedTimelineItem = target.id;
			}
		}
	}
	updateSelectedTimelineItems();
	setActive(timelineContainer);
};
const addToTimeline = () => {
	const _parent = Symbol("parent");
	if(timelineItems.firstElementChild) {
		timelineItems.firstElementChild.before(timelineItemDrag);
	} else {
		timelineItems.appendChild(timelineItemDrag);
	}
	for(const timelineItem of timelineItems.querySelectorAll(".timelineItem.selected")) {
		timelineItem.classList.remove("selected");
	}
	const assetElems = assets.querySelectorAll(".asset.selected, .asset.selected .asset");
	for(const assetElem of assetElems) {
		let obj;
		try {
			obj = new DynamicObject(assetElem._asset.id);
		} catch(err) {
			console.warn(err);
			new Miro.Dialog("Error", err.message);
		}
		if(obj) {
			if(assetElem[_parent]) {
				assetElem[_parent].appendChild(obj.timelineItem);
				delete assetElem[_parent];
			} else {
				timelineItemDrag.before(obj.timelineItem);
			}
			if(obj.type === "group") {
				for(const child of assetElem.lastElementChild.children) {
					child[_parent] = obj.timelineItem.lastElementChild;
				}
			}
			project.root.objs.unshift(obj);
			obj.timelineItem.classList.add("selected");
			project.selectedTimelineItem = obj.timelineItem.id;
			if(obj.type === "group") {
				obj.timelineItem.classList.add("open");
			} else {
				obj.set("visible", true);
			}
		} else if(assetElem[_parent]) {
			delete assetElem[_parent];
		}
	}
	timelineItemDrag.remove();
	storeObjs();
	for(const assetElem of assetElems) {
		for(const obj of assetElem._asset.presentObjects) {
			obj.updateName();
		}
	}
	updateSelectedTimelineItems();
	updateTimelines();
	setActive(contentContainer);
};
