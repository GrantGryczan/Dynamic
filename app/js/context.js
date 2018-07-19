"use strict";
const menuSeparator = {
	type: "separator"
};
const textMenu = electron.remote.Menu.buildFromTemplate([{
	label: "Undo",
	accelerator: "CmdOrCtrl+Z",
	role: "undo"
}, {
	label: "Redo",
	accelerator: "CmdOrCtrl+Shift+Z",
	role: "redo"
}, {
	type: "separator"
}, {
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
}]);
const assetMenuItems = [{
	label: "Create object",
	click: () => {
		let assetParent = assets;
		if(ctxTarget.classList.contains("bar")) {
			if(ctxTarget.parentNode[_asset].type === "group") {
				assetParent = ctxTarget.parentNode.lastElementChild;
			} else if(ctxTarget.parentNode[_asset].parent) {
				assetParent = ctxTarget.parentNode[_asset].parent.element.lastElementChild;
			}
		}
		deselectAssets();
		const names = proj[sel].data.assets.map(byLowerCaseName);
		let name = "Object";
		for(let i = 2; names.includes(name.toLowerCase()); i++) {
			name = `Object ${i}`;
		}
		const asset = new DynamicAsset({
			type: "obj",
			name
		});
		proj[sel].data.assets.push(asset);
		const assetElem = appendAsset(asset);
		assetParent.appendChild(assetElem);
		storeAssets();
		assetElem.classList.add("selected");
		proj[sel].selectedAsset = assetElem.id;
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
		const names = proj[sel].data.assets.map(byLowerCaseName);
		let name = "Group";
		for(let i = 2; names.includes(name.toLowerCase()); i++) {
			name = `Group ${i}`;
		}
		const asset = new DynamicAsset({
			type: "group",
			name
		});
		proj[sel].data.assets.push(asset);
		const assetGroup = appendAsset(asset);
		if(ctxTarget.classList.contains("bar")) {
			ctxTarget.parentNode.before(assetGroup);
			assetElems.forEach(assetGroup.lastElementChild.appendChild.bind(assetGroup.lastElementChild));
		}
		assetGroup.classList.add("open");
		storeAssets();
		assetGroup.classList.add("selected");
		proj[sel].selectedAsset = assetGroup.id;
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
const assetMenu = electron.remote.Menu.buildFromTemplate(assetMenuItems);
const byAssets = assetElem => assetElem[_asset];
const numericAssetType = asset => asset.type === "group" ? 0 : (asset.type === "obj" ? 1 : (asset.mime.startsWith("image/") ? 2 : 3));
const assetElemsAlphabetically = assetElem => `${"abcd"[numericAssetType(assetElem[_asset])]} ${assetElem[_asset].name.toLowerCase()}`;
const sortAssetsMenu = electron.remote.Menu.buildFromTemplate([{
	label: "Sort by asset type",
	click: () => {
		for(const assetChildren of [assets, ...assets.querySelectorAll(".assetChildren")]) {
			const assetElems = Array.prototype.filter.call(assetChildren.children, byAssets);
			let afterGroup = null;
			let afterObj = null;
			let afterImage = null;
			for(const assetElem of assetElems) {
				if(assetElem[_asset].type === "obj") {
					if(!afterGroup) {
						afterGroup = assetElem;
					}
				} else if(assetElem[_asset].type === "file") {
					if(assetElem[_asset].mime.startsWith("image/")) {
						if(!afterObj) {
							afterObj = assetElem;
						}
					} else {
						if(!afterImage) {
							afterImage = assetElem;
						}
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
				if(assetElem[_asset].type === "group") {
					assetChildren.insertBefore(assetElem, afterGroup);
				} else if(assetElem[_asset].type === "obj") {
					assetChildren.insertBefore(assetElem, afterObj);
				} else if(assetElem[_asset].type === "file") {
					if(assetElem[_asset].mime.startsWith("image/")) {
						assetChildren.insertBefore(assetElem, afterImage);
					} else {
						assetChildren.appendChild(assetElem);
					}
				}
			}
		}
		storeAssets();
	}
}, {
	label: "Sort alphabetically",
	click: () => {
		for(const assetChildren of [assets, ...assets.querySelectorAll(".assetChildren")]) {
			const assetElems = Array.prototype.filter.call(assetChildren.children, byAssets);
			for(const name of assetElems.map(assetElemsAlphabetically).sort()) {
				assetChildren.lastChild.after(assetElems.find(assetElem => assetElem[_asset].name.toLowerCase() === name.slice(name.indexOf(" ") + 1)));
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
}]);
const deselectAssetMenuItem = {
	label: "Deselect",
	accelerator: "esc",
	click: () => {
		deselectAssets();
		updateProperties();
	}
};
const assetBarMenuSingleItems = [{
	label: "Remove",
	click: removeSelectedAssets
}, {
	label: "Rename",
	accelerator: "F2",
	click: prop.name.elements[0].select.bind(prop.name.elements[0])
}];
const assetBarMenuMultipleItems = [{
	label: "Remove",
	click: removeSelectedAssets
}, {
	label: "Rename",
	accelerator: "F2",
	enabled: false
}];
const assetBarMenuGroupItems = [{
	label: "Select children",
	click: () => {
		for(const assetElem of assets.querySelectorAll(".asset.typeGroup.selected > .assetChildren > .asset")) {
			assetElem.classList.add("selected");
		}
	}
}, {
	label: "Deselect && select children",
	click: () => {
		const childrenToSelect = assets.querySelectorAll(".asset.typeGroup.selected > .assetChildren > .asset");
		deselectAssets();
		for(let i = 0; i < childrenToSelect.length; i++) {
			childrenToSelect[i].classList.add("selected");
			if(i === 0) {
				childrenToSelect[i].classList.add("focus");
				proj[sel].focusedAsset = childrenToSelect[i].id;
			}
		}
		updateProperties();
	}
}];
const assetBarMenuNoGroupItems = [{
	label: "Add to canvas",
	click: addToCanvas
}];
const assetBarMenu = [];
for(const assetBarMenuQuantityItems of [assetBarMenuMultipleItems, assetBarMenuSingleItems]) {
	const x = [];
	for(let i = 0; i < 3; i++) {
		const y = [...assetBarMenuQuantityItems];
		if(i === 1 || i === 2) {
			y.push(menuSeparator, ...assetBarMenuNoGroupItems);
		}
		y.push(menuSeparator, deselectAssetMenuItem);
		if(i === 0 || i === 1) {
			y.push(...assetBarMenuGroupItems);
		}
		y.push(menuSeparator, ...assetMenuItems);
		x.push(electron.remote.Menu.buildFromTemplate(y));
	}
	assetBarMenu.push(x);
}
/*	assetBarMenu
				Group		Both		No group
	Multiple	[0][0]		[0][1]		[0][2]
	Single		[1][0]		[1][1]		[1][2]
*/
const layerMenu = electron.remote.Menu.buildFromTemplate([{
	label: "Remove",
	click: removeSelectedLayers
}, menuSeparator, {
	label: "Deselect",
	accelerator: "esc",
	click: () => {
		deselectLayers();
		updateProperties();
	}
}]);
let ctxTarget;
const openCtx = target => {
	ctxTarget = target;
	const items = [];
	if(ctxTarget === assets) {
		assetMenu.popup(win);
	} else if(ctxTarget.classList.contains("bar")) {
		if(ctxTarget.parentNode.classList.contains("asset")) {
			assetBarMenu[+(assets.querySelectorAll(".asset.selected").length === 1)][assets.querySelector(".asset.typeGroup.selected") ? +!!assets.querySelector(".asset.selected:not(.typeGroup)") : 2].popup(win);
		}
	} else if(ctxTarget.parentNode.classList.contains("layer")) {
		layerMenu.popup(win);
	} else if(ctxTarget === sortAssets) {
		sortAssetsMenu.popup(win);
	} else if((ctxTarget instanceof HTMLInputElement && ctxTarget.type !== "button" && ctxTarget.type !== "submit" && ctxTarget.type !== "reset") || ctxTarget instanceof HTMLTextAreaElement) {
		textMenu.popup(win);
	}
};
