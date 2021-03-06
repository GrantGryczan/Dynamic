"use strict";
const appendFrames = timeline => {
	while (timeline.children.length) {
		timeline.lastElementChild.remove();
	}
	for (let i = 0; i < timeUnits.children.length; i++) {
		timeline.appendChild(baseFrame.cloneNode());
	}
};
const createTimeUnit = value => {
	const timeUnit = html`<div class="timeUnit" data-value="${value}"></div>`;
	timeUnit._value = value;
	timeUnit.style.width = `${storage.frameWidth}px`;
	if (value % 5 === 0) { // TODO: Make that 5 dynamic
		timeUnit.appendChild(html`
			<div class="timeUnitLabel">
				<div class="label">${storage.secondTimeRuler ? value % project.data.fps : value}</div>
			</div>
		`);
	}
	if (value % project.data.fps === 0) {
		const timeLabelValue = value / project.data.fps;
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
	const totalWidth = storage.frameWidth * project.root.duration;
	if (timeRulerFiller.offsetWidth !== totalWidth) {
		timeRulerFiller.style.width = timelineFiller.style.width = `${totalWidth}px`;
	}
	oldStartFrame = startFrame;
	oldEndFrame = endFrame;
	startFrame = Math.floor(timeRuler.scrollLeft / storage.frameWidth);
	endFrame = Math.min(project.root.duration, startFrame + Math.ceil((timeRuler.offsetWidth - SCROLLBAR_SIZE) / storage.frameWidth) + 1);
	const transform = timeUnits.style.transform = `translateX(${storage.frameWidth * startFrame}px)`;
	if (timelinesTranslateXSet || translateX.test(timelines.style.transform)) {
		timelines.style.transform = timelines.style.transform.replace(translateX, transform);
	} else {
		timelines.style.transform += ` ${transform}`;
		timelinesTranslateXSet = true;
	}
	let sum = 0;
	if (project.frameRangeJumped = oldEndFrame < startFrame || oldStartFrame > endFrame) {
		while (timeUnits.children.length) { // remove all if jumping range
			timeUnits.lastElementChild.remove();
			sum--;
		}
		for (let i = startFrame; i < endFrame; i++) { // add all if jumping range
			timeUnits.appendChild(createTimeUnit(i));
			sum++;
		}
	} else {
		minStartFrame = Math.min(oldStartFrame, startFrame);
		maxStartFrame = Math.max(oldStartFrame, startFrame) - 1;
		minEndFrame = Math.min(oldEndFrame, endFrame);
		maxEndFrame = Math.max(oldEndFrame, endFrame);
		if (appendStartFrame = startFrame === minStartFrame) { // add to left if extending left
			for (let i = maxStartFrame; i >= minStartFrame; i--) {
				timeUnits.firstElementChild.before(createTimeUnit(i));
				sum++;
			}
		} else {
			for (let i = timeUnits.children.length - 1; i >= 0; i--) { // remove from left if extending right
				if (timeUnits.children[i]._value >= minStartFrame && timeUnits.children[i]._value <= maxStartFrame) {
					timeUnits.children[i].remove();
					sum--;
				}
			}
		}
		if (appendEndFrame = endFrame === maxEndFrame) {
			for (let i = minEndFrame; i < maxEndFrame; i++) { // add to right if extending right
				timeUnits.appendChild(createTimeUnit(i));
				sum++;
			}
		} else {
			for (let i = timeUnits.children.length - 1; i >= 0; i--) { // remove from right if extending left
				if (timeUnits.children[i]._value >= minEndFrame && timeUnits.children[i]._value < maxEndFrame) {
					timeUnits.children[i].remove();
					sum--;
				}
			}
		}
	}
	if (sum < 0) {
		for (const timeline of timelines.children) {
			for (let i = sum; i < 0; i++) {
				timeline.lastElementChild.remove();
			}
		}
	} else if (sum > 0) {
		for (const timeline of timelines.children) {
			for (let i = 0; i < sum; i++) {
				timeline.appendChild(baseFrame.cloneNode());
			}
		}
	}
	updateTimelines();
	updateSlider();
};
let timelineCount = 0;
const byVisible = obj => obj.timelineItem.offsetWidth;
const baseTimeline = html`<div class="timeline"></div>`;
const baseFrame = html`<div class="frame"></div>`;
baseFrame.style.width = `${storage.frameWidth}px`;
const updateTimelines = () => {
	const objs = project.root.objs.filter(byVisible);
	const totalHeight = timelineItems.scrollHeight - SCROLLBAR_SIZE;
	if (timelineFiller.offsetHeight !== totalHeight) {
		timelineFiller.style.height = `${totalHeight}px`;
	}
	const start = Math.floor(timelineBox.scrollTop / 24);
	const count = Math.min(objs.length - start, Math.ceil((timelineBox.offsetHeight - SCROLLBAR_SIZE) / 24) + 1);
	if (count !== timelineCount) {
		if (timelineCount < count) {
			const length = count - timelineCount;
			for (let i = 0; i < length; i++) {
				const timeline = baseTimeline.cloneNode();
				appendFrames(timeline);
				timelines.appendChild(timeline);
			}
		} else {
			const length = timelineCount - count;
			for (let i = 0; i < length; i++) {
				timelines.lastElementChild.remove();
			}
		}
		timelineCount = count;
	}
	const transform = `translateY(${24 * Math.floor(timelineBox.scrollTop / 24)}px)`;
	if (timelinesTranslateYSet || translateY.test(timelines.style.transform)) {
		timelines.style.transform = timelines.style.transform.replace(translateY, transform);
	} else {
		timelines.style.transform += ` ${transform}`;
		timelinesTranslateYSet = true;
	}
	for (const frame of timelines.querySelectorAll(".frame.focus")) {
		frame.classList.remove("focus");
	}
	for (const frame of timelines.querySelectorAll(".frame.focusHighlight")) {
		frame.classList.remove("focusHighlight");
	}
	for (const frame of timelines.querySelectorAll(".frame.selected")) {
		frame.classList.remove("selected");
	}
	for (const frame of timelines.querySelectorAll(".frame.highlight")) {
		frame.classList.remove("highlight");
	}
	for (const frame of timelines.querySelectorAll(".frame.keyframe")) {
		frame.classList.remove("keyframe");
	}
	for (const frame of timelines.querySelectorAll(".frame.tween")) {
		frame.classList.remove("tween");
	}
	for (const frame of timelines.querySelectorAll(".frame.dynamic")) {
		frame.classList.remove("dynamic");
	}
	const topFrames = getTopFrames();
	for (let i = 0; i < timelines.children.length; i++) {
		const timeline = timelines.children[i];
		timeline.id = `timeline_${(timeline._obj = objs[start + i]).id}`;
	}
	let objCount = 0;
	let frameCount = 0;
	for (const obj of project.root.objs) {
		const frames = project.frames[obj.id];
		const focusHighlight = frames.includes(2);
		const highlight = focusHighlight || frames.includes(1);
		if (highlight) {
			objCount++;
		}
		obj.timelineItem.classList[highlight ? "add" : "remove"]("selected");
		const timeline = obj.timeline;
		if (timeline) {
			timeline.classList.replace(timeline.classList[1], obj.timelineItem.classList[1]);
			const properties = {};
			const firstValue = timeUnits.children[0]._value;
			for (let i = 0; i < firstValue; i++) {
				const keyframe = obj.keyframes[i];
				if (keyframe) {
					for (const key of Object.keys(keyframe)) {
						const property = keyframe[key];
						if ("value" in property) {
							properties[key] = property.value;
						}
					}
				}
			}
			for (let i = 0; i < timeline.children.length; i++) {
				const frame = timeline.children[i];
				frame._value = timeUnits.children[i]._value;
				if (highlight || topFrames[frame._value]) {
					frame.classList.add("highlight");
					if (highlight && frames[frame._value]) {
						frame.classList.add("selected");
						frameCount++;
					}
					if (focusHighlight || topFrames[frame._value] === 2) {
						frame.classList.add("focusHighlight");
						if (focusHighlight && frames[frame._value] === 2) {
							frame.classList.add("focus");
						}
					}
				}
				if (obj.keyframes) {
					const keyframe = obj.keyframes[frame._value];
					if (keyframe) {
						frame.classList.add("keyframe");
						for (const key of Object.keys(keyframe)) {
							const property = keyframe[key];
							if ("value" in property) {
								properties[key] = property.value;
							}
						}
					} else if (properties.present) {
						frame.classList.add("tween");
					}
				}
			}
		}
	}
	status.objs.textContent = objCount;
	status.frames.textContent = frameCount;
	updateTimeUnits();
};
const clearFrames = () => {
	for (const obj of project.root.objs) {
		const frames = project.frames[obj.id];
		if (frames.includes(1) || frames.includes(2)) {
			project.frames[obj.id] = new Array(project.root.duration).fill(0);
		}
	}
};
const blurFrames = () => {
	for (const obj of project.root.objs) {
		project.frames[obj.id] = project.frames[obj.id].map(Math.sign);
	}
};
const getTopFrames = () => {
	const topFrames = new Array(project.root.duration).fill(0);
	for (const obj of project.root.objs) {
		const frames = project.frames[obj.id];
		for (let i = 0; i < frames.length; i++) {
			topFrames[i] = Math.max(topFrames[i], frames[i]);
		}
	}
	topFrames[project.time] = 2;
	return topFrames;
};
const focusFrame = (timeline, value) => {
	project.focusedTimelineItem = project.root.objs.find(obj => obj.id === timeline).timelineItem;
	project.frames[timeline][value] = 2;
	project.time = value;
};
const selectFrame = (timeline, value, button, shift) => {
	if (typeof button !== "number") {
		button = 0;
	}
	if (shift === undefined) {
		shift = shiftKey;
	}
	let index = -1;
	for (const obj of project.root.objs) {
		index = project.frames[obj.id].indexOf(2);
		if (index !== -1) {
			break;
		}
	}
	if (button === 2 && !(superKey || shift)) {
		if (project.frames[timeline][value]) {
			blurFrames();
		} else {
			clearFrames();
		}
		focusFrame(timeline, value);
	} else if (shift && index !== -1) {
		const noSuperKey = !superKey;
		let selecting = false;
		for (const obj of project.root.objs) {
			const frames = project.frames[obj.id];
			let changeSelecting = obj.id === timeline || frames.includes(2);
			if (!selecting && changeSelecting) {
				selecting = true;
				changeSelecting = obj.id === timeline && frames.includes(2);
			}
			const min = Math.min(value, index);
			const max = Math.max(value, index);
			for (let i = 0; i < frames.length; i++) {
				if (frames[i] !== 2) {
					if (selecting && i >= min && i <= max) {
						frames[i] = 1;
					} else if (noSuperKey) {
						frames[i] = 0;
					}
				}
			}
			if (selecting && changeSelecting) {
				selecting = false;
			}
		}
	} else if (superKey) {
		const frameValue = project.frames[timeline][value];
		if (frameValue !== 2) {
			if (frameValue) {
				project.frames[timeline][value] = 0;
			} else {
				blurFrames();
				focusFrame(timeline, value);
			}
		}
	} else {
		if (!project.frames[timeline][value]) {
			clearFrames();
		} else {
			blurFrames();
		}
		focusFrame(timeline, value);
	}
	setTime(project.time);
	setActive(timelineContainer);
};
const moveFrameStates = change => {
	change = ((-change % project.root.duration) + project.root.duration) % project.root.duration;
	for (const obj of project.root.objs) {
		const frames = project.frames[obj.id];
		for (const frameValue of frames.splice(0, change)) {
			frames.push(frameValue);
		}
	}
};
const setTime = (value, natural) => {
	let shouldUpdateAudio = !natural;
	if (project.loop) {
		const rangeSize = project.loop[1] - project.loop[0];
		if (value >= project.loop[1]) {
			shouldUpdateAudio = true;
		}
		value = (((value - project.loop[0]) % rangeSize + rangeSize) % rangeSize) + project.loop[0];
	} else if (project.root instanceof DynamicScene && project.data.scenes.length !== 1) {
		let sceneIndex = project.data.scenes.indexOf(project.scene);
		let offset = 0;
		let duration = 0;
		for (let i = 0; i < project.data.scenes.length; i++) {
			duration += project.data.scenes[i].duration;
			if (i < sceneIndex) {
				offset = duration;
			}
		}
		value = ((offset + value) % duration + duration) % duration;
		const firstDuration = project.data.scenes[0].duration;
		let destination;
		for (const scene of project.data.scenes) {
			if (value < scene.duration) {
				destination = scene;
				break;
			} else {
				value -= scene.duration;
			}
		}
		if (project.scene !== destination) {
			setRoot(destination);
		}
	} else {
		value = (value % project.root.duration + project.root.duration) % project.root.duration;
	}
	moveFrameStates(value - project.time);
	project.time = value;
	scrollFrameIntoView();
	updateSlider();
	updateLayers();
	updateProperties();
	if (playing && shouldUpdateAudio) {
		updateLiveAudio();
	}
};
const scrollFrameIntoView = value => {
	if (value === undefined) {
		value = project.time;
	}
	const left = storage.frameWidth * value - timeRuler.scrollLeft;
	let offset;
	if (left < 1) {
		timeRuler.scrollLeft = timelineBox.scrollLeft += left;
		scrollTimeRuler = scrollTimelines = true;
	} else if (left > (offset = timeRuler.offsetWidth - 2 - storage.frameWidth - SCROLLBAR_SIZE) - 1) {
		timeRuler.scrollLeft = timelineBox.scrollLeft += left - offset;
		scrollTimeRuler = scrollTimelines = true;
	}
	updateTimeRuler();
};
const updateTimeUnits = () => {
	const topFrames = getTopFrames();
	let duration = 0;
	for (const topFrame of topFrames) {
		if (topFrame) {
			duration++;
		}
	}
	status.duration.textContent = duration;
	for (const timeUnit of timeUnits.children) {
		timeUnit.classList[topFrames[timeUnit._value] ? "add" : "remove"]("selected");
		timeUnit.classList[project.time === timeUnit._value ? "add" : "remove"]("focus");
	}
	scrubber.style.transform = `translateX(${storage.frameWidth * project.time + storage.frameWidth / 2 - timeRuler.scrollLeft}px)`;
	foot.currentFrame.size = String(project.root.duration - 1).length;
	if (document.activeElement !== foot.currentFrame) {
		foot.currentFrame.value = project.time;
	}
};
const endFrameJump = () => {
	setTime(project.loop ? project.loop[1] - 1 : project.root.duration - (project.time !== project.root.duration - 1 || project.data.scenes.length === 1 || !(project.root instanceof DynamicScene)));
	if (!project.loop) {
		pause();
	}
};
const homeFrameJump = () => {
	setTime(project.loop ? project.loop[0] : -!(project.time || project.data.scenes.length === 1 || !(project.root instanceof DynamicScene)));
};
const leftFrameJump = () => {
	setTime(project.time - 1);
};
const rightFrameJump = () => {
	setTime(project.time + 1);
};
const updateLoop = () => {
	if (project.loop) {
		foot.loop.classList.remove("translucent");
		loopRangeStart.style.width = `${project.loop[0] === 0 ? 0 : storage.frameWidth * project.loop[0] + 1}px`;
		loopRangeStart.style.marginRight = `${storage.frameWidth * (project.loop[1] - project.loop[0]) - (project.loop[0] === 0 ? 2 : 1)}px`;
		loopField.classList.remove("hidden");
	} else {
		foot.loop.classList.add("translucent");
		loopField.classList.add("hidden");
	}
	updateSlider();
};
const setLoop = () => {
	let value;
	if (mouseTarget === loopRangeStart) {
		value = project.loop[0] = Math.max(0, Math.min(project.loop[1] - 1, Math.floor((mouseX - timeRuler.getBoundingClientRect().left + timeRuler.scrollLeft) / storage.frameWidth + 1)));
	} else {
		value = project.loop[1] = Math.max(project.loop[0] + 1, Math.min(project.root.duration, Math.floor((mouseX - 1 - timeRuler.getBoundingClientRect().left + timeRuler.scrollLeft) / storage.frameWidth)));
	}
	scrollFrameIntoView(value);
	updateLoop();
};
const updateSlider = () => {
	const progress = Math.max(0, Math.min(1, project.loop ? (project.time - project.loop[0]) / (project.loop[1] - project.loop[0] - 1) : project.time / (project.root.duration - 1)));
	sliderThumb.style.transform = `translateX(-50%) translateX(${slider.offsetWidth * progress}px)`;
	sliderTrack.style.transform = `scaleX(${progress})`;
};
const changeSlider = change => {
	const rect = slider.getBoundingClientRect();
	let loopLength;
	const max = storage.frameWidth * (project.loop ? loopLength = project.loop[1] - project.loop[0] : project.root.duration) / slider.offsetWidth;
	initialTargetPos += change / slider.offsetWidth / Math.max(1, Math.min(max, (Math.abs(rect.top + slider.offsetHeight / 2 - mouseY) - slider.offsetHeight) * max / (timelineContainer.offsetHeight - slider.offsetHeight)));
	if (project.loop) {
		setTime(Math.min(project.loop[1] - 1, Math.round(project.loop[0] + (loopLength - 1) * Math.max(0, initialTargetPos))));
	} else {
		setTime(Math.min(project.root.duration - 1, Math.round((project.root.duration - 1) * Math.max(0, initialTargetPos))));
	}
};
const deleteFrames = async () => {
	if (project.root.duration !== 1) {
		const topFrames = getTopFrames();
		let quantity = 0;
		let value = -1;
		for (let i = topFrames.length - 1; i >= 0; i--) {
			if (topFrames[i]) {
				value = i;
				quantity++;
				for (const obj of project.root.objs) {
					if (obj.keyframes) {
						obj.keyframes.splice(i, 1);
					}
					project.frames[obj.id].splice(i, 1);
				}
			}
		}
		updateLayers(true);
		setTime(Math.max(0, Math.min((project.root.duration -= quantity) - 1, value)));
		project.saved = false;
	}
};
const insertFrames = (toRight, quantity) => {
	const topFrames = getTopFrames();
	let value = -1;
	const noQuantity = typeof quantity !== "number";
	if (noQuantity) {
		quantity = 0;
	}
	for (let i = 0; i < topFrames.length; i++) {
		if (topFrames[i]) {
			if (toRight || value === -1) {
				value = i;
			}
			if (noQuantity) {
				quantity++;
			}
		}
	}
	if (toRight) {
		value++;
	}
	project.root.duration += quantity;
	const end = value + quantity;
	for (const obj of project.root.objs) {
		if (obj.keyframes) {
			for (let i = value; i < end; i++) {
				obj.keyframes.splice(value, 0, null);
			}
		}
		const focus = project.frames[obj.id].includes(2);
		const selected = focus || project.frames[obj.id].includes(1);
		const frames = project.frames[obj.id] = new Array(project.root.duration).fill(0);
		if (selected) {
			for (let i = value; i < end; i++) {
				frames[i] = 1;
			}
			if (focus) {
				frames[value] = 2;
			}
		}
	}
	project.time = value;
	updateTimeRuler();
	project.saved = false;
};
const promptInsertFrames = toRight => {
	const topFrames = getTopFrames();
	let quantity = 0;
	for (let i = 0; i < topFrames.length; i++) {
		if (topFrames[i]) {
			quantity++;
		}
	}
	const dialog = new Miro.Dialog("Insert Frames", html`
		<div class="mdc-text-field">
			<input id="insertFrameQuantity" name="quantity" class="mdc-text-field__input" type="number" value="${quantity}" min="1" max="${600 * project.data.fps}" required>
			<label class="mdc-floating-label mdc-floating-label--float-above" for="insertFrameQuantity">Quantity</label>
			<div class="mdc-line-ripple"></div>
		</div>
	`, [{
		text: "Okay",
		type: "submit"
	}, "Cancel"]).then(value => {
		if (value === 0) {
			insertFrames(toRight, +dialog.form.elements.quantity.value);
		}
	});
	dialog.form.elements.quantity.select();
};
const selectFramesInRows = () => {
	for (const obj of project.root.objs) {
		if (obj.timelineItem.classList.contains("selected")) {
			const frames = project.frames[obj.id];
			for (let i = 0; i < frames.length; i++) {
				if (!frames[i]) {
					frames[i] = 1;
				}
			}
		}
	}
	updateTimelines();
};
