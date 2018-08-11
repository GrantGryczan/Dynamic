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
	const totalWidth = storage.frameWidth * proj[sel].timeRulerChildren.length;
	const start = Math.floor(timeRuler.scrollLeft / storage.frameWidth);
	timeRuler.firstElementChild.style.width = `${totalWidth}px`;
	timeRuler.lastElementChild.style.width = "";
	const end = Math.min(proj[sel].timeRulerChildren.length, start + Math.ceil(timeRuler.offsetWidth / storage.frameWidth));
	removeTimeRulerChildren();
	for(let i = start; i < end; i++) {
		timeRuler.lastElementChild.before(proj[sel].timeRulerChildren[i]);
	}
	timeRuler.firstElementChild.style.width = `${storage.frameWidth * start}px`;
	timeRuler.lastElementChild.style.width = `${storage.frameWidth * (proj[sel].timeRulerChildren.length - end)}px`;
	timelines.style.width = `${totalWidth}px`;
};
const removeTimelines = () => {
	while(timelines.children.length) {
		timelines.lastElementChild.remove();
	}
};
const updateTimelines = () => {
	const totalHeight = 24 * proj[sel].timelines.length;
	const start = Math.floor(timelineBox.scrollTop / 24);
	timelines.style.marginTop = `${totalHeight}px`;
	timelines.style.marginBottom = "";
	const end = Math.min(proj[sel].timelines.length, start + Math.ceil(timelineBox.offsetHeight / 24));
	removeTimelines();
	for(let i = start; i < end; i++) {
		timelines.appendChild(proj[sel].timelines[i]);
	}
	timelines.style.marginTop = `${24 * start}px`;
	timelines.style.marginBottom = `${24 * (proj[sel].timelines.length - end) - 4}px`;
	timeRuler.classList[timelineBox.offsetHeight === timelineBox.scrollHeight ? "remove": "add"]("scrollPadding");
};
const addTimeUnits = quantity => {
	if(quantity === undefined) {
		quantity = 1;
	}
	let value = proj[sel].data.duration;
	const frame = html`<div class="frame"></div>`;
	frame.style.width = `${storage.frameWidth}px`;
	for(let i = 0; i < quantity; i++) {
		const timeUnit = html`<div class="timeUnit"></div>`;
		timeUnit.style.width = `${storage.frameWidth}px`;
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
		for(const timeline of timelines.children) {
			timeline._frames.push(frame.cloneNode(true));
		}
	}
	proj[sel].data.duration = value;
	updateTimeRuler();
};
