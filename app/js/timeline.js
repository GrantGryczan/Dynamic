"use strict";
const assetLink = (asset, selected) => {
	
};
const rootAsset = asset => {
	if(asset && proj[sel].rootAsset === asset.id) {
		return;
	}
	openAsset(asset, true, true);
	if(asset) {
		proj[sel].rootAsset = asset.id;
	} else {
		delete proj[sel].rootAsset;
	}
};
const openAsset = (asset, selected, finish) => {
	if(asset) {
		proj[sel].openAsset = asset.id;
		assetLink(asset, selected);
		if(finish) {
			// TODO
		}
	} else {
		delete proj[sel].openAsset;
	}
};
const addTimeUnits = quantity => {
	if(!quantity) {
		quantity = 1;
	}
	for(let i = 0; i < quantity; i++) {
		if(!timelineRuler.lastElementChild || timelineRuler.lastElementChild.querySelectorAll(".timeUnit").length === 5) {
			const value = timelineRuler.lastElementChild ? timelineRuler.lastElementChild[_value] + 5 : 0;
			const timeUnitGroup = html`
				<div class="timeUnitGroup"><div class="label">${value}</div><div class="timeUnit"></div></div>
			`;
			timeUnitGroup[_value] = value;
			timelineRuler.appendChild(timeUnitGroup);
		} else {
			timelineRuler.lastElementChild.appendChild(html`
				<div class="timeUnit"></div>
			`);
		}
	}
};
const removeTimeUnits = quantity => {
	if(!quantity) {
		quantity = Infinity;
	}
	for(let i = 0; i < quantity; i++) {
		if(timelineRuler.lastElementChild) {
			const timeUnitAmount = timelineRuler.lastElementChild.querySelectorAll(".timeUnit").length;
			if(timeUnitAmount) {
				if(timeUnitAmount === 1) {
					timelineRuler.lastElementChild.remove();
				} else {
					timelineRuler.lastElementChild.lastElementChild.remove();
				}
			}
		} else {
			return;
		}
	}
};
