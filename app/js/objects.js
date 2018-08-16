"use strict";
const getObj = id => proj[sel].data.objs.find(obj => obj.id === id);
const onlyGraphics = obj => obj.type === "obj" || obj.type === "image";
const byDate = (a, b) => a.date - b.date;
const byZ = obj => obj.z;
class DynamicObject {
	constructor(value) {
		if(!value.id) {
			this.id = uid(proj[sel].data.objs.map(byID));
		}
		if(typeof value === "string") {
			this.date = Date.now();
			const asset = getAsset(value);
			if(asset.type === "group") {
				this.type = "group";
				const names = proj[sel].data.objs.map(byInsensitiveName);
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
				const maxZ = Math.max(...proj[sel].data.objs.filter(onlyGraphics).map(byZ));
				this.z = isFinite(maxZ) ? maxZ + 1 : 1; // set property
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
		proj[sel].data.objs.push(this);
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
							<td class="z">${this.z}</td>
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
}
const appendObj = (obj, create) => {
	if(obj.layer) {
		let sibling = null;
		for(const eachLayer of layers.querySelectorAll(".layer")) {
			if(eachLayer._obj.z < obj.z) {
				sibling = eachLayer;
				break;
			}
		}
		layers.insertBefore(obj.layer, sibling);
	}
	(obj.parent ? obj.parent.timelineItem.lastElementChild : timelineItems).appendChild(obj.timelineItem);
};
const byZIndex = (a, b) => b.z - a.z;
const updateLayers = () => {
	for(const obj of proj[sel].data.objs.filter(onlyGraphics).sort(byZIndex)) {
		obj.layer.querySelector(".z").textContent = obj.z;
		layers.appendChild(obj.layer);
	}
};
const storeObjs = () => {
	proj[sel].data.objs = [];
	for(const timelineItem of timelineItems.querySelectorAll(".timelineItem")) {
		if(timelineItem.parentNode === timelineItems) {
			delete timelineItem._obj.parent;
		} else {
			timelineItem._obj.parent = timelineItem.parentNode.parentNode._obj;
		}
		proj[sel].data.objs.push(timelineItem._obj);
	}
	proj[sel].saved = false;
};
const removeObj = objElem => {
	if(proj[sel].selectedTimelineItem === `timelineItem_${objElem._obj.id}`) {
		proj[sel].selectedTimelineItem = null;
	}
	if(proj[sel].selectedLayer === `layer_${objElem._obj.id}`) {
		proj[sel].selectedLayer = null;
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
			if(objElem._obj.asset) {
				for(const obj of objElem._obj.asset.objects) {
					obj.updateName();
				}
			}
			storeObjs();
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
				for(const objElem of objElems) {
					if(objElem._obj.asset) {
						for(const obj of objElem._obj.asset.objects) {
							obj.updateName();
						}
					}
				}
				storeObjs();
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
	proj[sel].selectedLayer = null;
};
const selectLayer = (target, evtButton) => {
	if(typeof evtButton !== "number") {
		evtButton = 0;
	}
	if(evtButton === 2 && !(superKey || shiftKey)) {
		if(!target.classList.contains("selected")) {
			for(const layer of layers.querySelectorAll(".layer.selected")) {
				layer.classList.remove("selected");
			}
			target.classList.add("selected");
			proj[sel].selectedLayer = target.id;
		}
	} else if(shiftKey) {
		let selecting = !proj[sel].selectedLayer;
		const classListMethod = superKey && proj[sel].selectedLayer && !layers.querySelector(`#${proj[sel].selectedLayer}`).classList.contains("selected") ? "remove" : "add";
		for(const layer of layers.querySelectorAll(".layer")) {
			if(layer.id === proj[sel].selectedLayer || layer.id === target.id) {
				if(selecting) {
					layer.classList[classListMethod]("selected");
					selecting = false;
					continue;
				} else {
					layer.classList[classListMethod]("selected");
					if(proj[sel].selectedLayer !== target.id) {
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
		proj[sel].selectedLayer = target.id;
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
				proj[sel].selectedLayer = null;
				proj[sel].focusedLayer = target.id;
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
	proj[sel].selectedTimelineItem = null;
};
const selectTimelineItem = (target, evtButton) => {
	if(typeof evtButton !== "number") {
		evtButton = 0;
	}
	if(evtButton === 2 && !(superKey || shiftKey)) {
		if(!target.classList.contains("selected")) {
			for(const timelineItem of timelineItems.querySelectorAll(".timelineItem.selected")) {
				timelineItem.classList.remove("selected");
			}
			target.classList.add("selected");
			proj[sel].selectedTimelineItem = target.id;
		}
	} else if(shiftKey) {
		let selecting = !proj[sel].selectedTimelineItem;
		const classListMethod = superKey && proj[sel].selectedTimelineItem && !timelineItems.querySelector(`#${proj[sel].selectedTimelineItem}`).classList.contains("selected") ? "remove" : "add";
		for(const timelineItem of timelineItems.querySelectorAll(".timelineItem")) {
			if(timelineItem.id === proj[sel].selectedTimelineItem || timelineItem.id === target.id) {
				if(selecting) {
					timelineItem.classList[classListMethod]("selected");
					selecting = false;
					continue;
				} else {
					timelineItem.classList[classListMethod]("selected");
					if(proj[sel].selectedTimelineItem !== target.id) {
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
		proj[sel].selectedTimelineItem = target.id;
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
				proj[sel].selectedTimelineItem = null;
				proj[sel].focusedTimelineItem = target.id;
			}
		}
	}
	setActive(timelineContainer);
};
const addToCanvas = () => {
	const _parent = Symbol("parent");
	if(timelineItems.firstElementChild) {
		timelineItems.firstElementChild.before(timelineItemDrag);
	} else {
		timelineItems.appendChild(timelineItemDrag);
	}
	const assetElems = assets.querySelectorAll(".asset.selected, .asset.selected .asset");
	for(const assetElem of assetElems) {
		const obj = new DynamicObject(assetElem._asset.id);
		if(obj.type === "group") {
			obj.timelineItem.classList.add("open");
		}
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
		proj[sel].data.objs.unshift(obj);
	}
	timelineItemDrag.remove();
	for(const assetElem of assetElems) {
		for(const obj of assetElem._asset.objects) {
			obj.updateName();
		}
	}
	storeObjs();
	updateTimelines();
	proj[sel].saved = false;
	setActive(contentContainer);
};
