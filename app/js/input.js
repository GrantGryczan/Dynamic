"use strict";
let shiftKey = false;
let superKey = false;
let altKey = false;
let originalShiftKey = false;
let originalSuperKey = false;
let originalAltKey = false;
const backUpKeyStates = evt => {
	originalShiftKey = shiftKey;
	shiftKey = evt.shiftKey;
	originalSuperKey = superKey;
	superKey = evt.metaKey || evt.ctrlKey;
	originalAltKey = altKey;
	altKey = evt.altKey;
};
const restoreKeyStates = () => {
	shiftKey = originalShiftKey;
	superKey = originalSuperKey;
	altKey = originalAltKey;
};
document.addEventListener("focus", evt => {
	for(const target of evt.path) {
		if(target === document.body) {
			break;
		}
		if(target.classList.contains("intangible")) {
			setTimeout(evt.target.blur.bind(evt.target));
			return;
		}
	}
	if(evt.target === foot.currentFrame) {
		evt.target.select();
	}
}, capturePassive);
const setKeys = evt => {
	shiftKey = evt.shiftKey;
	superKey = evt.metaKey || evt.ctrlKey;
	altKey = evt.altKey;
};
document.addEventListener("keydown", evt => {
	setKeys(evt);
	if(evt.keyCode === 35) { // `end`
		if(focused() && !typing()) {
			evt.preventDefault();
			endFrameJump();
		}
	} else if(evt.keyCode === 36) { // `home`
		if(focused() && !typing()) {
			evt.preventDefault();
			homeFrameJump();
		}
	} else if(evt.keyCode === 37) { // `left`
		if(focused() && !typing()) {
			evt.preventDefault();
			leftFrameJump();
		}
	} else if(evt.keyCode === 38) { // `up`
		if(!typing()) {
			if(focused()) {
				if(assetContainer.classList.contains("active")) {
					evt.preventDefault();
					const assetElems = assets.querySelectorAll(".asset");
					const assetElem = assetElems[project.focusedAsset ? ((Array.prototype.indexOf.call(assetElems, assets.querySelector(`#${project.focusedAsset}`)) || assetElems.length) - 1) : 0];
					if(assetElem) {
						project.focusedAsset = assetElem.id;
						if(!superKey) {
							selectAsset(assetElem);
						}
					}
				} else if(layerContainer.classList.contains("active")) {
					evt.preventDefault();
					const layer = project.focusedLayer ? layers.querySelector(`#${project.focusedLayer}`).previousElementSibling || layers.lastElementChild : layers.firstElementChild;
					if(layer) {
						project.focusedLayer = layer.id;
						if(!superKey) {
							selectLayer(layer);
						}
					}
				} else if(timelineContainer.classList.contains("active")) {
					evt.preventDefault();
					const timelineItem = project.focusedTimelineItem ? timelineItems.querySelector(`#${project.focusedTimelineItem}`).previousElementSibling || timelineItems.lastElementChild : timelineItems.firstElementChild;
					if(timelineItem) {
						project.focusedTimelineItem = timelineItem.id;
						if(!superKey) {
							selectTimelineItem(timelineItem);
						}
					}
				}
			} else if(sceneDialog) {
				evt.preventDefault();
				const sceneElems = scenes.querySelectorAll(".scene");
				selectScene(sceneElems[Array.prototype.indexOf.call(sceneElems, scenes.querySelector(".scene.selected")) - 1] || sceneElems[sceneElems.length - 1]);
			}
		}
	} else if(evt.keyCode === 39) { // `right`
		if(focused() && !typing()) {
			evt.preventDefault();
			rightFrameJump();
		}
	} else if(evt.keyCode === 40) { // `down`
		if(!typing()) {
			if(focused()) {
				if(assetContainer.classList.contains("active")) {
					evt.preventDefault();
					const assetElems = assets.querySelectorAll(".asset");
					const assetElem = assetElems[((project.focusedAsset ? Array.prototype.indexOf.call(assetElems, assets.querySelector(`#${project.focusedAsset}`)) : -1) + 1) % assetElems.length];
					if(assetElem) {
						project.focusedAsset = assetElem.id;
						if(!superKey) {
							selectAsset(assetElem);
						}
					}
				} else if(layerContainer.classList.contains("active")) {
					evt.preventDefault();
					const layer = project.focusedLayer ? layers.querySelector(`#${project.focusedLayer}`).nextElementSibling || layers.firstElementChild : layers.firstElementChild;
					if(layer) {
						project.focusedLayer = layer.id;
						if(!superKey) {
							selectLayer(layer);
						}
					}
				} else if(timelineContainer.classList.contains("active")) {
					evt.preventDefault();
					const timelineItem = project.focusedTimelineItem ? timelineItems.querySelector(`#${project.focusedTimelineItem}`).nextElementSibling || timelineItems.firstElementChild : timelineItems.firstElementChild;
					if(timelineItem) {
						project.focusedTimelineItem = timelineItem.id;
						if(!superKey) {
							selectTimelineItem(timelineItem);
						}
					}
				}
			} else if(sceneDialog) {
				evt.preventDefault();
				const sceneElems = scenes.querySelectorAll(".scene");
				selectScene(sceneElems[Array.prototype.indexOf.call(sceneElems, scenes.querySelector(".scene.selected")) + 1] || sceneElems[0]);
			}
		}
	} else if(evt.keyCode === 93) { // `context menu`
		const ctxCandidates = document.body.querySelectorAll(":hover, :focus");
		if(ctxCandidates.length) {
			openCtx(ctxCandidates[ctxCandidates.length - 1]);
		}
	} else if(superKey) {
		if((shiftKey && evt.keyCode === 9) || (!shiftKey && evt.keyCode === 33)) { // ^`shift`+`tab` || ^`page up`
			if(focused()) {
				if(selectedProject === "home") {
					if(Object.keys(projects).length) {
						select(tabs.lastElementChild._project.id);
					}
				} else if(project.tab.previousElementSibling === homeTab) {
					select("home");
				} else {
					select(project.tab.previousElementSibling._project.id);
				}
			}
		} else if(shiftKey) {
			if(evt.keyCode === 65) { // ^`shift`+`A`
				if(focused() && !typing()) {
					selectFramesInRows();
				}
			} else if(evt.keyCode === 73) { // ^`shift`+`I`
				win.toggleDevTools();
			} else if(evt.keyCode === 83) { // ^`shift`+`S`
				if(focused()) {
					save(true);
				}
			}
		} else if(evt.keyCode === 9 || evt.keyCode === 34) { // ^`tab` || ^`page down`
			if(focused()) {
				if(selectedProject === "home") {
					if(Object.keys(projects).length) {
						select(homeTab.nextElementSibling._project.id);
					}
				} else if(project.tab.nextElementSibling) {
					select(project.tab.nextElementSibling._project.id);
				} else {
					select("home");
				}
			}
		} else if(evt.keyCode === 57) { // ^`9`
			if(focused()) {
				if(Object.keys(projects).length) {
					select(tabs.lastElementChild._project.id);
				}
			}
		} else if(evt.keyCode === 65) { // ^`A`
			if(focused() && !typing()) {
				if(assetContainer.classList.contains("active")) {
					selectAllAssets();
				} else if(layerContainer.classList.contains("active")) {
					selectAllLayers();
				} else if(timelineContainer.classList.contains("active")) {
					selectAllTimelineItems();
				}
			}
		} else if(evt.keyCode === 78 || evt.keyCode === 84) { // ^`N` || ^`T`
			if(focused()) {
				new DynamicProject();
			}
		} else if(evt.keyCode === 79) { // ^`O`
			if(focused()) {
				open();
			}
		} else if(evt.keyCode === 83) { // ^`S`
			if(focused()) {
				save();
			}
		} else if(evt.keyCode === 87 || evt.keyCode === 115) { // ^`W` || ^`F4`
			if(focused()) {
				if(project) {
					project.close();
				} else {
					win.close();
				}
			}
		} else if(evt.keyCode === 116) { // ^`F5`
			insertFrames(true);
		} else if(evt.keyCode >= 49 && evt.keyCode <= 56) { // ^`1`-`8`
			if(focused() && Object.keys(projects).length) {
				select((tabs.children[evt.keyCode - 48] || tabs.lastElementChild)._project.id);
			}
		}
	} else if(shiftKey) {
		if(focused() && evt.keyCode === 116) { // `shift`+`F5`
			deleteFrames();
		}
	} else if(altKey) {
		if(focused() && evt.keyCode === 36) { // `alt`+`home`
			select("home");
		}
	} else if(evt.keyCode === 8 || evt.keyCode === 46) { // `backspace` || `delete`
		if(!typing()) {
			if(focused()) {
				if(assetContainer.classList.contains("active")) {
					removeSelectedAssets();
				} else if(layerContainer.classList.contains("active")) {
					removeSelectedLayers();
				} else if(timelineContainer.classList.contains("active")) {
					if(timelineArea.contains(mouseTarget)) {
						// TODO: Remove frames
					} else {
						removeSelectedTimelineItems();
					}
				}
			} else if(sceneDialog) {
				confirmRemoveScene(scenes.querySelector(".scene.selected"));
			}
		}
	} else if(evt.keyCode === 9) { // `tab`
		if(fullPreview.classList.contains("active")) {
			evt.preventDefault();
		}
	} else if(evt.keyCode === 13) { // `enter`
		const input = document.body.querySelector(":focus");
		if(!input && focused()) {
			(playing ? pause : play)();
		} else if(typing()) {
			input.blur();
		}
	} else if(evt.keyCode === 27) { // `esc`
		if(focused()) {
			const input = typing();
			if(input) {
				input.blur();
			} else {
				if(assetContainer.classList.contains("active")) {
					deselectAssets();
					updateProperties();
				} else if(layerContainer.classList.contains("active")) {
					deselectLayers();
					updateProperties();
				} else if(timelineContainer.classList.contains("active")) {
					deselectTimelineItems();
					updateProperties();
				} else if(fullPreview.classList.contains("active")) {
					hideFullPreview();
				}
			}
		}
	} else if(evt.keyCode === 113) { // `F2`
		if(focused()) {
			setTimeout(focusName);
		} else if(sceneDialog) {
			renameScene();
		}
	} else if(evt.keyCode === 116) { // `F5`
		if(focused()) {
			insertFrames();
		}
	} else if(evt.keyCode === 122) { // `F11`
		const fullScreen = !win.isFullScreen();
		win.setFullScreen(fullScreen);
	}
}, true);
document.addEventListener("keyup", evt => {
	shiftKey = evt.keyCode !== 16 && evt.shiftKey;
	superKey = !(evt.keyCode === 17 || evt.keyCode === 91) && (evt.ctrlKey || evt.metaKey);
	altKey = evt.keyCode !== 18 && evt.altKey;
}, capturePassive);
document.addEventListener("input", evt => {
	if(!(evt.target.checkValidity && evt.target.checkValidity())) {
		return;
	}
	if(evt.target === prop.name.elements[0]) {
		const trimmedValue = evt.target.value.trim();
		if(trimmedValue) {
			if(assetContainer.classList.contains("activeProperties")) {
				if(!project.data.assets.map(byName).map(insensitiveString).includes(trimmedValue.toLowerCase())) {
					assets.querySelector(".asset.selected")._asset.name = trimmedValue;
				}
			} else if(timelineContainer.classList.contains("activeProperties")) {
				if(!project.root.objs.map(byName).map(insensitiveString).includes(trimmedValue.toLowerCase())) {
					timelineItems.querySelector(".timelineItem.selected")._obj.name = trimmedValue;
				}
			}
			project.saved = false;
		}
	} else if(evt.target === prop.size.elements[0]) {
		if(subject === content) {
			content.style.width = `${project.data.width = +evt.target.value}px`;
			absoluteCenter(content);
			project.saved = false;
		}
	} else if(evt.target === prop.size.elements[1]) {
		if(subject === content) {
			content.style.height = `${project.data.height = +evt.target.value}px`;
			absoluteCenter(content);
			project.saved = false;
		}
	} else if(evt.target === foot.currentFrame) {
		let value;
		if(mathTest.test(value = foot.currentFrame.value.replace(whitespace, "").replace(timestampTest, `(${60 * project.data.fps}*$1+${project.data.fps}*$2)`))) {
			if(startOperationTest.test(value)) {
				value = project.time + value;
			}
			try {
				value = vm.runInThisContext(value);
			} catch(err) {
				console.warn(err);
			}
		} else {
			value = NaN;
		}
		if(isFinite(value)) {
			setTime(Math.round(value));
		}
	} else if(evt.target === prop.fps.elements[0]) {
		project.data.fps = +evt.target.value;
		for(let i = 0; i < timeUnits.children.length; i++) {
			timeUnits.children[i].replaceWith(createTimeUnit(timeUnits.children[i]._value));
		}
		updateTimeUnits();
		project.saved = false;
	} else if(evt.target === prop.time.elements[0]) {
		const value = +evt.target.value;
		if(isFinite(value)) {
			for(const obj of project.root.objs) {
				if(obj.type === "audio") {
					for(let i = 0; i < project.root.duration; i++) {
						if(project.frames[obj.id][i]) {
							obj.set("time", value, i);
						}
					}
				}
			}
			updateTimelines();
			if(playing) {
				updateLiveAudio();
			}
		}
	} else if(evt.target === prop.volume.elements[0]) {
		let value = +evt.target.value;
		if(isFinite(value)) {
			value = Math.max(0, Math.min(1, value));
			for(const obj of project.root.objs) {
				if(obj.type === "audio") {
					for(let i = 0; i < project.root.duration; i++) {
						if(project.frames[obj.id][i]) {
							obj.set("volume", value, i);
						}
					}
				}
			}
			updateTimelines();
			if(playing) {
				updateLiveAudio();
			}
		}
	} else if(evt.target === prop.speed.elements[0]) {
		let value = +evt.target.value;
		if(isFinite(value)) {
			const absValue = Math.abs(value);
			if(absValue < 0.5) {
				value = (Math.sign(value) || 1) * 0.5;
			} else if(absValue > 4) {
				value = Math.sign(value) * 4;
			}
			for(const obj of project.root.objs) {
				if(obj.type === "audio") {
					for(let i = 0; i < project.root.duration; i++) {
						if(project.frames[obj.id][i]) {
							obj.set("speed", value, i);
						}
					}
				}
			}
			updateTimelines();
			if(playing) {
				updateLiveAudio();
			}
		}
	}
}, capturePassive);
document.addEventListener("change", evt => {
	if(evt.target === prop.volume.elements[0]) {
		let value = +evt.target.value;
		if(isFinite(value)) {
			evt.target.value = Math.max(0, Math.min(1, value));
		}
	} else if(evt.target === prop.speed.elements[0]) {
		let value = +evt.target.value;
		if(isFinite(value)) {
			const absValue = Math.abs(value);
			if(absValue < 0.5) {
				evt.target.value = (Math.sign(value) || 1) * 0.5;
			} else if(absValue > 4) {
				evt.target.value = Math.sign(value) * 4;
			}
		}
	} else if(evt.target === foot.currentFrame) {
		foot.currentFrame.value = project.time;
	} else if(!(evt.target.checkValidity && evt.target.checkValidity())) {
		return;
	}
	if(evt.target === prop.play.elements[0]) {
		for(const obj of project.root.objs) {
			if(obj.type === "audio") {
				for(let i = 0; i < project.root.duration; i++) {
					if(project.frames[obj.id][i]) {
						obj.set("present", evt.target.checked, i);
					}
				}
			}
		}
		updateTimelines();
		if(playing) {
			updateLiveAudio();
		}
	} else if(evt.target === prop.loop.elements[0]) {
		for(const obj of project.root.objs) {
			if(obj.type === "audio") {
				for(let i = 0; i < project.root.duration; i++) {
					if(project.frames[obj.id][i]) {
						obj.set("loop", evt.target.checked, i);
					}
				}
			}
		}
		updateTimelines();
		if(playing) {
			updateLiveAudio();
		}
	}
}, capturePassive);
document.addEventListener("paste", async evt => {
	if(project && focused() && !typing()) {
		if(evt.clipboardData.items.length) {
			let file;
			let string;
			for(const item of evt.clipboardData.items) {
				if(item.kind === "file") {
					file = item;
				} else {
					string = item;
				}
			}
			if(file) {
				file = file.getAsFile();
				const htmlFilename = (await new Promise(string.getAsString.bind(string))).match(htmlFilenameTest);
				Object.defineProperty(file, "name", {
					value: htmlFilename ? htmlFilename[1] : "Image"
				});
				addFiles([file]);
			}
		}
	}
}, capturePassive);
