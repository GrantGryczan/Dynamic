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
const removeTimeRulerChildren = () => {
	for(const child of proj[sel].timeRulerChildren) {
		child.remove();
	}
};
const refreshTimeRulerChildren = () => {
	let child;
	while(child = proj[sel].timeRulerChildren.pop()) {
		child.remove();
	}
	addTimeUnits(proj[sel].data.duration);
};
const updateTimeRuler = () => {
	if(proj[sel].timeRulerChildren.length) {
		const width = proj[sel].data.fps * storage.timeUnitWidth;
		const start = Math.floor(timeRuler.scrollLeft / width);
		timeRuler.firstElementChild.style.width = `${width * proj[sel].timeRulerChildren.length}px`;
		timeRuler.lastElementChild.style.width = "";
		const end = start + Math.min(proj[sel].timeRulerChildren.length, Math.max(Math.ceil(timeRuler.offsetWidth / width), 2));
		removeTimeRulerChildren();
		for(let i = start; i < end; i++) {
			timeRuler.lastElementChild.before(proj[sel].timeRulerChildren[i]);
		}
		timeRuler.firstElementChild.style.width = `${width * start}px`;
		timeRuler.lastElementChild.style.width = `${width * (proj[sel].timeRulerChildren.length - end)}px`;
	}
};
const addTimeUnits = quantity => {
	if(quantity === undefined) {
		quantity = 1;
	}
	let value = 0;
	for(const child of proj[sel].timeRulerChildren) {
		value += child.querySelectorAll(".timeUnit").length;
	}
	for(let i = 0; i < quantity; i++) {
		let lastChild = proj[sel].timeRulerChildren[proj[sel].timeRulerChildren.length - 1];
		if(!lastChild || value % proj[sel].data.fps === 0) {
			const superGroupValue = lastChild ? lastChild._value + 1 : 0;
			const seconds = String(superGroupValue % 60);
			const timeUnitSuperGroup = html`
				<div class="timeUnitSuperGroup">
					<div class="label">${Math.floor(superGroupValue / 60)}:${(seconds.length === 1 ? "0" : "") + seconds}</div>
				</div>
			`;
			timeUnitSuperGroup._value = superGroupValue;
			proj[sel].timeRulerChildren.push(timeUnitSuperGroup);
			lastChild = timeUnitSuperGroup;
		}
		const groupFactor = value % 5 === 0; // TODO: Make that 5 dynamic
		if(!lastChild.lastElementChild.classList.contains("timeUnitGroup") || groupFactor) {
			const timeUnitGroup = html`<div class="timeUnitGroup"></div>`;
			if(groupFactor) {
				timeUnitGroup.appendChild(html`<div class="label">${storage.secondTimeRuler ? value % proj[sel].data.fps : value}</div>`);
			}
			lastChild.appendChild(timeUnitGroup);
		}
		const timeUnit = html`<div class="timeUnit"></div>`;
		timeUnit._value = value++;
		timeUnit.style.width = `${storage.timeUnitWidth}px`;
		lastChild.lastElementChild.appendChild(timeUnit);
	}
	proj[sel].data.duration = value;
	updateTimeRuler();
};
