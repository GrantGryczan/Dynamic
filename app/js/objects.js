"use strict";
const appendObj = obj => {
	let timelineItem;
	if(obj.type === "group") {
		timelineItem = html`
			<div id="timelineItem_${obj.id}" class="timelineItem typeGroup" title="$${obj.name}">
				<div class="bar">
					<div class="icon material-icons"></div>
					<div class="label">$${obj.name}</div>
					<div class="close material-icons"></div>
				</div>
				<div class="children"></div>
			</div>
		`;
	} else if(obj.type === "audio") {
		timelineItem = html`
			<div id="timelineItem_${obj.id}" class="timelineItem typeAudio" title="$${obj.name}">
				<div class="bar">
					<div class="icon material-icons"></div>
					<div class="label">$${obj.name}</div>
					<div class="close material-icons"></div>
				</div>
			</div>
		`;
	} else {
		const layer = html`
			<table>
				<tbody>
					<tr id="layer_${obj.id}" class="layer" title="$${obj.name}">
						<td class="z">${obj.z}</td>
						<td class="barCell">
							<div class="bar">
								<div class="label">$${obj.name}</div>
								<div class="close material-icons"></div>
							</div>
						</td>
					</tr>
				</tbody>
			</table>
		`.firstElementChild.firstElementChild;
		layer._obj = obj;
		let siblingElem = null;
		for(const eachLayer of layers.querySelectorAll(".layer")) {
			if(eachLayer._obj.z < obj.z) {
				siblingElem = eachLayer;
				break;
			}
		}
		layers.insertBefore(layer, siblingElem);
		if(obj.type === "obj") {
			timelineItem = html`
				<div id="timelineItem_${obj.id}" class="timelineItem typeObj" title="$${obj.name}">
					<div class="bar">
						<div class="icon material-icons"></div>
						<div class="label">$${obj.name}</div>
						<div class="close material-icons"></div>
					</div>
					<div class="children"></div>
				</div>
			`;
		} else if(obj.type === "image") {
			timelineItem = html`
				<div id="timelineItem_${obj.id}" class="timelineItem typeImage" title="$${obj.name}">
					<div class="bar">
						<div class="icon material-icons"></div>
						<div class="label">$${obj.name}</div>
						<div class="close material-icons"></div>
					</div>
				</div>
			`;
		}
	}
	timelineItem._obj = obj;
	(timelineItem._obj.parent ? timelineItem._obj.parent.timelineItemElement.lastElementChild : timelineItems).appendChild(timelineItem);
	return timelineItem;
};
const onlyGraphics = obj => obj.type === "obj" || obj.type === "image";
const byZIndex = (a, b) => b.z - a.z;
const updateLayers = () => {
	for(const obj of proj[sel].data.objs.filter(onlyGraphics).sort(byZIndex)) {
		obj.layerElement.querySelector(".z").textContent = obj.z;
		layers.appendChild(obj.layerElement);
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
	while(objElem._obj.timelineItemElement.lastElementChild.firstElementChild) {
		objElem._obj.timelineItemElement.before(objElem._obj.timelineItemElement.lastElementChild.firstElementChild);
	}
	if(onlyGraphics(objElem._obj)) {
		objElem._obj.layerElement.remove();
	}
	objElem._obj.timelineItemElement.remove();
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
				if(layer !== target) {
					layer.classList.remove("selected");
				}
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
				if(timelineItem !== target) {
					timelineItem.classList.remove("selected");
				}
			}
			target.classList.add("selected");
			proj[sel].selectedTimelineItem = target.id;
		}
	} else if(shiftKey) {
		let selecting = !proj[sel].selectedTimelineItem;
		const classListMethod = superKey && proj[sel].selectedTimelineItem && !timelineItems.querySelector(`#${proj[sel].selectedTimelineItem}`).classList.contains("selected") ? "remove" : "add";
		for(const timelineItemElem of timelineItems.querySelectorAll(".timelineItem")) {
			if(timelineItemElem.id === proj[sel].selectedTimelineItem || timelineItemElem.id === target.id) {
				if(selecting) {
					timelineItemElem.classList[classListMethod]("selected");
					selecting = false;
					continue;
				} else {
					timelineItemElem.classList[classListMethod]("selected");
					if(proj[sel].selectedTimelineItem !== target.id) {
						selecting = true;
					}
				}
			} else if(selecting) {
				timelineItemElem.classList[classListMethod]("selected");
			} else if(!superKey) {
				timelineItemElem.classList.remove("selected");
			}
		}
	} else {
		proj[sel].selectedTimelineItem = target.id;
		if(superKey) {
			target.classList.toggle("selected");
		} else {
			let othersSelected = false;
			for(const timelineItemElem of timelineItems.querySelectorAll(".timelineItem.selected")) {
				if(timelineItemElem !== target) {
					othersSelected = true;
					timelineItemElem.classList.remove("selected");
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
const getObj = id => proj[sel].data.objs.find(obj => obj.id === id);
const byDate = (a, b) => a.date - b.date;
const byZ = obj => obj.z;
class DynamicObject {
	constructor(value) {
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
		this.updateName();
		this.id = value.id || uid(proj[sel].data.objs.map(byID));
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
	get layerElement() {
		return layers.querySelector(`#layer_${this.id}`);
	}
	get timelineItemElement() {
		return timelineItems.querySelector(`#timelineItem_${this.id}`);
	}
	updateName() {
		if(this.asset) {
			this[_name] = this.asset.name;
			if(this.asset.objects.length > 1) {
				this[_name] += ` [${this.asset.objects.sort(byDate).indexOf(this) + 1}]`;
			}
		}
		if(this.timelineItemElement) {
			this.timelineItemElement.querySelector(".label").textContent = this.timelineItemElement.title = this[_name];
		}
		if(this.layerElement) {
			this.layerElement.querySelector(".label").textContent = this.layerElement.title = this[_name];
		}
	}
}
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
		const timelineItem = appendObj(obj);
		if(obj.type === "group" || obj.type === "obj") {
			timelineItem.classList.add("open");
		}
		if(assetElem[_parent]) {
			assetElem[_parent].appendChild(timelineItem);
			delete assetElem[_parent];
		} else {
			timelineItemDrag.before(timelineItem);
		}
		if(obj.type === "group") {
			for(const child of assetElem.lastElementChild.children) {
				child[_parent] = timelineItem.lastElementChild;
			}
		}
		proj[sel].data.objs.unshift(obj);
	}
	timelineItemDrag.remove();
	storeObjs();
	for(const assetElem of assetElems) {
		for(const obj of assetElem._asset.objects) {
			obj.updateName();
		}
	}
	proj[sel].saved = false;
	setActive(contentContainer);
};
