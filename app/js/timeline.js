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
const updateTimeRuler = () => {
	if(proj[sel].timeRulerChildren.length) {
		const width = 600;
		const start = Math.floor(timeRuler.scrollLeft / width);
		timeRuler.firstElementChild.style.width = `${width * proj[sel].timeRulerChildren.length}px`;
		timeRuler.lastElementChild.style.width = "";
		const end = start + Math.min(proj[sel].timeRulerChildren.length, Math.max(Math.ceil(timeRuler.offsetWidth / width), 2));
		for(const child of proj[sel].timeRulerChildren) {
			child.remove();
		}
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
			let mins = String(Math.floor(superGroupValue % 3600 / 60));
			let seconds = String(superGroupValue % 60);
			const timeUnitSuperGroup = html`
				<div class="timeUnitSuperGroup">
					<div class="label">${Math.floor(superGroupValue / 3600)}:${(mins.length === 1 ? "0" : "") + mins}:${(seconds.length === 1 ? "0" : "") + seconds}</div>
				</div>
			`;
			timeUnitSuperGroup._value = superGroupValue;
			proj[sel].timeRulerChildren.push(timeUnitSuperGroup);
			lastChild = timeUnitSuperGroup;
		}
		const noLastTimeUnitGroup = !lastChild.lastElementChild.classList.contains("timeUnitGroup");
		const lastTimeUnits = lastChild.lastElementChild.querySelectorAll(".timeUnit");
		if(noLastTimeUnitGroup || lastTimeUnits.length >= 5) {
			lastChild.appendChild(html`
				<div class="timeUnitGroup">
					<div class="label">${storage.secondTimeRuler ? value % proj[sel].data.fps : value}</div>
				</div>
			`);
		}
		const timeUnit = html`<div class="timeUnit"></div>`;
		timeUnit._value = value++;
		lastChild.lastElementChild.appendChild(timeUnit);
	}
	proj[sel].data.duration = value;
	updateTimeRuler();
};
