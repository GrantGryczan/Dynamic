"use strict";
const getObj = id => project.data.objs.find(obj => obj.id === id);
const onlyGraphics = obj => obj.type === "obj" || obj.type === "image";
const byDate = (a, b) => a.date - b.date;
const byZ = obj => obj.get("z");
const byZIndex = (a, b) => b.get("z") - a.get("z");
class DynamicObject {
	constructor(value) {
		if(!value.id) {
			this.id = uid(project.data.objs.map(byID));
		}
		if(typeof value === "string") {
			this.date = Date.now();
			const asset = getAsset(value);
			if(asset.type === "group") {
				this.type = "group";
				const names = project.data.objs.map(byInsensitiveName);
				this[_name] = asset.name;
				for(let i = 2; names.includes(this[_name].toLowerCase()); i++) {
					this[_name] = `${asset.name} ${i}`;
				}
			} else {
				if(asset.type === "obj") {
					this.type = "obj";
				} else {
					this.type = asset.mime.slice(0, asset.mime.indexOf("/"));
				}
				this.asset = asset;
			}
			if(onlyGraphics(this)) {
				const maxZ = Math.max(...project.data.objs.filter(onlyGraphics).map(byZ));
				this.set("z", isFinite(maxZ) ? maxZ + 1 : 1);
			}
		} else if(value instanceof Object) {
			Object.assign(this, value);
			if(value.parent) {
				this.parent = getObj(value.parent);
			}
			if(value.type !== "group") {
				this.asset = getAsset(value.asset);
			}
		} else {
			throw new MiroError("The `value` parameter must be an object or a string of an asset ID.");
		}
		project.data.objs.push(this);
		project.frames[this.id] = new Array(project.duration).fill(0);
		if(this.type === "group") {
			this.timelineItem = html`
				<div id="timelineItem_${this.id}" class="timelineItem typeGroup" title="$${this.name}">
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
				<div id="timelineItem_${this.id}" class="timelineItem typeAudio" title="$${this.name}">
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
						<tr id="layer_${this.id}" class="layer" title="$${this.name}">
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
					<div id="timelineItem_${this.id}" class="timelineItem typeObj" title="$${this.name}">
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
					<div id="timelineItem_${this.id}" class="timelineItem typeImage" title="$${this.name}">
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
		this.updateName();
	}
	toJSON() {
		const obj = {
			...this
		};
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
		return obj;
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
	get timeline() {
		return timelines.querySelector(`#timeline_${this.id}`);
	}
	updateName() {
		if(this.asset) {
			this[_name] = this.asset.name;
			if(this.asset.objects.length > 1) {
				this[_name] += ` [${this.asset.objects.sort(byDate).indexOf(this) + 1}]`;
			}
		}
		if(this.timelineItem) {
			this.timelineItem.querySelector(".label").textContent = this.timelineItem.title = this[_name];
		}
		if(this.layer) {
			this.layer.querySelector(".label").textContent = this.layer.title = this[_name];
		}
	}
	get(key, time) {
		return this[key];
	}
	set(key, value, time) {
		this[key] = value;
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
	for(const obj of project.data.objs.filter(onlyGraphics).sort(byZIndex)) {
		obj.layer.querySelector(".z").textContent = obj.get("z");
		layers.appendChild(obj.layer);
	}
};
const storeObjs = () => {
	for(const obj of project.data.objs) {
		obj._frames = project.frames[obj.id];
	}
	project.data.objs = [];
	project.frames = {};
	for(const timelineItem of timelineItems.querySelectorAll(".timelineItem")) {
		if(timelineItem.parentNode === timelineItems) {
			delete timelineItem._obj.parent;
		} else {
			timelineItem._obj.parent = timelineItem.parentNode.parentNode._obj;
		}
		project.data.objs.push(timelineItem._obj);
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
				for(const obj of objElem._obj.asset.objects) {
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
			Are you sure you want to remove <span class="bold">${objElem._obj.name}</span>?<br>
			This cannot be undone.
		`, ["Yes", "No"]).then(actuallyRemoveObjElem);
	}
};
const confirmRemoveObjElems = objElems => {
	if(objElems.length === 1) {
		confirmRemoveObjElem(objElems[0]);
	} else if(objElems.length > 1) {
		new Miro.Dialog("Remove Objects", html`
			Are you sure you want to remove all those objects?<br>
			This cannot be undone.
		`, ["Yes", "No"]).then(value => {
			if(value === 0) {
				objElems.forEach(removeObj);
				storeObjs();
				for(const objElem of objElems) {
					if(objElem._obj.asset) {
						for(const obj of objElem._obj.asset.objects) {
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
	for(const obj of project.data.objs) {
		const frames = project.frames[obj.id] = new Array(project.data.duration).fill(0);
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
		const obj = new DynamicObject(assetElem._asset.id);
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
		project.data.objs.unshift(obj);
		obj.timelineItem.classList.add("selected");
		project.selectedTimelineItem = obj.timelineItem.id;
		if(obj.type === "group") {
			obj.timelineItem.classList.add("open");
		}
	}
	timelineItemDrag.remove();
	storeObjs();
	for(const assetElem of assetElems) {
		for(const obj of assetElem._asset.objects) {
			obj.updateName();
		}
	}
	updateSelectedTimelineItems();
	updateTimelines();
	setActive(contentContainer);
};
