"use strict";
let mouseX = 0;
let mouseY = 0;
let contentX = 0;
let contentY = 0;
let mouseTarget;
let mouseTarget0;
let mouseTarget2;
let mouseDown = -1;
let mouseMoved = false;
let mouseUp = 0;
let initialTargetPos;
let targetOffset;
let downActive;
const onMouseDown = evt => {
	if(mouseDown !== -1) {
		onMouseUp(evt);
	}
	mouseDown = evt.button;
	mouseMoved = false;
	mouseX = evt.clientX;
	mouseY = evt.clientY;
	mouseTarget = evt.target;
	if(evt.button === 0) {
		mouseTarget0 = evt.target;
	} else if(evt.button === 2) {
		mouseTarget2 = evt.target;
	}
	for(const dialog of container.querySelectorAll(".mdc-dialog")) {
		if(dialog.contains(mouseTarget)) {
			return;
		}
	}
	const active = projectPage.querySelector(".container.active");
	if(!(active && active.contains(mouseTarget))) {
		for(const panel of panels) {
			if(panel.contains(mouseTarget)) {
				setActive(downActive = panel);
				break;
			}
		}
	}
	if(mouseTarget.classList.contains("bar")) {
		if(mouseTarget.parentNode.classList.contains("asset")) {
			proj[sel].focusedAsset = mouseTarget.parentNode.id;
		} else if(mouseTarget.parentNode.parentNode.classList.contains("layer")) {
			proj[sel].focusedLayer = mouseTarget.parentNode.parentNode.id;
		}
	} else if(evt.button === 0) {
		if(mouseTarget0.classList.contains("tab")) {
			if(mouseTarget0 === homeTab) {
				select("home");
			} else {
				select(mouseTarget0[_proj].id);
				const prevTabPos = mouseTarget0.offsetLeft;
				targetOffset = evt.clientX - prevTabPos;
				mouseTarget0.style.left = "";
				mouseTarget0.style.left = `${prevTabPos - (initialTargetPos = mouseTarget0.offsetLeft)}px`;
				for(let i = 1; i < tabs.children.length; i++) {
					tabs.children[i].classList[tabs.children[i] === mouseTarget0 ? "remove" : "add"]("smooth");
				}
			}
		} else if(mouseTarget0.classList.contains("handle")) {
			initialTargetPos = mouseTarget0.parentNode[mouseTarget0.classList.contains("left") || mouseTarget0.classList.contains("right") ? "offsetWidth" : "offsetHeight"];
			const rect = mouseTarget0.parentNode.getBoundingClientRect();
			if(mouseTarget0.classList.contains("left")) {
				targetOffset = evt.clientX - rect.left + rect.right;
			} else if(mouseTarget0.classList.contains("top")) {
				targetOffset = evt.clientY - rect.top + rect.bottom;
			} else if(mouseTarget0.classList.contains("right")) {
				targetOffset = rect.right - evt.clientX + rect.left;
			} else if(mouseTarget0.classList.contains("bottom")) {
				targetOffset = rect.bottom - evt.clientX + rect.top;
			}
		}
	}
};
document.addEventListener("mousedown", onMouseDown, true);
document.addEventListener("mousemove", evt => {
	if(evt.clientX === mouseX && evt.clientY === mouseY) {
		return;
	}
	const contentRect = content.getBoundingClientRect();
	status.mouseX.textContent = contentX = Math.floor((mouseX = evt.clientX) - contentRect.left);
	status.mouseY.textContent = contentY = Math.floor((mouseY = evt.clientY) - contentRect.top);
	if(mouseDown === -1) {
		return;
	}
	if(mouseTarget) {
		if(mouseTarget.classList.contains("bar")) {
			if(mouseTarget.parentNode.classList.contains("asset")) {
				if(!mouseMoved) {
					selectAsset(mouseTarget.parentNode, 2);
				}
				if(assetContainer.contains(evt.target)) {
					let side;
					let minDist = Infinity;
					let minAssetElem;
					for(const assetElem of assets.querySelectorAll(".asset")) {
						const distTop = mouseY - assetElem.firstElementChild.getBoundingClientRect().top - assetElem.firstElementChild.offsetHeight / 2;
						const absDistTop = Math.abs(distTop);
						if(absDistTop < minDist) {
							minDist = absDistTop;
							minAssetElem = assetElem;
							side = distTop < 0 ? "before" : "after";
						}
					}
					if(side === "after" && minAssetElem[_asset].type === "group" && minAssetElem.classList.contains("open")) {
						minAssetElem.lastElementChild.insertBefore(assetDrag, minAssetElem.lastElementChild.firstChild);
					} else {
						minAssetElem[side](assetDrag);
					}
					assetDrag.classList.remove("hidden");
					indicateTarget();
				} else {
					indicateTarget(contentContainer.contains(evt.target) ? contentContainer : (layerContainer.contains(evt.target) ? layerContainer : null));
					assetDrag.classList.add("hidden");
				}
			} else if(mouseTarget.parentNode.parentNode.classList.contains("layer")) {
				if(!mouseMoved) {
					selectLayer(mouseTarget.parentNode.parentNode, 2);
				}
				if(layerContainer.contains(evt.target)) {
					let side;
					let minDist = Infinity;
					let minLayerElem;
					for(const layerElem of layers.querySelectorAll(".layer")) {
						const distTop = mouseY - layerElem.firstElementChild.getBoundingClientRect().top - layerElem.firstElementChild.offsetHeight / 2;
						const absDistTop = Math.abs(distTop);
						if(absDistTop < minDist) {
							minDist = absDistTop;
							minLayerElem = layerElem;
							side = distTop < 0 ? "before" : "after";
						}
					}
					minLayerElem.querySelector(".bar")[side](layerDrag);
					layerDrag.classList.remove("hidden");
				} else {
					layerDrag.classList.add("hidden");
				}
			}
		} else if(mouseTarget0) {
			if(mouseTarget0.classList.contains("tab")) {
				if(mouseTarget0 !== homeTab) {
					mouseTarget0.style.left = `${evt.clientX - initialTargetPos - targetOffset}px`;
					const tabWidth = mouseTarget0.offsetWidth + 1;
					let afterTarget = false;
					for(let i = 1; i < tabs.children.length; i++) {
						if(tabs.children[i] === mouseTarget0) {
							afterTarget = true;
						} else {
							if(afterTarget) {
								if(mouseTarget0.offsetLeft >= homeTab.offsetWidth + 1 + (i - 1.5) * tabWidth) {
									if(!tabs.children[i].style.left) {
										tabs.children[i].style.left = `-${tabWidth}px`;
									}
								} else if(tabs.children[i].style.left) {
									tabs.children[i].style.left = "";
								}
							} else {
								if(mouseTarget0.offsetLeft <= homeTab.offsetWidth + 1 + (i - 0.5) * tabWidth) {
									if(!tabs.children[i].style.left) {
										tabs.children[i].style.left = `${tabWidth}px`;
									}
								} else if(tabs.children[i].style.left) {
									tabs.children[i].style.left = "";
								}
							}
						}
					}
				}
			} else if(mouseTarget0.classList.contains("handle")) {
				const horizontalHandle = mouseTarget0.classList.contains("left") || mouseTarget0.classList.contains("right");
				const sign = mouseTarget0.classList.contains("left") || mouseTarget0.classList.contains("top") ? -1 : 1;
				mouseTarget0.parentNode.style[horizontalHandle ? "width" : "height"] = `${storage.size[mouseTarget0.parentNode.id] = Math.max(150, targetOffset + sign * evt[horizontalHandle ? "clientX" : "clientY"])}px`;
				if(mouseTarget0.parentNode.style.height) {
					mouseTarget0.parentNode.style.minHeight = mouseTarget0.parentNode.style.height;
				}
				absoluteCenter(content);
			}
		}
	}
	mouseMoved = true;
}, true);
const makeTabRough = () => {
	originalMouseTarget.classList.remove("smooth");
};
const resetTabPos = () => {
	originalMouseTarget.style.left = "";
	setTimeout(makeTabRough, 150);
};
let originalMouseTarget;
const handleMouseUp = (evt, evtButton) => {
	mouseX = evt.clientX;
	mouseY = evt.clientY;
	if(mouseDown === -1) {
		return;
	}
	backUpKeyStates(evt);
	const evtButton0 = evtButton === 0;
	const evtButton2 = evtButton === 2;
	if(mouseTarget && (evtButton0 || evtButton2)) {
		if(assets.contains(mouseTarget) && evtButton === mouseDown) {
			if(mouseMoved && mouseTarget.classList.contains("bar")) {
				if(assetDrag.classList.contains("hidden")) {
					addToCanvas();
				} else {
					for(const assetElem of assets.querySelectorAll(".asset.selected")) {
						try {
							assetDrag.before(assetElem);
						} catch(err) {
							console.warn(err);
						}
					}
					storeAssets();
					assetDrag.classList.add("hidden");
				}
			} else {
				if(mouseTarget === assets) {
					if(mouseX < assets.getBoundingClientRect().left + assets.scrollWidth) {
						deselectAssets();
						updateProperties();
					}
				} else if(mouseTarget.classList.contains("bar")) {
					selectAsset(mouseTarget.parentNode, downActive === assetContainer ? 2 : evtButton);
				} else if(evtButton0) {
					if(mouseTarget0.classList.contains("close")) {
						confirmRemoveAsset(mouseTarget0.parentNode.parentNode);
					} else if(mouseTarget0.classList.contains("icon")) {
						toggleAssetGroup(mouseTarget0.parentNode.parentNode);
					}
				}
			}
		} else if(layerBox.contains(mouseTarget) && evtButton === mouseDown) {
			if(layerBox.contains(mouseTarget)) {
				if(mouseMoved && mouseTarget.classList.contains("bar")) {
					if(!layerDrag.classList.contains("hidden")) {
						const zs = proj[sel].data.objs.map(byZ);
						const side = layerDrag === layerDrag.parentNode.firstElementChild ? "before" : "after";
						layerDrag.parentNode.parentNode[side](layerDrag);
						for(const layerElem of layers.querySelectorAll(".layer.selected")) {
							layerDrag.before(layerElem);
						}
						layerDrag.classList.add("hidden");
						const layerElems = layers.querySelectorAll(".layer");
						for(let i = 0; i < layerElems.length; i++) {
							layerElems[i][_obj].z = zs[i]; // set property
						}
						updateLayers();
						proj[sel].saved = false;
					}
				} else {
					if(mouseTarget.classList.contains("bar")) {
						selectLayer(mouseTarget.parentNode.parentNode, downActive === assetContainer ? 2 : evtButton);
					} else if(evtButton0 && mouseTarget0.classList.contains("close")) {
						confirmRemoveObj(mouseTarget0.parentNode.parentNode.parentNode);
					} else {
						if(mouseX < layerBox.getBoundingClientRect().left + layerBox.scrollWidth) {
							deselectLayers();
							updateProperties();
						}
					}
				}
			}
		} else if(evtButton0) {
			if(mouseTarget0) {
				if(mouseTarget0.classList.contains("tab")) {
					if(mouseTarget0 !== homeTab) {
						let afterTarget = false;
						let shifted;
						let shiftedAfterTarget = 2;
						for(let i = 1; i < tabs.children.length; i++) {
							if(tabs.children[i] === mouseTarget0) {
								afterTarget = true;
							} else if(tabs.children[i].style.left) {
								shifted = i;
								if(afterTarget) {
									shifted++;
								} else {
									shiftedAfterTarget = 1;
									break;
								}
							} else if(afterTarget) {
								break;
							}
						}
						const tabWidth = mouseTarget0.offsetWidth + 1;
						if(shifted) {
							const newPos = homeTab.offsetWidth + 1 + (shifted - shiftedAfterTarget) * tabWidth;
							mouseTarget0.style.left = `${mouseTarget0.offsetLeft - newPos}px`;
							for(let i = 1; i < tabs.children.length; i++) {
								if(tabs.children[i] !== mouseTarget0) {
									tabs.children[i].classList.remove("smooth");
									tabs.children[i].style.left = "";
								}
							}
							tabs.insertBefore(mouseTarget0, tabs.children[shifted]);
						}
						(originalMouseTarget = mouseTarget0).classList.add("smooth");
						setTimeout(resetTabPos);
					}
				} else if(mouseTarget0.classList.contains("handle")) {
					store();
				} else if(evt.target === mouseTarget0) {
					if(mouseTarget0.parentNode === toolbar) {
						if(mouseTarget0 === newProj) {
							new DynamicProject();
						} else if(mouseTarget0 === openProj) {
							open();
						} else if(mouseTarget0 === saveProj) {
							save();
						} else if(mouseTarget0 === saveProjAs) {
							save(true);
						} else if(mouseTarget0 === exportProj) {
							// TODO
						}
					} else if(mouseTarget0.parentNode === assetHead) {
						if(mouseTarget0 === addAsset) {
							openCtx(assets);
						} else if(mouseTarget0 === sortAssets) {
							openCtx(sortAssets);
						}
					} else if(mouseTarget0 === previewImage) {
						fullPreviewImage.src = previewImage.src;
						fullPreview.classList.remove("hidden");
						absoluteCenter(fullPreviewImage);
						setTimeout(makeFullPreviewOpaque);
						setActive(fullPreview);
					} else if(mouseTarget0 === downloadAsset) {
						const selectedAsset = assets.querySelector(".selected")[_asset];
						const path = electron.remote.dialog.showSaveDialog(win, {
							defaultPath: selectedAsset.name
						});
						if(path) {
							fs.writeFile(path, Buffer.from(selectedAsset.data, "base64"));
						}
					} else if(mouseTarget0.classList.contains("close")) {
						if(mouseTarget0.parentNode.classList.contains("tab")) {
							mouseTarget0.parentNode[_proj].close();
						}
					} else if(fullPreviewImage.contains(mouseTarget0) || (mouseTarget0 === fullPreview && !mouseTarget0.classList.contains("hoverScrollbar"))) {
						hideFullPreview();
					}
				}
			}
		}
	}
	if(evtButton2 && evt.target === mouseTarget2) {
		openCtx(mouseTarget2);
	}
	restoreKeyStates();
	downActive = null;
};
const onMouseUp = evt => {
	handleMouseUp(evt, 0);
	handleMouseUp(evt, 2);
	mouseTarget0 = null;
	mouseTarget2 = null;
	mouseDown = -1;
	mouseUp = evt.timeStamp;
	indicateTarget();
};
document.addEventListener("mouseup", onMouseUp, true);
document.addEventListener("click", evt => {
	if(evt.timeStamp !== mouseUp) {
		onMouseDown(evt);
		onMouseUp(evt);
	}
}, true);
let allowDrag = true;
document.addEventListener("dragstart", evt => {
	if(mouseDown !== -1) {
		mouseTarget = mouseTarget0 = mouseTarget2 = null;
		mouseDown = -1;
	}
	allowDrag = false;
}, true);
document.addEventListener("dragend", evt => {
	allowDrag = true;
}, true);
document.addEventListener("dragover", evt => {
	evt.preventDefault();
	if(allowDrag && focused()) {
		if(evt.dataTransfer.types.includes("Files") || evt.dataTransfer.types.includes("text/uri-list")) {
			indicateTarget(container);
		}
	}
}, true);
document.addEventListener("dragleave", evt => {
	if(evt.target === targetIndicator) {
		indicateTarget();
	}
}, true);
document.addEventListener("drop", evt => {
	evt.preventDefault();
	if(allowDrag && focused()) {
		if(evt.dataTransfer.files.length) {
			const files = [...evt.dataTransfer.files];
			for(let i = files.length - 1; i >= 0; i--) {
				if(files[i].path.toLowerCase().endsWith(".mwd")) {
					open(files.splice(i, 1)[0].path);
				}
			}
			if(proj[sel] && files.length) {
				addFiles(files);
			}
		} else if(proj[sel] && evt.dataTransfer.types.includes("text/uri-list")) {
			addFileFromURI(evt.dataTransfer.getData("text/uri-list"));
		}
		indicateTarget();
	}
}, true);
document.addEventListener("dblclick", evt => {
	if(!mouseMoved) {
		if(evt.target === tabs) {
			new DynamicProject();
		} else if(evt.target.classList.contains("handle")) {
			if(evt.target.parentNode === layerContainer) {
				const containerSize = parseInt(evt.target.parentNode.style.height = evt.target.parentNode.style.minHeight = timelineContainer.style.height);
				if(containerSize) {
					storage.size.layerContainer = containerSize;
				} else {
					delete storage.size.layerContainer;
				}
			} else {
				evt.target.parentNode.style.width = evt.target.parentNode.style.height = evt.target.parentNode.style.minHeight = "";
				delete storage.size[evt.target.parentNode.id];
			}
			store();
			absoluteCenter(content);
		} else if(evt.target.classList.contains("bar") && evt.target.parentNode.classList.contains("asset")) {
			selectAsset(evt.target.parentNode, 2);
			if(evt.target.parentNode[_asset].type === "group") {
				toggleAssetGroup(evt.target.parentNode);
			} else if(evt.target.parentNode[_asset].type === "obj") {
				rootAsset(evt.target.parentNode[_asset]);
			}
		}
	}
}, true);
