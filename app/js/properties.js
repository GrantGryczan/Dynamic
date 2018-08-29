"use strict";
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
	prop.fps.classList.remove("hidden");
	prop.canvasSize.classList.remove("hidden");
};
const updateProperties = () => {
	for(const propElem of propElems) {
		propElem.classList.add("hidden");
	}
	previewImage.classList.add("hidden");
	previewAudio.classList.add("hidden");
	previewImage.src = previewAudio.src = "";
	if(assetContainer.classList.contains("activeProperties")) {
		const assetElems = assets.querySelectorAll(".asset.selected");
		if(assetElems.length) {
			if(prop.name.elements[0].readOnly = assetElems.length > 1) {
				prop.name.elements[0].value = `< ${assetElems.length} selected >`;
			} else {
				prop.name.elements[0].value = assetElems[0]._asset.name;
				prop.name.elements[0].labels[0].classList.add("mdc-floating-label--float-above");
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
				let mimeType = assetElems[0]._asset.mime;
				for(let i = 1; i < assetElems.length; i++) {
					if(assetElems[i]._asset.mime !== mimeType) {
						mimeType = false;
						break;
					}
				}
				if(mimeType) {
					prop.mime.classList.remove("hidden");
					prop.mime.elements[0].value = mimeType;
					if(assetElems.length === 1) {
						const previewMedia = mimeType.startsWith("image/") ? previewImage : previewAudio;
						previewMedia.src = assetElems[0]._asset.url;
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
			prop.name.elements[0].readOnly = true;
			if(objElems.length === 1) {
				if(objElems[0]._obj.type === "group") {
					prop.name.elements[0].readOnly = false;
				}
				prop.name.elements[0].value = objElems[0]._obj.name;
				prop.name.elements[0].labels[0].classList.add("mdc-floating-label--float-above");
			} else {
				prop.name.elements[0].value = `< ${objElems.length} selected >`;
			}
			prop.name.classList.remove("hidden");
			// TODO: Object properties
		} else {
			canvasProperties();
		}
	}
};
