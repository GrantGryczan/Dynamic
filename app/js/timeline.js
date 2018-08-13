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
const resetTimeRuler = () => {
	while(timeUnits.children.length) {
		timeUnits.lastElementChild.remove();
	}
};
const refreshTimeRulerChildren = () => {
	const duration = proj[sel].data.duration;
	proj[sel].data.duration = 0;
	resetTimeRuler();
	addTimeUnits(duration);
};
const updateTimeRuler = () => {
	const totalWidth = storage.frameWidth * proj[sel].data.duration;
	if(timeRulerFiller.offsetWidth !== totalWidth) {
		timeRulerFiller.style.width = timelineFiller.style.width = `${totalWidth}px`;
	}
	proj[sel].oldStartFrame = proj[sel].startFrame;
	proj[sel].oldEndFrame = proj[sel].endFrame;
	proj[sel].startFrame = Math.floor(timeRuler.scrollLeft / storage.frameWidth);
	proj[sel].endFrame = Math.min(proj[sel].data.duration, proj[sel].startFrame + Math.ceil(timeRuler.offsetWidth / storage.frameWidth));
	if(proj[sel].frameRangeJumped = proj[sel].oldEndFrame < proj[sel].startFrame || proj[sel].oldStartFrame > proj[sel].endFrame) {
		for(let i = proj[sel].oldStartFrame; i < proj[sel].oldEndFrame; i++) { // remove all if jumping range
			resetTimeRuler();
		}
		for(let i = proj[sel].startFrame; i < proj[sel].endFrame; i++) { // add all if jumping range
			timeUnits.appendChild(createTimeUnit(i));
		}
	} else {
		proj[sel].minStartFrame = Math.min(proj[sel].oldStartFrame, proj[sel].startFrame);
		proj[sel].maxStartFrame = Math.max(proj[sel].oldStartFrame, proj[sel].startFrame) - 1;
		proj[sel].minEndFrame = Math.min(proj[sel].oldEndFrame, proj[sel].endFrame);
		proj[sel].maxEndFrame = Math.max(proj[sel].oldEndFrame, proj[sel].endFrame);
		if(proj[sel].appendStartFrame = proj[sel].startFrame === proj[sel].minStartFrame) { // add to left if extending left
			for(let i = proj[sel].maxStartFrame; i >= proj[sel].minStartFrame; i--) {
				timeUnits.firstElementChild.before(createTimeUnit(i));
			}
		} else {
			for(let i = timeUnits.children.length - 1; i >= 0; i--) { // remove from left if extending right
				if(timeUnits.children[i]._value >= proj[sel].minStartFrame && timeUnits.children[i]._value <= proj[sel].maxStartFrame) {
					timeUnits.children[i].remove();
				}
			}
		}
		if(proj[sel].appendEndFrame = proj[sel].endFrame === proj[sel].maxEndFrame) {
			for(let i = proj[sel].minEndFrame; i < proj[sel].maxEndFrame; i++) { // add to right if extending right
				timeUnits.appendChild(createTimeUnit(i));
			}
		} else {
			for(let i = timeUnits.children.length - 1; i >= 0; i--) { // remove from right if extending left
				if(timeUnits.children[i]._value >= proj[sel].minEndFrame && timeUnits.children[i]._value < proj[sel].maxEndFrame) {
					timeUnits.children[i].remove();
				}
			}
		}
	}
	const transform = timeUnits.style.transform = `translateX(${storage.frameWidth * proj[sel].startFrame}px)`;
	if(proj[sel].timelinesTranslateXSet || translateX.test(timelines.style.transform)) {
		timelines.style.transform = timelines.style.transform.replace(translateX, transform);
	} else {
		timelines.style.transform += ` ${transform}`;
		proj[sel].timelinesTranslateXSet = true;
	}
	updateFrames();
};
const updateTimelines = () => {
	const totalHeight = 24 * proj[sel].data.objs.length - 4;
	if(timelineFiller.offsetHeight !== totalHeight) {
		timelineFiller.style.height = `${totalHeight}px`;
	}
	const startTimeline = Math.floor(timelineBox.scrollTop / 24);
	const endTimeline = Math.min(proj[sel].data.objs.length, startTimeline + Math.ceil(timelineBox.offsetHeight / 24));
	while(timelines.children.length) {
		timelines.lastElementChild.remove();
	}
	for(let i = startTimeline; i < endTimeline; i++) {
		if(proj[sel].data.objs[i].timelineItem.offsetWidth) {
			timelines.appendChild(proj[sel].data.objs[i].timeline);
		}
	}
	const transform = `translateY(${24 * startTimeline}px)`;
	if(proj[sel].timelinesTranslateYSet || translateY.test(timelines.style.transform)) {
		timelines.style.transform = timelines.style.transform.replace(translateY, transform);
	} else {
		timelines.style.transform += ` ${transform}`;
		proj[sel].timelinesTranslateYSet = true;
	}
};
const updateFrames = () => {
	
};
const createTimeUnit = value => {
	const timeUnit = html`<div class="timeUnit"></div>`;
	timeUnit._value = value;
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
	return timeUnit;
}
const addTimeUnits = quantity => {
	if(quantity === undefined) {
		quantity = 1;
	}
	proj[sel].data.duration += quantity;
	updateTimeRuler();
	updateFrames();
	const frame = html`<div class="frame"></div>`;
	frame.style.width = `${storage.frameWidth}px`;
	for(const obj of proj[sel].data.objs) {
		for(let i = 0; i < quantity; i++) {
			obj.frames.push(frame.cloneNode(true));
		}
	}
};
