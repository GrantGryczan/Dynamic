"use strict";
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
			nameElement.labels[0].classList.add("mdc-floating-label--float-above");
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
		const objElems = layerContainer.classList.contains("activeProperties") ? layers.querySelectorAll(".layer.selected") : (timelineContainer.classList.contains("activeProperties") ? timelineItems.querySelectorAll(".timelineItem.selected") : []);
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
			nameElement.labels[0].classList.add("mdc-floating-label--float-above");
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
				let speedValue = null;
				const durations = [];
				for(const obj of project.root.objs) {
					if(obj.type === "audio") {
						durations.push(obj.asset.media.duration);
						for(let i = 0; i < project.root.duration; i++) {
							if(project.frames[obj.id][i]) {
								if(playValue !== "") {
									const currentPlay = obj.get("present", i);
									if(playValue === null) {
										playValue = currentPlay;
									} else if(currentPlay !== playValue) {
										playValue = "";
									}
								}
								if(timeValue !== "") {
									const currentTime = obj.get("time", i);
									if(timeValue === null) {
										timeValue = currentTime;
									} else if(currentTime !== timeValue) {
										timeValue = "";
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
					playCheckbox.indeterminate = true;
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
				prop.speed.elements[0].value = speedValue;
				prop.speed.classList.remove("hidden");
			}
		} else {
			canvasProperties();
		}
	}
};
