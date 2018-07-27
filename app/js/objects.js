"use strict";
const appendObj = obj => {
	let timelineItem;
	if(obj.group) {
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
	}
	timelineItem._obj = obj;
	(timelineItem._obj.parent ? timelineItem._obj.parent.timelineItemElement.lastElementChild : timelineItems).appendChild(timelineItem);
	return timelineItem;
};
const byZIndex = (a, b) => b.z - a.z;
const updateLayers = () => {
	for(const obj of proj[sel].data.objs.sort(byZIndex)) {
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
		timelineItem._obj.updateName();
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
	if(objElem._obj.group) {
		objElem._obj.timelineItemElement.lastElementChild.children.forEach(objElem._obj.timelineElement.before.bind(objElem._obj.timelineElement));
	}
	objElem._obj.layerElement.remove();
	objElem._obj.timelineItemElement.remove();
};
const confirmRemoveObjElem = objElem => {
	const actuallyRemoveObjElem = value => {
		if(value === 0) {
			removeObj(objElem);
			storeObjs();
			updateProperties();
		}
	};
	if(objElem._obj.group) {
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
			}
		}
	}
	setActive(layerContainer);
};
const removeSelectedTimelineItems = () => {
	confirmRemoveObjElems(timelineItems.querySelectorAll(".timelineItem.selected"));
};
const getObj = id => proj[sel].data.objs.find(obj => obj.id === id);
const byDate = (a, b) => a.date - b.date;
const byZ = obj => obj.z;
class DynamicObject {
	constructor(value) {
		if(typeof value === "string") {
			if((this.asset = getAsset(value)).type === "group") {
				throw new MiroError("Objects cannot reference asset groups.");
			}
			this.date = Date.now();
			const maxZ = Math.max(...proj[sel].data.objs.map(byZ));
			this.z = isFinite(maxZ) ? maxZ + 1 : 1; // set property
			proj[sel].data.objs.unshift(this);
		} else if(value instanceof Object) {
			Object.assign(this, value);
			if(value.parent) {
				this.parent = getObj(value.parent);
			}
			if(value.asset) {
				this.asset = getAsset(value.asset);
			}
		} else {
			throw new MiroError("The `value` parameter must be an object or a string of an asset ID.");
		}
		this.id = value.id || uid(proj[sel].data.objs.map(byID));
	}
	toJSON() {
		const obj = {
			...this,
			asset: this.asset.id
		};
		if(this.parent) {
			obj.parent = this.parent.id;
		}
		return obj;
	}
	get name() {
		let name = this.asset.name;
		if(this.asset.objects.length > 1) {
			name += ` [${this.asset.objects.sort(byDate).indexOf(this) + 1}]`;
		}
		return name;
	}
	get layerElement() {
		return layers.querySelector(`#layer_${this.id}`);
	}
	get timelineItemElement() {
		return timelineItems.querySelector(`#timelineItem_${this.id}`);
	}
	updateName() {
		this.layerElement.querySelector(".label").textContent = this.layerElement.title = this.timelineItemElement.querySelector(".label").textContent = this.timelineItemElement.title = this.name;
	}
}
const addToCanvas = () => {
	for(const assetElem of assets.querySelectorAll(".asset:not(.typeGroup).selected")) {
		const obj = new DynamicObject(assetElem._asset.id);
		const timelineItem = appendObj(obj);
		if(obj.group) {
			timelineItem.classList.add("open");
		}
		timelineItems.firstElementChild.before(timelineItem);
		if(obj.asset.objects.length > 1) {
			for(const otherObj of obj.asset.objects) {
				otherObj.updateName();
			}
		}
	}
	proj[sel].saved = false;
	setActive(contentContainer);
};
