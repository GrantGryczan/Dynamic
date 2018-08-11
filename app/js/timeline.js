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
const refreshTimeRulerChildren = () => {
	const duration = proj[sel].data.duration;
	proj[sel].data.duration = 0;
	let child;
	while(child = proj[sel].timeRulerChildren.pop()) {
		child.remove();
	}
	addTimeUnits(duration);
};
let oldStartFrame = 0;
let oldEndFrame = 0;
let startFrame = 0;
let endFrame = 0;
let minStartFrame = 0;
let maxStartFrame = 0;
let minEndFrame = 0;
let maxEndFrame = 0;
let appendStartFrame = false;
let appendEndFrame = false;
const updateTimeRuler = () => {
	oldStartFrame = startFrame;
	oldEndFrame = endFrame;
	const totalWidth = storage.frameWidth * proj[sel].timeRulerChildren.length;
	startFrame = Math.floor(timeRuler.scrollLeft / storage.frameWidth);
	timeRuler.firstElementChild.style.width = `${totalWidth}px`;
	timeRuler.lastElementChild.style.width = "";
	endFrame = Math.min(proj[sel].timeRulerChildren.length, startFrame + Math.ceil(timeRuler.offsetWidth / storage.frameWidth));
	minStartFrame = Math.min(oldStartFrame, startFrame);
	maxStartFrame = Math.max(oldStartFrame, startFrame) - 1;
	minEndFrame = Math.min(oldEndFrame, endFrame);
	maxEndFrame = Math.max(oldEndFrame, endFrame);
	if(appendStartFrame = startFrame === minStartFrame) {
		for(let i = maxStartFrame; i >= minStartFrame; i--) {
			timeRuler.firstElementChild.after(proj[sel].timeRulerChildren[i]);
		}
	} else {
		for(let i = maxStartFrame; i >= minStartFrame; i--) {
			proj[sel].timeRulerChildren[i].remove();
		}
	}
	if(appendEndFrame = endFrame === maxEndFrame) {
		for(let i = minEndFrame; i < maxEndFrame; i++) {
			timeRuler.lastElementChild.before(proj[sel].timeRulerChildren[i]);
		}
	} else {
		for(let i = minEndFrame; i < maxEndFrame; i++) {
			proj[sel].timeRulerChildren[i].remove();
		}
	}
	timeRuler.firstElementChild.style.width = `${storage.frameWidth * startFrame}px`;
	timeRuler.lastElementChild.style.width = `${storage.frameWidth * (proj[sel].timeRulerChildren.length - endFrame)}px`;
	timelines.style.width = `${storage.frameWidth * (endFrame - startFrame)}px`;
	updateFrames();
};
const updateTimelines = () => {
	const totalHeight = 24 * proj[sel].data.objs.length;
	const startTimeline = Math.floor(timelineBox.scrollTop / 24);
	timelines.style.marginTop = `${totalHeight}px`;
	timelines.style.marginBottom = "";
	const endTimeline = Math.min(proj[sel].data.objs.length, startTimeline + Math.ceil(timelineBox.offsetHeight / 24));
	while(timelines.children.length) {
		timelines.lastElementChild.remove();
	}
	for(let i = startTimeline; i < endTimeline; i++) {
		if(proj[sel].data.objs[i].timelineItem.offsetWidth) {
			timelines.appendChild(proj[sel].data.objs[i].timeline);
			proj[sel].data.objs[i].updateFrames();
		}
	}
	timelines.style.marginTop = `${24 * startTimeline}px`;
	timelines.style.marginBottom = `${24 * (proj[sel].data.objs.length - endTimeline) - 4}px`;
};
const updateFrames = () => {
	for(const obj of proj[sel].data.objs) {
		obj.updateFrames();
	}
	timelines.style.marginLeft = `${storage.frameWidth * startFrame}px`;
	timelines.style.marginRight = `${storage.frameWidth * (proj[sel].timeRulerChildren.length - endFrame)}px`;
};
const addTimeUnits = quantity => {
	if(quantity === undefined) {
		quantity = 1;
	}
	let value = proj[sel].data.duration;
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
	}
	proj[sel].data.duration = value;
	const frame = html`<div class="frame"></div>`;
	frame.style.width = `${storage.frameWidth}px`;
	for(const obj of proj[sel].data.objs) {
		for(let i = 0; i < quantity; i++) {
			obj.frames.push(frame.cloneNode(true));
		}
	}
	updateTimeRuler();
};
