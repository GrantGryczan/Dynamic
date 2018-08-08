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
	const duration = proj[sel].data.duration;
	proj[sel].data.duration = 0;
	let child;
	while(child = proj[sel].timeRulerChildren.pop()) {
		child.remove();
	}
	addTimeUnits(duration);
};
const updateTimeRuler = () => {
	if(proj[sel].timeRulerChildren.length) {
		const start = Math.floor(timeRuler.scrollLeft / storage.timeUnitWidth);
		timeRuler.firstElementChild.style.width = `${storage.timeUnitWidth * proj[sel].timeRulerChildren.length}px`;
		timeRuler.lastElementChild.style.width = "";
		const end = start + Math.min(proj[sel].timeRulerChildren.length, Math.max(Math.ceil(timeRuler.offsetWidth / storage.timeUnitWidth), 2));
		removeTimeRulerChildren();
		for(let i = start; i < end; i++) {
			timeRuler.lastElementChild.before(proj[sel].timeRulerChildren[i]);
		}
		timeRuler.firstElementChild.style.width = `${storage.timeUnitWidth * start}px`;
		timeRuler.lastElementChild.style.width = `${storage.timeUnitWidth * (proj[sel].timeRulerChildren.length - end)}px`;
	}
};
const addTimeUnits = quantity => {
	if(quantity === undefined) {
		quantity = 1;
	}
	let value = proj[sel].data.duration;
	for(let i = 0; i < quantity; i++) {
		const timeUnit = html`<div class="timeUnit"></div>`;
		timeUnit.style.width = `${storage.timeUnitWidth}px`;
		if(value % 5 === 0) { // TODO: Make that 5 dynamic
			timeUnit.appendChild(html`
				<div class="timeUnitLabel">
					<div class="label">${storage.secondTimeRuler ? value % proj[sel].data.fps : value}</div>
				</div>
			`);
		}
		if(value % proj[sel].data.fps === 0) {
			const timeLabelValue = value / proj[sel].data.fps;
			const seconds = String(timeLabelValue % 60);
			const timeLabel = html`
				<div class="timeLabel">
					<div class="label">${Math.floor(timeLabelValue / 60)}:${(seconds.length === 1 ? "0" : "") + seconds}</div>
				</div>
			`;
			timeLabel._value = timeLabelValue;
			timeUnit.appendChild(timeLabel);
		}
		timeUnit._value = value++;
		proj[sel].timeRulerChildren.push(timeUnit);
	}
	proj[sel].data.duration = value;
	updateTimeRuler();
};
