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
		}
	}
}, capturePassive);
document.addEventListener("keydown", evt => {
	shiftKey = evt.shiftKey;
	superKey = evt.metaKey || evt.ctrlKey;
	altKey = evt.altKey;
	if(evt.keyCode === 35) { // `end`
		if(focused() && notTyping()) {
			evt.preventDefault();
			endFrameJump();
		}
	} else if(evt.keyCode === 36) { // `home`
		if(focused() && notTyping()) {
			evt.preventDefault();
			homeFrameJump();
		}
	} else if(evt.keyCode === 37) { // `left`
		if(focused() && notTyping()) {
			evt.preventDefault();
			leftFrameJump();
		}
	} else if(evt.keyCode === 38) { // `up`
		if(focused() && notTyping()) {
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
		}
	} else if(evt.keyCode === 39) { // `right`
		if(focused() && notTyping()) {
			evt.preventDefault();
			rightFrameJump();
		}
	} else if(evt.keyCode === 40) { // `down`
		if(focused() && notTyping()) {
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
		}
	} else if(evt.keyCode === 93) { // `context menu`
		const ctxCandidates = document.querySelectorAll(":hover, :focus");
		if(ctxCandidates.length) {
			openCtx(ctxCandidates[ctxCandidates.length - 1]);
		}
	} else if(evt.keyCode === 116) { // `F5`
		if(shiftKey) {
			if(project.data.duration > 1) {
				const topFrames = getTopFrames();
				let quantity = 0;
				let value = project.time;
				for(let i = topFrames.length - 1; i >= 0; i--) {
					if(topFrames[i]) {
						quantity++;
						if(i > project.time) {
							value--;
						}
						for(const obj of project.data.objs) {
							project.frames[obj.id].splice(i, 1);
						}
					}
				}
				project.data.duration -= quantity;
				setTime(Math.max(0, value));
			}
		} else if(altKey) {
			insertFrames(true);
		} else {
			insertFrames();
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
			if(evt.keyCode === 73) { // ^`shift`+`I`
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
			if(focused() && notTyping()) {
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
		} else if(evt.keyCode >= 49 && evt.keyCode <= 56) { // ^`1`-`8`
			if(focused()) {
				if(Object.keys(projects).length) {
					select((tabs.children[evt.keyCode - 48] || tabs.lastElementChild)._project.id);
				}
			}
		}
	} else if(altKey) {
		if(focused()) {
			if(evt.keyCode === 36) { // `alt`+`home`
				select("home");
			}
		}
	} else if(evt.keyCode === 8 || evt.keyCode === 46) { // `backspace` || `delete`
		if(focused() && notTyping()) {
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
		}
	} else if(evt.keyCode === 9) { // `tab`
		if(fullPreview.classList.contains("active")) {
			evt.preventDefault();
		}
	} else if(evt.keyCode === 13) { // `enter`
		if(focused() && notTyping()) {
			if(assetContainer.classList.contains("active")) {
				const focusedAssetElem = assets.querySelector(".asset.focus");
				if(focusedAssetElem && focusedAssetElem._asset.type === "obj") {
					rootAsset(focusedAssetElem._asset);
				} else {
					for(const assetElem of assets.querySelectorAll(".asset.selected")) {
						if(assetElem._asset.type === "group") {
							assetElem.classList.toggle("open");
						}
					}
				}
			} else if(timelineContainer.classList.contains("active")) {
				for(const timelineItem of timelineItems.querySelectorAll(".timelineItem.selected")) {
					timelineItem.classList.toggle("open");
				}
			}
		}
	} else if(evt.keyCode === 27) { // `esc`
		if(focused() && notTyping()) {
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
	} else if(evt.keyCode === 32) { // `space`
		if(focused() && notTyping()) {
			evt.preventDefault();
			(playing ? pause : play)();
		}
	} else if(evt.keyCode === 113) { // `F2`
		setTimeout(prop.name.elements[0].select.bind(prop.name.elements[0]));
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
	if(!evt.target.checkValidity()) {
		return;
	}
	if(evt.target === currentFrame) {
		setTime(+currentFrame.value);
	} else if(evt.target === prop.fps.elements[0]) {
		project.data.fps = +prop.fps.elements[0].value;
		for(let i = 0; i < timeUnits.children.length; i++) {
			timeUnits.children[i].replaceWith(createTimeUnit(timeUnits.children[i]._value));
		}
		project.saved = false;
	} else if(evt.target === prop.canvasSize.elements[0]) {
		content.style.width = `${project.data.width = +evt.target.value}px`;
		absoluteCenter(content);
		project.saved = false;
	} else if(evt.target === prop.canvasSize.elements[1]) {
		content.style.height = `${project.data.height = +evt.target.value}px`;
		absoluteCenter(content);
		project.saved = false;
	} else if(evt.target === prop.name.elements[0]) {
		if(assetContainer.classList.contains("activeProperties")) {
			if(!project.data.assets.map(byInsensitiveName).includes(evt.target.value.trim().toLowerCase())) {
				assets.querySelector(".asset.selected")._asset.name = evt.target.value;
			}
		} else if(timelineContainer.classList.contains("activeProperties")) {
			if(!project.data.objs.map(byInsensitiveName).includes(evt.target.value.trim().toLowerCase())) {
				timelineItems.querySelector(".timelineItem.selected")._obj.name = evt.target.value;
			}
		}
		project.saved = false;
	}
}, capturePassive);
document.addEventListener("change", evt => {
	if(!evt.target.checkValidity()) {
		return;
	}
	if(evt.target === prop.name.elements[0] && evt.target.value.trim().toLowerCase() !== (assetContainer.classList.contains("activeProperties") ? assets.querySelector(".asset.selected")._asset : timelineItems.querySelector(".timelineItem.selected")._obj).name.trim().toLowerCase()) {
		new Miro.Dialog("Error", "That name is already in use.");
	}
}, capturePassive);
document.addEventListener("paste", async evt => {
	if(project && focused() && notTyping()) {
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
