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
let oldStartFrame = 0;
let oldEndFrame = 0;
let startFrame = 0;
let endFrame = 0;
let minStartFrame = 0;
let maxStartFrame = 0;
let minEndFrame = 0;
let maxEndFrame = 0;
let frameRangeJumped = false;
let appendStartFrame = false;
let appendEndFrame = false;
let timelinesTranslateXSet = false;
let timelinesTranslateYSet = false;
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
	oldStartFrame = startFrame;
	oldEndFrame = endFrame;
	startFrame = Math.floor(timeRuler.scrollLeft / storage.frameWidth);
	endFrame = Math.min(proj[sel].data.duration, startFrame + Math.ceil(timeRuler.offsetWidth / storage.frameWidth));
	const transform = timeUnits.style.transform = `translateX(${storage.frameWidth * startFrame}px)`;
	if(timelinesTranslateXSet || translateX.test(timelines.style.transform)) {
		timelines.style.transform = timelines.style.transform.replace(translateX, transform);
	} else {
		timelines.style.transform += ` ${transform}`;
		timelinesTranslateXSet = true;
	}
	let sum = 0;
	if(proj[sel].frameRangeJumped = oldEndFrame < startFrame || oldStartFrame > endFrame) {
		for(let i = oldStartFrame; i < oldEndFrame; i++) { // remove all if jumping range
			resetTimeRuler();
			sum--;
		}
		for(let i = startFrame; i < endFrame; i++) { // add all if jumping range
			timeUnits.appendChild(createTimeUnit(i));
			sum++;
		}
	} else {
		minStartFrame = Math.min(oldStartFrame, startFrame);
		maxStartFrame = Math.max(oldStartFrame, startFrame) - 1;
		minEndFrame = Math.min(oldEndFrame, endFrame);
		maxEndFrame = Math.max(oldEndFrame, endFrame);
		if(appendStartFrame = startFrame === minStartFrame) { // add to left if extending left
			for(let i = maxStartFrame; i >= minStartFrame; i--) {
				timeUnits.firstElementChild.before(createTimeUnit(i));
				sum++;
			}
		} else {
			for(let i = timeUnits.children.length - 1; i >= 0; i--) { // remove from left if extending right
				if(timeUnits.children[i]._value >= minStartFrame && timeUnits.children[i]._value <= maxStartFrame) {
					timeUnits.children[i].remove();
					sum--;
				}
			}
		}
		if(appendEndFrame = endFrame === maxEndFrame) {
			for(let i = minEndFrame; i < maxEndFrame; i++) { // add to right if extending right
				timeUnits.appendChild(createTimeUnit(i));
				sum++;
			}
		} else {
			for(let i = timeUnits.children.length - 1; i >= 0; i--) { // remove from right if extending left
				if(timeUnits.children[i]._value >= minEndFrame && timeUnits.children[i]._value < maxEndFrame) {
					timeUnits.children[i].remove();
					sum--;
				}
			}
		}
	}
	if(sum < 0) {
		for(const timeline of timelines.children) {
			for(let i = sum; i < 0; i++) {
				timeline.lastElementChild.remove();
			}
		}
	} else if(sum > 0) {
		for(const timeline of timelines.children) {
			for(let i = 0; i < sum; i++) {
				timeline.appendChild(baseFrame.cloneNode(true));
			}
		}
	}
	updateTimelines();
};
let timelinesLength = 0;
const byVisible = obj => obj.timelineItem.offsetWidth;
const baseTimeline = html`<div class="timeline"></div>`;
const baseFrame = html`<div class="frame"></div>`;
baseFrame.style.width = `${storage.frameWidth}px`;
const updateTimelines = () => {
	const objCount = proj[sel].data.objs.filter(byVisible).length;
	const totalHeight = Math.min(24 * objCount - 4, timelineItems.scrollHeight);
	if(timelineFiller.offsetHeight !== totalHeight) {
		timelineFiller.style.height = `${totalHeight}px`;
	}
	const length = Math.min(objCount, Math.ceil(timelineBox.offsetHeight / 24));
	if(length !== timelinesLength) {
		if(timelinesLength < length) {
			const count = length - timelinesLength;
			for(let i = 0; i < count; i++) {
				const timeline = baseTimeline.cloneNode(true);
				appendFrames(timeline);
				timelines.appendChild(timeline);
			}
		} else {
			const count = timelinesLength - length;
			for(let i = 0; i < count; i++) {
				timelines.lastElementChild.remove();
			}
		}
		timelinesLength = length;
	}
	const transform = `translateY(${24 * Math.floor(timelineBox.scrollTop / 24)}px)`;
	if(timelinesTranslateYSet || translateY.test(timelines.style.transform)) {
		timelines.style.transform = timelines.style.transform.replace(translateY, transform);
	} else {
		timelines.style.transform += ` ${transform}`;
		timelinesTranslateYSet = true;
	}
	// TODO: update contents of frames
};
const appendFrames = timeline => {
	while(timeline.children.length) {
		timeline.lastElementChild.remove();
	}
	for(let i = 0; i < timeUnits.children.length; i++) {
		timeline.appendChild(baseFrame.cloneNode(true));
	}
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
};
