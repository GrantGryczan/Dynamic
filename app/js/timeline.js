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
const appendFrames = timeline => {
	while(timeline.children.length) {
		timeline.lastElementChild.remove();
	}
	for(let i = 0; i < timeUnits.children.length; i++) {
		timeline.appendChild(baseFrame.cloneNode(true));
	}
};
const createTimeUnit = value => {
	const timeUnit = html`<div class="timeUnit" data-value="${value}"></div>`;
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
		while(timeUnits.children.length) { // remove all if jumping range
			timeUnits.lastElementChild.remove();
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
let timelineCount = 0;
const byVisible = obj => obj.timelineItem.offsetWidth;
const baseTimeline = html`<div class="timeline"></div>`;
const baseFrame = html`<div class="frame"></div>`;
baseFrame.style.width = `${storage.frameWidth}px`;
const updateTimelines = () => {
	const objs = proj[sel].data.objs.filter(byVisible);
	const totalHeight = Math.min(24 * objs.length - 4, timelineItems.scrollHeight);
	if(timelineFiller.offsetHeight !== totalHeight) {
		timelineFiller.style.height = `${totalHeight}px`;
	}
	const count = Math.min(objs.length, Math.ceil(timelineBox.offsetHeight / 24));
	if(count !== timelineCount) {
		if(timelineCount < count) {
			const length = count - timelineCount;
			for(let i = 0; i < length; i++) {
				const timeline = baseTimeline.cloneNode(true);
				appendFrames(timeline);
				timelines.appendChild(timeline);
			}
		} else {
			const length = timelineCount - count;
			for(let i = 0; i < length; i++) {
				timelines.lastElementChild.remove();
			}
		}
		timelineCount = count;
	}
	const transform = `translateY(${24 * Math.floor(timelineBox.scrollTop / 24)}px)`;
	if(timelinesTranslateYSet || translateY.test(timelines.style.transform)) {
		timelines.style.transform = timelines.style.transform.replace(translateY, transform);
	} else {
		timelines.style.transform += ` ${transform}`;
		timelinesTranslateYSet = true;
	}
	for(const frame of timelines.querySelectorAll(".frame.focus")) {
		frame.classList.remove("focus");
	}
	for(const frame of timelines.querySelectorAll(".frame.focusHighlight")) {
		frame.classList.remove("focusHighlight");
	}
	for(const frame of timelines.querySelectorAll(".frame.selected")) {
		frame.classList.remove("selected");
	}
	for(const frame of timelines.querySelectorAll(".frame.highlight")) {
		frame.classList.remove("highlight");
	}
	const values = Object.values(proj[sel].frames);
	const start = Math.floor(timelineBox.scrollTop / 24);
	for(let i = 0; i < timelines.children.length; i++) {
		const timeline = timelines.children[i];
		timeline._obj = objs[start + i];
		timeline.id = `timeline_${timeline._obj.id}`;
		timeline.classList.remove(timeline.classList[1]);
		timeline.classList.add(timeline._obj.timelineItem.classList[1]);
		const focusHighlight = proj[sel].frames[timeline._obj.id].includes(2);
		const highlight = focusHighlight || proj[sel].frames[timeline._obj.id].includes(1);
		for(let j = 0; j < timeline.children.length; j++) {
			const frame = timeline.children[j];
			frame.id = `frame_${timeline._obj.id}_${frame._value = timeUnits.children[j]._value}`;
			if(highlight || values.find(frames => frames[frame._value])) {
				frame.classList.add("highlight");
				if(highlight && proj[sel].frames[timeline._obj.id][frame._value]) {
					frame.classList.add("selected");
				}
				if(focusHighlight || values.find(frames => frames[frame._value] === 2)) {
					frame.classList.add("focusHighlight");
					if(focusHighlight && proj[sel].frames[timeline._obj.id][frame._value] === 2) {
						frame.classList.add("focus");
					}
				}
			}
		}
	}
};
const clearFrames = () => {
	for(const obj of proj[sel].data.objs) {
		proj[sel].frames[obj.id] = new Array(proj[sel].data.duration).fill(0);
	}
};
const blurFrames = () => {
	for(const obj of proj[sel].data.objs) {
		const frames = proj[sel].frames[obj.id];
		for(let i = 0; i < frames.length; i++) {
			frames[i] = +!!frames[i];
		}
	}
};
const selectFrame = (timeline, value, button) => {
	if(typeof button !== "number") {
		button = 0;
	}
	let index = -1;
	for(const obj of proj[sel].data.objs) {
		index = proj[sel].frames[obj.id].indexOf(2);
		if(index !== -1) {
			break;
		}
	}
	if(button === 2 && !(superKey || shiftKey)) {
		if(proj[sel].frames[timeline][value]) {
			blurFrames();
		} else {
			clearFrames();
		}
		proj[sel].frames[timeline][value] = 2;
	} else if(shiftKey && index !== -1) {
		const noSuperKey = !superKey;
		let selecting = false;
		for(const obj of proj[sel].data.objs) {
			const frames = proj[sel].frames[obj.id];
			let changeSelecting = obj.id === timeline || frames.includes(2);
			if(!selecting && changeSelecting) {
				selecting = true;
				changeSelecting = obj.id === timeline && frames.includes(2);
			}
			const min = Math.min(value, index);
			const max = Math.max(value, index);
			for(let i = 0; i < frames.length; i++) {
				if(frames[i] !== 2) {
					if(selecting && i >= min && i <= max) {
						frames[i] = 1;
					} else if(noSuperKey) {
						frames[i] = 0;
					}
				}
			}
			if(selecting && changeSelecting) {
				selecting = false;
			}
		}
	} else if(superKey) {
		if(proj[sel].frames[timeline][value]) {
			proj[sel].frames[timeline][value] = 0;
		} else {
			blurFrames();
			proj[sel].frames[timeline][value] = 2;
		}
	} else {
		clearFrames();
		proj[sel].frames[timeline][value] = 2;
	}
	updateTimelines();
	setActive(timelineContainer);
};
const addDuration = quantity => {
	const moreFrames = new Array(quantity).fill(0);
	for(const frames of proj[sel].frames) {
		frames.push(...moreFrames);
	}
	proj[sel].data.duration += quantity;
	updateTimeRuler();
};
