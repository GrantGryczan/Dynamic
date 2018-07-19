"use strict";
const appendLayer = obj => {
	const layerElem = html`
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
	layerElem[_obj] = obj;
	let siblingElem = null;
	for(const eachLayerElem of layers.querySelectorAll(".layer")) {
		if(eachLayerElem[_obj].z < obj.z) {
			siblingElem = eachLayerElem;
			break;
		}
	}
	layers.insertBefore(layerElem, siblingElem);
	return layerElem;
};
const byZIndex = (a, b) => b.z - a.z;
const updateLayers = () => {
	for(const obj of proj[sel].data.objs.sort(byZIndex)) {
		obj.layerElement.querySelector(".z").textContent = obj.z;
		layers.appendChild(obj.layerElement);
	}
};
const storeObjs = () => {
	// TODO
	proj[sel].saved = false;
};
const removeObj = layerElem => {
	if(proj[sel].selectedTimeline === `timeline_${layerElem[_obj].id}`) {
		proj[sel].selectedTimeline = null;
	}
	if(proj[sel].selectedLayer === `layer_${layerElem[_obj].id}`) {
		proj[sel].selectedLayer = null;
	}
	if(layerElem[_obj].group) {
		layerElem[_obj].timelineElement.lastElementChild.children.forEach(layerElem[_obj].timelineElement.before.bind(layerElem[_obj].timelineElement));
	}
	layerElem.remove();
	// TODO: layerElem[_obj].timelineElement.remove();
	storeObjs();
	for(const otherObj of layerElem[_obj].asset.objects) {
		otherObj.updateName();
	}
	updateProperties();
};
const confirmRemoveObj = layerElem => {
	const actuallyRemoveObj = value => {
		if(value === 0) {
			removeObj(layerElem);
			storeObjs();
		}
	};
	if(layerElem[_obj].group) {
		new Miro.Dialog("Remove Group", html`
			Are you sure you want to remove <span class="bold">${layerElem[_obj].name}</span>?<br>
			All objects inside the group will be taken out.
		`, ["Yes", "No"]).then(actuallyRemoveObj);
	} else {
		new Miro.Dialog("Remove Object", html`
			Are you sure you want to remove <span class="bold">${layerElem[_obj].name}</span>?<br>
			This cannot be undone.
		`, ["Yes", "No"]).then(actuallyRemoveObj);
	}
};
const confirmRemoveObjs = layerElems => {
	if(layerElems.length === 1) {
		confirmRemoveObj(layerElems[0]);
	} else if(layerElems.length > 1) {
		new Miro.Dialog("Remove Objects", html`
			Are you sure you want to remove all those objects?<br>
			This cannot be undone.
		`, ["Yes", "No"]).then(value => {
			if(value === 0) {
				layerElems.forEach(removeObj);
				storeObjs();
			}
		});
	}
};
const removeSelectedLayers = () => {
	confirmRemoveObjs(layers.querySelectorAll(".layer.selected"));
};
const deselectLayers = () => {
	for(const layerElem of layers.querySelectorAll(".layer.selected")) {
		layerElem.classList.remove("selected");
		layerElem.classList.remove("focus");
	}
	proj[sel].selectedLayer = null;
};
const selectLayer = (target, evtButton) => {
	if(typeof evtButton !== "number") {
		evtButton = 0;
	}
	if(evtButton === 2 && !(superKey || shiftKey)) {
		if(!target.classList.contains("selected")) {
			for(const layerElem of layers.querySelectorAll(".layer.selected")) {
				if(layerElem !== target) {
					layerElem.classList.remove("selected");
				}
			}
			target.classList.add("selected");
			proj[sel].selectedLayer = target.id;
		}
	} else if(shiftKey) {
		let selecting = !proj[sel].selectedLayer;
		const classListMethod = superKey && proj[sel].selectedLayer && !layers.querySelector(`#${proj[sel].selectedLayer}`).classList.contains("selected") ? "remove" : "add";
		for(const layerElem of layers.querySelectorAll(".layer")) {
			if(layerElem.id === proj[sel].selectedLayer || layerElem.id === target.id) {
				if(selecting) {
					layerElem.classList[classListMethod]("selected");
					selecting = false;
					continue;
				} else {
					layerElem.classList[classListMethod]("selected");
					if(proj[sel].selectedLayer !== target.id) {
						selecting = true;
					}
				}
			} else if(selecting) {
				layerElem.classList[classListMethod]("selected");
			} else if(!superKey) {
				layerElem.classList.remove("selected");
			}
		}
	} else {
		proj[sel].selectedLayer = target.id;
		if(superKey) {
			target.classList.toggle("selected");
		} else {
			let othersSelected = false;
			for(const layerElem of layers.querySelectorAll(".layer.selected")) {
				if(layerElem !== target) {
					othersSelected = true;
					layerElem.classList.remove("selected");
				}
			}
			if(target.classList[othersSelected ? "add" : "toggle"]("selected") === false) {
				proj[sel].selectedLayer = null;
			}
		}
	}
	setActive(layerContainer);
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
	get timelineElement() {
		return layers.querySelector(`#timeline_${this.id}`);
	}
	updateName() {
		const label = this.layerElement.querySelector(".label");
		label.textContent = this.layerElement.title = this.name; // TODO: Update other labels
	}
}
const addToCanvas = () => {
	for(const assetElem of assets.querySelectorAll(".asset:not(.typeGroup).selected")) {
		const obj = new DynamicObject(assetElem[_asset].id);
		appendLayer(obj);
		if(obj.asset.objects.length > 1) {
			for(const otherObj of obj.asset.objects) {
				otherObj.updateName();
			}
		}
	}
	proj[sel].saved = false;
	setActive(contentContainer);
};
