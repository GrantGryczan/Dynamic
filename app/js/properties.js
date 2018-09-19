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
	prop.name.elements[0].value = "< Canvas >";
	prop.name.elements[0].readOnly = true;
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
			const nameElement = prop.name.elements[0];
			const singleSelected = assetElems.length === 1;
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
			const nameElement = prop.name.elements[0];
			nameElement.readOnly = true;
			if(objElems.length === 1) {
				const objElem = objElems[0];
				if(objElem._obj.type === "group") {
					nameElement.readOnly = false;
				} else if(objElem._obj.type === "audio") {
					const timeElement = prop.time.elements[0];
					timeElement.classList.remove("hidden");
					
				}
				nameElement.value = objElem._obj.name;
				nameElement.labels[0].classList.add("mdc-floating-label--float-above");
			} else {
				nameElement.value = `< ${objElems.length} selected >`;
			}
			prop.name.classList.remove("hidden");
			// TODO: Object properties
		} else {
			canvasProperties();
		}
	}
};
