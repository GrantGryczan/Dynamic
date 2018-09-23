"use strict";
const defaultProperties = {
	present: false,
	time: 0,
	volume: 1,
	loop: false,
	speed: 1
};
let subject = content;
const focusName = prop.name.elements[0].select.bind(prop.name.elements[0]);
const makeFullPreviewHidden = () => {
	fullPreview.classList.add("hidden");
	fullPreviewImage.src = "";
};
const hideFullPreview = () => {
	if(fullPreview.classList.contains("opaque")) {
		fullPreview.classList.remove("opaque");
		setTimeout(makeFullPreviewHidden, 150);
		setActive(propertyContainer);
	}
};
const makeFullPreviewOpaque = () => {
	fullPreview.classList.add("opaque");
};
fullPreview.addEventListener("mousemove", evt => {
	fullPreview.classList.remove("hoverScrollbar");
	let targetRect;
	let setHoverScrollbar = false;
	if(fullPreview.offsetHeight !== fullPreview.scrollHeight && mouseX >= (targetRect = fullPreview.getBoundingClientRect()).left + targetRect.width - SCROLLBAR_SIZE) {
		setHoverScrollbar = true;
		fullPreview.classList.add("hoverScrollbar");
	}
	if(!setHoverScrollbar && fullPreview.offsetWidth !== fullPreview.scrollWidth && mouseY >= (targetRect = fullPreview.getBoundingClientRect()).top + targetRect.height - SCROLLBAR_SIZE) {
		fullPreview.classList.add("hoverScrollbar");
	}
});
const canvasProperties = () => {
	subject = content;
	const nameElement = prop.name.elements[0];
	nameElement.value = "< Canvas >";
	nameElement.readOnly = true;
	prop.name.classList.remove("hidden");
	prop.fps.elements[0].value = project.data.fps;
	prop.fps.classList.remove("hidden");
	prop.size.elements[0].value = project.data.width;
	prop.size.elements[1].value = project.data.height;
	prop.size.classList.remove("hidden");
};
const computeDynamicAudio = (obj, time) => {
	time = time >= 0 ? Math.min(project.root.duration - 1, +time) : project.time;
	let playValue = defaultProperties.present;
	let timeValue = defaultProperties.time;
	let volumeValue = defaultProperties.volume;
	let loopValue = defaultProperties.loop;
	let speedValue = defaultProperties.speed;
	for(let i = 0; i <= time; i++) {
		const keyframe = obj.keyframes[i];
		const prevPlayValue = playValue;
		const prevLoopValue = loopValue;
		if(keyframe) {
			if(keyframe.present && (playValue = keyframe.present.value) && timeValue >= obj.media.duration) {
				timeValue = 0;
			}
			if(keyframe.volume) {
				volumeValue = keyframe.volume.value;
			}
			if(keyframe.loop) {
				loopValue = keyframe.loop.value;
			}
			if(keyframe.speed) {
				speedValue = keyframe.speed.value;
			}
		}
		if(keyframe && keyframe.time) {
			timeValue = keyframe.time.value;
		} else if(prevPlayValue) {
			timeValue += speedValue / project.data.fps;
			if(timeValue >= obj.media.duration) {
				if(!prevLoopValue) {
					playValue = false;
				}
				if(loopValue) {
					timeValue = timeValue % obj.media.duration;
				} else {
					timeValue = obj.media.duration;
				}
			}
		}
	}
	return {
		play: playValue,
		time: timeValue,
		volume: volumeValue,
		loop: loopValue,
		speed: speedValue
	};
};
const updateProperties = () => {
	subject = null;
	for(const propElem of propElems) {
		propElem.classList.add("hidden");
	}
	previewImage.classList.add("hidden");
	previewAudio.classList.add("hidden");
	previewImage.src = previewAudio.src = "";
	if(assetContainer.classList.contains("activeProperties")) {
		const assetElems = assets.querySelectorAll(".asset.selected");
		if(assetElems.length) {
			const singleSelected = assetElems.length === 1;
			const nameElement = prop.name.elements[0];
			if(nameElement.readOnly = !singleSelected) {
				nameElement.value = `< ${assetElems.length} selected >`;
			} else {
				nameElement.value = assetElems[0]._asset.name;
			}
			prop.name.classList.remove("hidden");
			let typeGroup = false;
			let typeObj = false;
			let typeFile = false;
			for(const assetElem of assetElems) {
				if(assetElem._asset.type === "group") {
					typeGroup = true;
				} else if(assetElem._asset.type === "obj") {
					typeObj = true;
				} else if(assetElem._asset.type === "file") {
					typeFile = true;
				}
			}
			if(!typeGroup && !typeObj && typeFile) {
				const firstAsset = assetElems[0]._asset;
				let mimeType = firstAsset.mime;
				for(let i = 1; i < assetElems.length; i++) {
					if(assetElems[i]._asset.mime !== mimeType) {
						mimeType = false;
						break;
					}
				}
				if(mimeType) {
					prop.mime.classList.remove("hidden");
					prop.mime.elements[0].value = mimeType;
					if(singleSelected) {
						const previewMedia = mimeType.startsWith("image/") ? previewImage : previewAudio;
						previewMedia.src = firstAsset.url;
						previewMedia.classList.remove("hidden");
						prop.preview.classList.remove("hidden");
					}
				}
			}
		} else {
			canvasProperties();
		}
	} else {
		const objElems = timelineContainer.classList.contains("activeProperties") || contentContainer.classList.contains("activeProperties") ? timelineItems.querySelectorAll(".timelineItem.selected") : (layerContainer.classList.contains("activeProperties") ? layers.querySelectorAll(".layer.selected") : []);
		if(objElems.length) {
			const singleSelected = objElems.length === 1;
			const nameElement = prop.name.elements[0];
			nameElement.readOnly = true;
			if(singleSelected) {
				const obj = objElems[0]._obj;
				nameElement.value = obj.name;
				if(obj.type === "group") {
					nameElement.readOnly = false;
				}
			} else {
				nameElement.value = `< ${objElems.length} selected >`;
			}
			prop.name.classList.remove("hidden");
			let typeGroup = false;
			let typeObj = false;
			let typeImage = false;
			let typeAudio = false;
			for(const objElem of objElems) {
				if(objElem._obj.type === "group") {
					typeGroup = true;
				} else if(objElem._obj.type === "obj") {
					typeObj = true;
				} else if(objElem._obj.type === "image") {
					typeImage = true;
				} else if(objElem._obj.type === "audio") {
					typeAudio = true;
				}
			}
			if(!typeGroup && !typeObj && !typeImage && typeAudio) {
				const firstObj = objElems[0]._obj;
				let playValue = null;
				let timeValue = null;
				let volumeValue = null;
				let loopValue = null;
				let speedValue = null;
				const durations = [];
				for(const obj of project.root.objs) {
					if(obj.type === "audio") {
						durations.push(obj.media.duration);
						for(let i = 0; i < project.root.duration; i++) {
							if(project.frames[obj.id][i]) {
								const playAvailable = playValue !== "";
								const timeAvailable = timeValue !== "";
								if(playAvailable || timeAvailable) {
									const computed = computeDynamicAudio(obj, i);
									if(playAvailable) {
										if(playValue === null) {
											playValue = computed.play;
										} else if(computed.play !== playValue) {
											playValue = "";
										}
									}
									if(timeAvailable) {
										if(timeValue === null) {
											timeValue = computed.time;
										} else if(computed.time !== timeValue) {
											timeValue = "";
										}
									}
								}
								if(volumeValue !== "") {
									const currentVolume = obj.get("volume", i);
									if(volumeValue === null) {
										volumeValue = currentVolume;
									} else if(currentVolume !== volumeValue) {
										volumeValue = "";
									}
								}
								if(loopValue !== "") {
									const currentLoop = obj.get("loop", i);
									if(loopValue === null) {
										loopValue = currentLoop;
									} else if(currentLoop !== loopValue) {
										loopValue = "";
									}
								}
								if(speedValue !== "") {
									const currentSpeed = obj.get("speed", i);
									if(speedValue === null) {
										speedValue = currentSpeed;
									} else if(currentSpeed !== speedValue) {
										speedValue = "";
									}
								}
							}
						}
					}
				}
				const playCheckbox = prop.play.firstElementChild._mdc;
				if(playValue === "") {
					if(!playCheckbox.indeterminate) {
						playCheckbox.indeterminate = true;
					}
				} else {
					if(playCheckbox.indeterminate) {
						playCheckbox.indeterminate = false;
					}
					playCheckbox.checked = playValue;
				}
				prop.play.classList.remove("hidden");
				const timeElement = prop.time.elements[0];
				timeElement.step = 1 / project.data.fps;
				timeElement.max = Math.max(...durations);
				timeElement.value = timeValue;
				prop.time.classList.remove("hidden");
				prop.volume.elements[0].value = volumeValue;
				prop.volume.classList.remove("hidden");
				const loopCheckbox = prop.loop.firstElementChild._mdc;
				if(loopValue === "") {
					if(!loopCheckbox.indeterminate) {
						loopCheckbox.indeterminate = true;
					}
				} else {
					if(loopCheckbox.indeterminate) {
						loopCheckbox.indeterminate = false;
					}
					loopCheckbox.checked = loopValue;
				}
				prop.loop.classList.remove("hidden");
				prop.speed.elements[0].value = speedValue;
				prop.speed.classList.remove("hidden");
			}
		} else {
			canvasProperties();
		}
	}
};
