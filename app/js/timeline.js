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
	endFrame = Math.min(proj[sel].data.duration, startFrame + Math.ceil((timeRuler.offsetWidth - SCROLLBAR_SIZE) / storage.frameWidth) + 1);
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
	updateLoop();
};
let timelineCount = 0;
const byVisible = obj => obj.timelineItem.offsetWidth;
const baseTimeline = html`<div class="timeline"></div>`;
const baseFrame = html`<div class="frame"></div>`;
baseFrame.style.width = `${storage.frameWidth}px`;
const updateTimelines = () => {
	const objs = proj[sel].data.objs.filter(byVisible);
	const totalHeight = timelineItems.scrollHeight - SCROLLBAR_SIZE;
	if(timelineFiller.offsetHeight !== totalHeight) {
		timelineFiller.style.height = `${totalHeight}px`;
	}
	const start = Math.floor(timelineBox.scrollTop / 24);
	const count = Math.min(objs.length - start, Math.ceil((timelineBox.offsetHeight - SCROLLBAR_SIZE) / 24) + 1);
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
	for(let i = 0; i < timelines.children.length; i++) {
		const timeline = timelines.children[i];
		timeline.id = `timeline_${(timeline._obj = objs[start + i]).id}`;
	}
	for(const obj of proj[sel].data.objs) {
		const focusHighlight = proj[sel].frames[obj.id].includes(2);
		const highlight = focusHighlight || proj[sel].frames[obj.id].includes(1);
		obj.timelineItem.classList[highlight ? "add" : "remove"]("selected");
		const timeline = obj.timeline;
		if(timeline) {
			timeline.classList.remove(timeline.classList[1]);
			timeline.classList.add(obj.timelineItem.classList[1]);
			for(let i = 0; i < timeline.children.length; i++) {
				const frame = timeline.children[i];
				frame.id = `frame_${obj.id}_${frame._value = timeUnits.children[i]._value}`;
				const currentTime = proj[sel].time === frame._value;
				if(highlight || currentTime || values.find(frames => frames[frame._value])) {
					frame.classList.add("highlight");
					if(highlight && proj[sel].frames[obj.id][frame._value]) {
						frame.classList.add("selected");
					}
					if(focusHighlight || currentTime) {
						frame.classList.add("focusHighlight");
						if(focusHighlight && proj[sel].frames[obj.id][frame._value] === 2) {
							frame.classList.add("focus");
						}
					}
				}
			}
		}
	}
	updateTimeUnits();
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
const getTopFrames = () => {
	const topFrames = new Array(proj[sel].data.duration).fill(0);
	for(const obj of proj[sel].data.objs) {
		const frames = proj[sel].frames[obj.id];
		for(let i = 0; i < frames.length; i++) {
			topFrames[i] = Math.max(topFrames[i], frames[i]);
		}
	}
	topFrames[proj[sel].time] = 2;
	return topFrames;
};
const focusFrame = (timeline, value) => {
	proj[sel].focusedTimelineItem = `timelineItem_${timeline}`;
	proj[sel].frames[timeline][value] = 2;
	proj[sel].time = value;
};
const selectFrame = (timeline, value, button, shift) => {
	if(typeof button !== "number") {
		button = 0;
	}
	if(shift === undefined) {
		shift = shiftKey;
	}
	let index = -1;
	for(const obj of proj[sel].data.objs) {
		index = proj[sel].frames[obj.id].indexOf(2);
		if(index !== -1) {
			break;
		}
	}
	if(button === 2 && !(superKey || shift)) {
		if(proj[sel].frames[timeline][value]) {
			blurFrames();
		} else {
			clearFrames();
		}
		focusFrame(timeline, value);
	} else if(shift && index !== -1) {
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
			focusFrame(timeline, value);
		}
	} else {
		if(!proj[sel].frames[timeline][value]) {
			clearFrames();
		} else {
			blurFrames();
		}
		focusFrame(timeline, value);
	}
	scrollFrameIntoView(value);
	setActive(timelineContainer);
};
const moveFrameStates = change => {
	change = ((-change % proj[sel].data.duration) + proj[sel].data.duration) % proj[sel].data.duration;
	for(const obj of proj[sel].data.objs) {
		const frames = proj[sel].frames[obj.id];
		frames.push(...frames.splice(0, change));
	}
};
const setTime = value => {
	if(proj[sel].loop) {
		const rangeSize = proj[sel].loop[1] - proj[sel].loop[0];
		value = (((value - proj[sel].loop[0]) % rangeSize + rangeSize) % rangeSize) + proj[sel].loop[0];
	} else {
		value = value % proj[sel].data.duration;
	}
	moveFrameStates(value - proj[sel].time);
	proj[sel].time = value;
	scrollFrameIntoView();
};
const addDuration = quantity => {
	const moreFrames = new Array(quantity).fill(0);
	for(const obj of proj[sel].data.objs) {
		proj[sel].frames[obj.id].push(...moreFrames);
	}
	proj[sel].data.duration += quantity;
	updateTimeRuler();
};
const scrollFrameIntoView = value => {
	if(value === undefined) {
		value = proj[sel].time;
	}
	const left = storage.frameWidth * value - timeRuler.scrollLeft;
	let offset;
	if(left < 1) {
		timeRuler.scrollLeft = timelineBox.scrollLeft += left;
		scrollTimeRuler = scrollTimelines = true;
	} else if(left > (offset = timeRuler.offsetWidth - 2 - storage.frameWidth - SCROLLBAR_SIZE) - 1) {
		timeRuler.scrollLeft = timelineBox.scrollLeft += left - offset;
		scrollTimeRuler = scrollTimelines = true;
	}
	updateTimeRuler();
};
const updateTimeUnits = () => {
	const topFrames = getTopFrames();
	let currentTime = false;
	for(const timeUnit of timeUnits.children) {
		timeUnit.classList[topFrames[timeUnit._value] ? "add" : "remove"]("selected");
		timeUnit.classList[proj[sel].time === timeUnit._value ? "add" : "remove"]("focus");
	}
	scrubber.style.transform = `translateX(${storage.frameWidth * proj[sel].time + storage.frameWidth / 2 - timeRuler.scrollLeft}px)`;
	currentFrame.max = proj[sel].data.duration - 1;
	currentFrame.value = proj[sel].time;
};
const endFrameJump = () => {
	setTime((proj[sel].loop ? proj[sel].loop[1] : proj[sel].data.duration) - 1);
	if(!proj[sel].loop) {
		pause();
	}
};
const homeFrameJump = () => {
	setTime(proj[sel].loop ? proj[sel].loop[0] : 0);
};
const leftFrameJump = () => {
	setTime(proj[sel].time - 1);
};
const rightFrameJump = () => {
	setTime(proj[sel].time + 1);
};
const updateLoop = () => {
	if(proj[sel].loop) {
		enableLoop.classList.add("hidden");
		disableLoop.classList.remove("hidden");
		loopRangeStart.style.width = `${proj[sel].loop[0] === 0 ? 0 : storage.frameWidth * proj[sel].loop[0] + 1}px`;
		loopRangeStart.style.marginRight = `${storage.frameWidth * (proj[sel].loop[1] - proj[sel].loop[0]) - (proj[sel].loop[0] === 0 ? 2 : 1)}px`;
		loopField.classList.remove("hidden");
	} else {
		enableLoop.classList.remove("hidden");
		disableLoop.classList.add("hidden");
		loopField.classList.add("hidden");
	}
};
const setLoop = () => {
	let value;
	if(mouseTarget === loopRangeStart) {
		value = proj[sel].loop[0] = Math.max(0, Math.min(proj[sel].loop[1] - 1, Math.floor((mouseX - timeRuler.getBoundingClientRect().left + timeRuler.scrollLeft) / storage.frameWidth + 1)));
	} else {
		value = proj[sel].loop[1] = Math.max(proj[sel].loop[0] + 1, Math.min(proj[sel].data.duration, Math.floor((mouseX - 1 - timeRuler.getBoundingClientRect().left + timeRuler.scrollLeft) / storage.frameWidth)));
	}
	scrollFrameIntoView(value);
	updateLoop();
};
const insertFrames = (toRight, quantity) => {
	const topFrames = getTopFrames();
	let value = -1;
	const noQuantity = typeof quantity !== "number";
	if(noQuantity) {
		quantity = 0;
	}
	for(let i = 0; i < topFrames.length; i++) {
		if(topFrames[i]) {
			if(toRight || value === -1) {
				value = i;
			}
			if(noQuantity) {
				quantity++;
			}
		}
	}
	if(toRight) {
		value++;
	}
	proj[sel].data.duration += quantity;
	for(const obj of proj[sel].data.objs) {
		const focus = proj[sel].frames[obj.id].includes(2);
		const selected = focus || proj[sel].frames[obj.id].includes(1);
		const frames = proj[sel].frames[obj.id] = new Array(proj[sel].data.duration).fill(0);
		if(selected) {
			for(let i = value; i < value + quantity; i++) {
				frames[i] = 1;
			}
			if(focus) {
				frames[value] = 2;
			}
		}
	}
	proj[sel].time = value;
	updateTimeRuler();
};
