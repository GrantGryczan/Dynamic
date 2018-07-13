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
const storeObjs = () => {
	// TODO: Continue
};
const removeObj = objElem => {
	if(`obj_${objElem[_obj].id}` === proj[sel].selectedAsset) {
		proj[sel].selectedAsset = null;
	}
	if(objElem[_obj].group) {
		objElem.lastElementChild.children.forEach(objElem.before.bind(objElem));
	}
	objElem.remove();
	updateProperties();
};
const confirmRemoveObj = objElem => {
	const actuallyRemoveObj = value => {
		if(value === 0) {
			removeObj(objElem);
			storeObjs();
		}
	};
	if(objElem[_obj].group) {
		new Miro.Dialog("Remove Group", html`
			Are you sure you want to remove <span class="bold">${objElem[_obj].name}</span>?<br>
			All objects inside the group will be taken out.
		`, ["Yes", "No"]).then(actuallyRemoveObj);
	} else {
		new Miro.Dialog("Remove Object", html`
			Are you sure you want to remove <span class="bold">${objElem[_obj].name}</span>?<br>
			This cannot be undone.
		`, ["Yes", "No"]).then(actuallyRemoveObj);
	}
};
const confirmRemoveObjs = objElems => {
	if(objElems.length === 1) {
		confirmRemoveObj(objElems[0]);
	} else if(objElems.length > 1) {
		new Miro.Dialog("Remove Objects", html`
			Are you sure you want to remove all those objects?<br>
			This cannot be undone.
		`, ["Yes", "No"]).then(value => {
			if(value === 0) {
				objElems.forEach(removeObj);
				storeObjs();
			}
		});
	}
};
const getObj = id => proj[sel].data.objs.find(obj => obj.id === id);
const byZ = obj => obj.z;
class DynamicObject {
	constructor(value) {
		if(typeof value === "string") {
			if((this.asset = getAsset(value)).type === "group") {
				throw new MiroError("Objects cannot reference asset groups.");
			}
			const maxZ = Math.max(...proj[sel].data.objs.map(byZ));
			this.z = isFinite(maxZ) ? maxZ + 1 : 1;
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
		return this.asset.name;
	}
	get layerElement() {
		return layers.querySelector(`#layer_${this.id}`);
	}
}
const addToCanvas = () => {
	for(const assetElem of assets.querySelectorAll(".asset:not(.typeGroup).selected")) {
		appendLayer(new DynamicObject(assetElem[_asset].id));
	}
	setActive(contentContainer);
};
