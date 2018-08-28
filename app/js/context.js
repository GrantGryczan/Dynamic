"use strict";
const menuSeparator = {
	type: "separator"
};
const editHistoryMenuItems = [{
	label: "Undo",
	accelerator: "CmdOrCtrl+Z",
	click: todo
}, {
	label: "Redo",
	accelerator: "CmdOrCtrl+Shift+Z",
	click: todo
}];
const textMenuItems = [{
	label: "Cut",
	accelerator: "CmdOrCtrl+X",
	role: "cut"
}, {
	label: "Copy",
	accelerator: "CmdOrCtrl+C",
	role: "copy"
}, {
	label: "Paste",
	accelerator: "CmdOrCtrl+V",
	role: "paste"
}, {
	label: "Select all",
	accelerator: "CmdOrCtrl+A",
	role: "selectall"
}, menuSeparator, {
	label: "Undo",
	accelerator: "CmdOrCtrl+Z",
	role: "undo"
}, {
	label: "Redo",
	accelerator: "CmdOrCtrl+Shift+Z",
	role: "redo"
}];
const assetCreationMenuItems = [{
	label: "Create object",
	click: () => {
		let assetParent = assets;
		if(ctxTarget.classList.contains("bar")) {
			if(ctxTarget.parentNode._asset.type === "group") {
				assetParent = ctxTarget.parentNode.lastElementChild;
			} else if(ctxTarget.parentNode._asset.parent) {
				assetParent = ctxTarget.parentNode._asset.parent.element.lastElementChild;
			}
		}
		deselectAssets();
		const names = project.data.assets.map(byInsensitiveName);
		let name = "Object";
		for(let i = 2; names.includes(name.toLowerCase()); i++) {
			name = `Object ${i}`;
		}
		const asset = new DynamicAsset({
			type: "obj",
			name
		});
		assetParent.appendChild(asset.element);
		if(!assetParent.parentNode.classList.contains("open")) {
			assetParent.parentNode.classList.add("open");
		}
		storeAssets();
		asset.element.classList.add("selected");
		project.selectedAsset = asset.element.id;
		setActive(assetContainer);
	}
}, {
	label: "Create group",
	click: () => {
		setActive(assetContainer);
		const assetElems = assets.querySelectorAll(".asset.selected");
		for(const assetElem of assetElems) {
			assetElem.classList.remove("selected");
		}
		const names = project.data.assets.map(byInsensitiveName);
		let name = "Group";
		for(let i = 2; names.includes(name.toLowerCase()); i++) {
			name = `Group ${i}`;
		}
		const asset = new DynamicAsset({
			type: "group",
			name
		});
		if(ctxTarget.classList.contains("bar")) {
			assetElems[0].before(asset.element);
			assetElems.forEach(asset.element.lastElementChild.appendChild.bind(asset.element.lastElementChild));
		}
		asset.element.classList.add("open");
		storeAssets();
		asset.element.classList.add("selected");
		project.selectedAsset = asset.element.id;
		updateProperties();
	}
}, {
	label: "Import image file(s)",
	click: () => {
		assetInput.accept = "image/*";
		win.webContents.executeJavaScript("assetInput.click()", true);
	}
}, {
	label: "Import audio file(s)",
	click: () => {
		assetInput.accept = "audio/*";
		win.webContents.executeJavaScript("assetInput.click()", true);
	}
}];
const byAssets = assetElem => assetElem._asset;
const numericAssetType = asset => asset.type === "group" ? 0 : (asset.type === "obj" ? 1 : (asset.mime.startsWith("image/") ? 2 : 3));
const assetElemsAlphabetically = assetElem => `${numericAssetType(assetElem._asset)} ${assetElem._asset.name.toLowerCase()}`;
const sortAssetsMenuItems = [{
	label: "Sort by asset type",
	click: () => {
		for(const children of [assets, ...assets.querySelectorAll(".children")]) {
			const assetElems = Array.prototype.filter.call(children.children, byAssets);
			let afterGroup = null;
			let afterObj = null;
			let afterImage = null;
			for(const assetElem of assetElems) {
				if(assetElem._asset.type === "obj") {
					if(!afterGroup) {
						afterGroup = assetElem;
					}
				} else if(assetElem._asset.type === "file") {
					if(assetElem._asset.mime.startsWith("image/")) {
						if(!afterObj) {
							afterObj = assetElem;
						}
					} else if(!afterImage) {
						afterImage = assetElem;
					}
				}
			}
			if(!afterObj) {
				afterObj = afterImage;
			}
			if(!afterGroup) {
				afterGroup = afterObj;
			}
			for(const assetElem of assetElems) {
				if(assetElem._asset.type === "group") {
					children.insertBefore(assetElem, afterGroup);
				} else if(assetElem._asset.type === "obj") {
					children.insertBefore(assetElem, afterObj);
				} else if(assetElem._asset.type === "file") {
					if(assetElem._asset.mime.startsWith("image/")) {
						children.insertBefore(assetElem, afterImage);
					} else {
						children.appendChild(assetElem);
					}
				}
			}
		}
		storeAssets();
	}
}, {
	label: "Sort alphabetically",
	click: () => {
		for(const children of [assets, ...assets.querySelectorAll(".children")]) {
			const assetElems = Array.prototype.filter.call(children.children, byAssets);
			for(const name of assetElems.map(assetElemsAlphabetically).sort()) {
				children.lastChild.after(assetElems.find(assetElem => assetElem._asset.name.toLowerCase() === name.slice(name.indexOf(" ") + 1)));
			}
		}
		storeAssets();
	}
}, {
	label: "Reverse",
	click: () => {
		for(const assetElem of assets.querySelectorAll(".asset")) {
			assetElem.parentNode.firstChild.before(assetElem);
		}
		storeAssets();
	}
}];
const renameMenuItem = {
	label: "Rename",
	accelerator: "F2",
	click: prop.name.elements[0].select.bind(prop.name.elements[0])
};
const selectAllAssetsMenuItem = {
	label: "Select all asset(s)",
	accelerator: "CmdOrCtrl+A",
	click: selectAllAssets
};
const selectedAssetsMenuItems = [{
	label: "Remove asset(s)",
	accelerator: "Delete",
	click: removeSelectedAssets
}, renameMenuItem, menuSeparator, {
	label: "Add to timeline",
	click: addToTimeline
}, menuSeparator, {
	label: "Deselect",
	accelerator: "Esc",
	click: () => {
		deselectAssets();
		updateProperties();
	}
}, selectAllAssetsMenuItem];
const assetMenuGroupItems = [{
	label: "Select children",
	click: () => {
		for(const assetElem of assets.querySelectorAll(".asset.typeGroup.selected > .children > .asset")) {
			assetElem.classList.add("selected");
		}
		updateProperties();
	}
}, {
	label: "Deselect && select children",
	click: () => {
		const childrenToSelect = assets.querySelectorAll(".asset.typeGroup.selected > .children > .asset");
		deselectAssets();
		for(let i = 0; i < childrenToSelect.length; i++) {
			childrenToSelect[i].classList.add("selected");
			if(i === 0) {
				childrenToSelect[i].classList.add("focus");
				project.focusedAsset = childrenToSelect[i].id;
			}
		}
		updateProperties();
	}
}];
const layerMenuItems = [{
	label: "Remove object(s)",
	accelerator: "Delete",
	click: removeSelectedLayers
}, menuSeparator, {
	label: "Deselect",
	accelerator: "Esc",
	click: () => {
		deselectLayers();
		updateProperties();
	}
}];
const selectAllLayersMenuItem = {
	label: "Select all layer(s)",
	accelerator: "CmdOrCtrl+A",
	click: selectAllLayers
};
const timelineItemCreationMenuItems = [{
	label: "Create group",
	click: () => {
		setActive(timelineContainer);
		const timelineItemArray = timelineItems.querySelectorAll(".timelineItem.selected");
		for(const timelineItem of timelineItemArray) {
			timelineItem.classList.remove("selected");
		}
		const names = project.data.objs.map(byInsensitiveName);
		let name = "Group";
		for(let i = 2; names.includes(name.toLowerCase()); i++) {
			name = `Group ${i}`;
		}
		const obj = new DynamicObject({
			type: "group",
			name
		});
		timelineItems.firstElementChild.before(obj.timelineItem);
		if(ctxTarget.classList.contains("bar")) {
			timelineItemArray[0].before(obj.timelineItem);
			timelineItemArray.forEach(obj.timelineItem.lastElementChild.appendChild.bind(obj.timelineItem.lastElementChild));
		}
		obj.timelineItem.classList.add("selected");
		project.selectedTimelineItem = obj.timelineItem.id;
		obj.timelineItem.classList.add("open");
		storeObjs();
		updateSelectedTimelineItems();
		updateProperties();
	}
}];
const byObjs = timelineItem => timelineItem._obj;
const numericObjType = obj => obj.type === "group" ? 0 : (obj.type === "obj" ? 1 : (obj.type === "image" ? 2 : 3));
const timelineItemsAlphabetically = timelineItem => `${numericObjType(timelineItem._obj)} ${timelineItem._obj.name.toLowerCase()}`;
const sortObjsMenuItems = [{
	label: "Sort by layer",
	click: () => {
		for(const children of [timelineItems, ...timelineItems.querySelectorAll(".children")]) {
			for(const obj of Array.prototype.map.call(children.children, byObjs).filter(onlyGraphics).sort(byZIndex)) {
				children.lastChild.after(obj.timelineItem);
			}
		}
		storeObjs();
		updateTimelines();
	}
}, {
	label: "Sort by object type",
	click: () => {
		for(const children of [timelineItems, ...timelineItems.querySelectorAll(".children")]) {
			const timelineItemArray = Array.prototype.filter.call(children.children, byObjs);
			let afterGroup = null;
			let afterObj = null;
			let afterImage = null;
			for(const timelineItem of timelineItemArray) {
				if(timelineItem._obj.type === "obj") {
					if(!afterGroup) {
						afterGroup = timelineItem;
					}
				} else if(timelineItem._obj.type === "image") {
					if(!afterObj) {
						afterObj = timelineItem;
					}
				} else if(!afterImage) {
					afterImage = timelineItem;
				}
			}
			if(!afterObj) {
				afterObj = afterImage;
			}
			if(!afterGroup) {
				afterGroup = afterObj;
			}
			for(const timelineItem of timelineItemArray) {
				if(timelineItem._obj.type === "group") {
					children.insertBefore(timelineItem, afterGroup);
				} else if(timelineItem._obj.type === "obj") {
					children.insertBefore(timelineItem, afterObj);
				} else if(timelineItem._obj.type === "file") {
					if(timelineItem._obj.mime.startsWith("image/")) {
						children.insertBefore(timelineItem, afterImage);
					} else {
						children.appendChild(timelineItem);
					}
				}
			}
		}
		storeObjs();
		updateTimelines();
	}
}, {
	label: "Sort alphabetically",
	click: () => {
		for(const children of [timelineItems, ...timelineItems.querySelectorAll(".children")]) {
			const items = Array.prototype.filter.call(children.children, byObjs);
			for(const name of items.map(timelineItemsAlphabetically).sort()) {
				children.lastChild.after(items.find(timelineItem => timelineItem._obj.name.toLowerCase() === name.slice(name.indexOf(" ") + 1)));
			}
		}
		storeObjs();
		updateTimelines();
	}
}, {
	label: "Reverse",
	click: () => {
		for(const timelineItem of timelineItems.querySelectorAll(".timelineItem")) {
			timelineItem.parentNode.firstChild.before(timelineItem);
		}
		storeObjs();
		updateTimelines();
	}
}];
const objectSelectionTimelineMenu = [{
	label: "Deselect",
	accelerator: "Esc",
	click: () => {
		deselectTimelineItems();
		updateProperties();
	}
}, {
	label: "Select all object(s)",
	accelerator: "CmdOrCtrl+A",
	click: selectAllTimelineItems
}];
const timelineItemMenuItems = [{
	label: "Remove object(s)",
	accelerator: "Delete",
	click: removeSelectedTimelineItems
}, renameMenuItem, menuSeparator, ...objectSelectionTimelineMenu, {
	label: "Select children",
	click: () => {
		for(const timelineItem of timelineItems.querySelectorAll(".timelineItem.selected > .children > .timelineItem")) {
			timelineItem.classList.add("selected");
		}
		updateSelectedTimelineItems();
		updateProperties();
	}
}, {
	label: "Deselect && select children",
	click: () => {
		const childrenToSelect = timelineItems.querySelectorAll(".timelineItem.selected > .children > .timelineItem");
		deselectTimelineItems();
		for(let i = 0; i < childrenToSelect.length; i++) {
			childrenToSelect[i].classList.add("selected");
			if(i === 0) {
				childrenToSelect[i].classList.add("focus");
				project.focusedTimelineItem = childrenToSelect[i].id;
			}
		}
		updateSelectedTimelineItems();
		updateProperties();
	}
}];
const removeTimelineItemsMenuItem = {
	label: "Remove object(s)",
	click: removeSelectedTimelineItems
};
const timelineMenuItems = [{
	label: "Insert frames to left",
	accelerator: "F5",
	click: promptInsertFrames.bind(null, false)
}, {
	label: "Insert frames to right",
	accelerator: "CmdOrCtrl+F5",
	click: promptInsertFrames.bind(null, true)
}, {
	label: "Delete frame(s)",
	accelerator: "CmdOrCtrl+Delete",
	click: deleteFrames
}, {
	label: "Remove object(s)",
	click: removeSelectedTimelineItems
}, menuSeparator, ...objectSelectionTimelineMenu, {
	label: "Select frame(s) in row(s)",
	accelerator: "CmdOrCtrl+Shift+A",
	click: selectFramesInRows
}];
let ctxTarget;
const openCtx = target => {
	ctxTarget = target;
	const template = [];
	if((ctxTarget instanceof HTMLInputElement && ctxTarget.type !== "button" && ctxTarget.type !== "submit" && ctxTarget.type !== "reset") || ctxTarget instanceof HTMLTextAreaElement) {
		template.push(...textMenuItems);
	} else if(selectedProject !== "home") {
		if(ctxTarget === addAsset) {
			template.push(...assetCreationMenuItems);
		} else if(ctxTarget === sortAssets) {
			template.push(...sortAssetsMenuItems)
		} else if(ctxTarget === addObj) {
			template.push(...timelineItemCreationMenuItems);
		} else if(ctxTarget === sortObjs) {
			template.push(...sortObjsMenuItems);
		} else {
			if(assets.contains(ctxTarget)) {
				const selected = assets.querySelectorAll(".asset.selected");
				if(selected.length) {
					renameMenuItem.enabled = selected.length === 1;
					template.push(...selectedAssetsMenuItems);
					if(assets.querySelector(".asset.typeGroup.selected")) {
						template.push(...assetMenuGroupItems);
					}
				} else {
					template.push(selectAllAssetsMenuItem);
				}
				template.push(menuSeparator, ...assetCreationMenuItems);
			} else if(layerBox.contains(ctxTarget)) {
				if(ctxTarget.parentNode.classList.contains("layer")) {
					template.push(...layerMenuItems);
				}
				template.push(selectAllLayersMenuItem);
			} else if(timelineItems.contains(ctxTarget)) {
				const selected = timelineItems.querySelectorAll(".timelineItem.selected");
				if(selected.length) {
					renameMenuItem.enabled = selected.length === 1;
					template.push(...timelineItemMenuItems);
				} else {
					template.push(selectAllObjectsMenuItem);
				}
				template.push(menuSeparator, ...timelineItemCreationMenuItems);
			} else if(timelineArea.contains(ctxTarget)) {
				template.push(...timelineMenuItems);
			}
			if(template.length) {
				template.push(menuSeparator);
			}
			template.push(...editHistoryMenuItems);
		}
	} else {
		return;
	}
	electron.remote.Menu.buildFromTemplate(template).popup(win);
};
