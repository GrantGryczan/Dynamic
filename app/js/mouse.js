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
	mouseMoved = false;
	mouseX = evt.clientX;
	mouseY = evt.clientY;
	setKeys(evt);
	if(evt.button === 0) {
		mouseTarget0 = evt.target;
	} else if(evt.button === 2) {
		mouseTarget2 = evt.target;
	} else {
		return;
	}
	mouseTarget = evt.target;
	mouseDown = evt.button;
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
			project.focusedAsset = mouseTarget.parentNode.id;
		} else if(mouseTarget.parentNode.classList.contains("timelineItem")) {
			project.focusedTimelineItem = mouseTarget.parentNode.id;
		}
	} else if(mouseTarget.parentNode.classList.contains("layer")) {
		project.focusedLayer = mouseTarget.parentNode.id;
	} else if(mouseTarget.classList.contains("timeUnit")) {
		setTime(mouseTarget._value);
	} else if(mouseTarget.classList.contains("frame")) {
		initialTargetPos = project.frames[mouseTarget.parentNode._obj.id][mouseTarget._value];
		selectFrame(mouseTarget.parentNode._obj.id, mouseTarget._value, downActive === timelineContainer ? 2 : evt.button);
	} else if(slider.contains(mouseTarget)) {
		initialTargetPos = (mouseX - slider.getBoundingClientRect().left) / slider.offsetWidth;
		slider.classList.add("mdc-slider--active");
		changeSlider(0);
	} else if(mouseTarget === timelineBox) {
		const rect = timelineBox.getBoundingClientRect();
		if(mouseX < rect.left + rect.width - SCROLLBAR_SIZE - 1 && mouseY < rect.top + rect.height - SCROLLBAR_SIZE - 1) {
			deselectTimelineItems();
			updateProperties();
		}
	} else if(mouseTarget.parentNode === loopField) {
		setLoop();
	} else if(evt.button === 0) {
		if(mouseTarget0.classList.contains("tab")) {
			if(mouseTarget0 === homeTab) {
				select("home");
			} else {
				select(mouseTarget0._project.id);
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
				targetOffset = rect.right - evt.clientX - rect.left;
			} else if(mouseTarget0.classList.contains("bottom")) {
				targetOffset = rect.bottom - evt.clientX - rect.top;
			}
		}
	}
};
document.addEventListener("mousedown", onMouseDown, capturePassive);
document.addEventListener("mousemove", evt => {
	if(evt.clientX === mouseX && evt.clientY === mouseY) {
		return;
	}
	mouseX = evt.clientX;
	mouseY = evt.clientY;
	if(contentContainer.contains(evt.target)) {
		const contentRect = content.getBoundingClientRect();
		status.mouseX.textContent = contentX = Math.floor(mouseX - contentRect.left);
		status.mouseY.textContent = contentY = Math.floor(mouseY - contentRect.top);
	}
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
					if(side === "after" && minAssetElem._asset.type === "group" && minAssetElem.classList.contains("open")) {
						minAssetElem.lastElementChild.insertBefore(assetDrag, minAssetElem.lastElementChild.firstChild);
					} else {
						minAssetElem[side](assetDrag);
					}
					indicateTarget();
				} else {
					indicateTarget(contentContainer.contains(evt.target) ? contentContainer : (layerContainer.contains(evt.target) ? layerContainer : (timelineContainer.contains(evt.target) ? timelineContainer : null)));
					assetDrag.remove();
				}
			} else if(mouseTarget.parentNode.classList.contains("timelineItem")) {
				if(!mouseMoved) {
					selectTimelineItem(mouseTarget.parentNode, 2);
				}
				let side;
				let minDist = Infinity;
				let minTimelineItem;
				for(const timelineItem of timelineItems.querySelectorAll(".timelineItem")) {
					const distTop = mouseY - timelineItem.firstElementChild.getBoundingClientRect().top - timelineItem.firstElementChild.offsetHeight / 2;
					const absDistTop = Math.abs(distTop);
					if(absDistTop < minDist) {
						minDist = absDistTop;
						minTimelineItem = timelineItem;
						side = distTop < 0 ? "before" : "after";
					}
				}
				if(side === "after" && minTimelineItem.classList.contains("open") && minTimelineItem._obj.type !== "audio") {
					minTimelineItem.lastElementChild.insertBefore(timelineItemDrag, minTimelineItem.lastElementChild.firstChild);
				} else {
					minTimelineItem[side](timelineItemDrag);
				}
				indicateTarget();
			}
		} else if(mouseTarget.parentNode && mouseTarget.parentNode.classList.contains("layer")) {
			if(!mouseMoved) {
				selectLayer(mouseTarget.parentNode, 2);
			}
			if(layerContainer.contains(evt.target)) {
				let side;
				let minDist = Infinity;
				let minLayer;
				for(const layer of layers.querySelectorAll(".layer")) {
					const distTop = mouseY - layer.firstElementChild.getBoundingClientRect().top - layer.firstElementChild.offsetHeight / 2;
					const absDistTop = Math.abs(distTop);
					if(absDistTop < minDist) {
						minDist = absDistTop;
						minLayer = layer;
						side = distTop < 0 ? "before" : "after";
					}
				}
				minLayer.querySelector(".bar")[side](layerDrag);
			} else {
				layerDrag.remove();
			}
		} else if(mouseTarget.classList.contains("frame")) {
			let timeline;
			let value;
			if(evt.target.classList.contains("frame")) {
				timeline = evt.target.parentNode._obj.id;
				value = evt.target._value;
			} else {
				const objs = project.data.objs.filter(byVisible);
				const obj = objs[Math.max(0, Math.min(objs.length - 1, Math.floor((mouseY - timelineItems.getBoundingClientRect().top + timelineItems.scrollTop) / 24)))];
				scrollIntoView(obj.timelineItem.querySelector(".bar"), timelineItems);
				timeline = obj.id;
				value = Math.max(0, Math.min(project.data.duration - 1, Math.floor((mouseX - timeRuler.getBoundingClientRect().left + timeRuler.scrollLeft) / storage.frameWidth)));
			}
			if(timeline && typeof value === "number") {
				if(initialTargetPos) {
					// TODO: Move frames
				} else {
					selectFrame(timeline, value, 0, true);
				}
			}
		} else if(slider.contains(mouseTarget)) {
			changeSlider(evt.movementX);
		} else if(mouseTarget.parentNode && mouseTarget.parentNode === loopField) {
			setLoop();
		} else if(mouseTarget0) {
			if(mouseTarget0.classList.contains("timeUnit")) {
				setTime(Math.max(project.loop ? project.loop[0] : 0, Math.min(project.loop ? project.loop[1] - 1 : project.data.duration - 1, Math.floor((mouseX - timeRuler.getBoundingClientRect().left + timeRuler.scrollLeft) / storage.frameWidth))));
			} else if(mouseTarget0.classList.contains("handle")) {
				storage.size[mouseTarget0.parentNode.id] = Math.max(150, targetOffset + (mouseTarget0.classList.contains("left") || mouseTarget0.classList.contains("top") ? -1 : 1) * evt[mouseTarget0.classList.contains("left") || mouseTarget0.classList.contains("right") ? "clientX" : "clientY"]);
				updatePanels();
			} else if(mouseTarget0.classList.contains("tab")) {
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
			}
		}
	}
	mouseMoved = true;
}, capturePassive);
const makeTabRough = () => {
	originalMouseTarget.classList.remove("smooth");
};
const resetTabPos = () => {
	originalMouseTarget.style.left = "";
	setTimeout(makeTabRough, 150);
};
let originalMouseTarget;
const handleMouseUp = (evt, button) => {
	mouseX = evt.clientX;
	mouseY = evt.clientY;
	if(mouseDown === -1) {
		return;
	}
	backUpKeyStates(evt);
	const evtButton0 = button === 0;
	const evtButton2 = button === 2;
	if(mouseTarget && (evtButton0 || evtButton2)) {
		if(assets.contains(mouseTarget) && button === mouseDown) {
			if(mouseMoved && mouseTarget.classList.contains("bar")) {
				if(!assetDrag.parentNode) {
					addToTimeline();
				} else {
					for(const assetElem of assets.querySelectorAll(".asset.selected")) {
						try {
							assetDrag.before(assetElem);
						} catch(err) {
							console.warn(err);
						}
					}
					storeAssets();
					assetDrag.remove();
				}
			} else {
				if(mouseTarget === assets) {
					if(mouseX < assets.getBoundingClientRect().left + assets.scrollWidth) {
						deselectAssets();
						updateProperties();
					}
				} else if(mouseTarget.classList.contains("bar")) {
					selectAsset(mouseTarget.parentNode, downActive === assetContainer ? 2 : button);
				} else if(evtButton0) {
					if(mouseTarget0.classList.contains("close")) {
						confirmRemoveAsset(mouseTarget0.parentNode.parentNode);
					} else if(mouseTarget0.classList.contains("icon")) {
						mouseTarget0.parentNode.parentNode.classList.toggle("open");
					}
				}
			}
		} else if(layerBox.contains(mouseTarget) && button === mouseDown) {
			if(layerBox.contains(mouseTarget)) {
				if(mouseMoved && mouseTarget.parentNode.classList.contains("layer")) {
					if(layerDrag.parentNode) {
						const zs = project.data.objs.filter(onlyGraphics).map(byZ);
						const side = layerDrag === layerDrag.parentNode.firstElementChild ? "before" : "after";
						layerDrag.parentNode.parentNode[side](layerDrag);
						for(const layer of layers.querySelectorAll(".layer.selected")) {
							layerDrag.before(layer);
						}
						layerDrag.remove();
						const layerElems = layers.querySelectorAll(".layer");
						for(let i = 0; i < layerElems.length; i++) {
							layerElems[i]._obj.z = zs[i]; // set property
						}
						updateLayers();
						project.saved = false;
					}
				} else {
					if(mouseTarget.parentNode.classList.contains("layer")) {
						selectLayer(mouseTarget.parentNode, downActive === layerContainer ? 2 : button);
					} else if(evtButton0 && mouseTarget0.classList.contains("close")) {
						confirmRemoveObjElem(mouseTarget0.parentNode.parentNode.parentNode);
					} else {
						if(mouseX < layerBox.getBoundingClientRect().left + layerBox.scrollWidth) {
							deselectLayers();
							updateProperties();
						}
					}
				}
			}
		} else if(timelineItems.contains(mouseTarget) && button === mouseDown) {
			if(mouseMoved && mouseTarget.classList.contains("bar")) {
				for(const timelineItem of timelineItems.querySelectorAll(".timelineItem.selected")) {
					try {
						timelineItemDrag.before(timelineItem);
					} catch(err) {
						console.warn(err);
					}
				}
				timelineItemDrag.remove();
				storeObjs();
				updateTimelines();
			} else {
				if(mouseTarget === timelineItems) {
					deselectTimelineItems();
					updateProperties();
				} else if(mouseTarget.classList.contains("bar")) {
					selectTimelineItem(mouseTarget.parentNode, downActive === timelineContainer ? 2 : button);
				} else if(evtButton0) {
					if(mouseTarget0.classList.contains("close")) {
						confirmRemoveObjElem(mouseTarget0.parentNode.parentNode);
					} else if(mouseTarget0.classList.contains("icon")) {
						mouseTarget0.parentNode.parentNode.classList.toggle("open");
						updateTimelines();
					}
				}
			}
		} else if(slider.contains(mouseTarget)) {
			slider.classList.remove("mdc-slider--active");
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
					if(mouseTarget0.parentNode === timelineFoot) {
						if(mouseTarget0 === foot.jumpToStart) {
							homeFrameJump();
						} else if(mouseTarget0 === foot.jumpToPrev) {
							leftFrameJump();
						} else if(mouseTarget0 === foot.play) {
							play();
						} else if(mouseTarget0 === foot.pause) {
							pause();
						} else if(mouseTarget0 === foot.jumpToNext) {
							rightFrameJump();
						} else if(mouseTarget0 === foot.jumpToEnd) {
							endFrameJump();
						} else if(mouseTarget0 === foot.alignScrubberLeft) {
							timeRuler.scrollLeft = timelineBox.scrollLeft = project.time * storage.frameWidth;
							scrollTimeRuler = scrollTimelines = true;
						} else if(mouseTarget0 === foot.alignScrubberCenter) {
							timeRuler.scrollLeft = timelineBox.scrollLeft = project.time * storage.frameWidth - timeRuler.offsetWidth / 2 + SCROLLBAR_SIZE;
							scrollTimeRuler = scrollTimelines = true;
						} else if(mouseTarget0 === foot.alignScrubberRight) {
							timeRuler.scrollLeft = timelineBox.scrollLeft = project.time * storage.frameWidth - timeRuler.offsetWidth + 2 + storage.frameWidth + SCROLLBAR_SIZE;
							scrollTimeRuler = scrollTimelines = true;
						} else if(mouseTarget0 === foot.enableLoop) {
							project.loop = [Math.max(0, project.time - 1), Math.min(project.data.duration, project.time + 2)];
							updateLoop();
						} else if(mouseTarget0 === foot.disableLoop) {
							project.loop = false;
							updateLoop();
						} else if(mouseTarget0 === foot.enableOnionskin) {
							storage.onionskin = project.onionskin = true;
							updateOnionskin();
						} else if(mouseTarget0 === foot.disableOnionskin) {
							storage.onionskin = project.onionskin = false;
							updateOnionskin();
						}
					} else if(mouseTarget0.parentNode === toolbar) {
						if(mouseTarget0 === newProj) {
							new DynamicProject();
						} else if(mouseTarget0 === openProj) {
							open();
						} else if(mouseTarget0 === saveProj) {
							save();
						} else if(mouseTarget0 === saveProjAs) {
							save(true);
						} else if(mouseTarget0 === exportProj) {
							// TODO: Export
						}
					} else if(mouseTarget0.parentNode === assetHead || mouseTarget0.parentNode === timelineHead) {
						openCtx(mouseTarget0);
					} else if(mouseTarget0 === previewImage) {
						fullPreviewImage.src = previewImage.src;
						fullPreview.classList.remove("hidden");
						absoluteCenter(fullPreviewImage);
						setTimeout(makeFullPreviewOpaque);
						setActive(fullPreview);
					} else if(mouseTarget0 === downloadAsset) {
						const selectedAsset = assets.querySelector(".selected")._asset;
						const path = electron.remote.dialog.showSaveDialog(win, {
							defaultPath: selectedAsset.name
						});
						if(path) {
							fs.writeFile(path, Buffer.from(selectedAsset.data, "base64"));
						}
					} else if(mouseTarget0.classList.contains("close")) {
						if(mouseTarget0.parentNode.classList.contains("tab")) {
							mouseTarget0.parentNode._project.close();
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
document.addEventListener("mouseup", onMouseUp, capturePassive);
document.addEventListener("click", evt => {
	if(evt.timeStamp !== mouseUp) {
		onMouseDown(evt);
		onMouseUp(evt);
	}
}, capturePassive);
let allowDrag = true;
document.addEventListener("dragstart", () => {
	if(mouseDown !== -1) {
		mouseTarget = mouseTarget0 = mouseTarget2 = null;
		mouseDown = -1;
	}
	allowDrag = false;
}, capturePassive);
document.addEventListener("dragend", () => {
	allowDrag = true;
}, capturePassive);
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
}, capturePassive);
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
			if(project && files.length) {
				addFiles(files);
			}
		} else if(project && evt.dataTransfer.types.includes("text/uri-list")) {
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
				const containerSize = parseInt(timelineContainer.style.height);
				if(containerSize) {
					storage.size.layerContainer = containerSize;
				} else {
					delete storage.size.layerContainer;
				}
			} else {
				delete storage.size[evt.target.parentNode.id];
			}
			store();
			updatePanels();
		} else if(evt.target.classList.contains("bar")) {
			if(evt.target.parentNode.classList.contains("asset")) {
				selectAsset(evt.target.parentNode, 2);
				if(evt.target.parentNode._asset.type === "group") {
					evt.target.parentNode.classList.toggle("open");
				} else if(evt.target.parentNode._asset.type === "obj") {
					rootAsset(evt.target.parentNode._asset);
				}
			} else if(evt.target.parentNode.classList.contains("timelineItem")) {
				evt.target.parentNode.classList.toggle("open");
			}
		} else if(evt.target.parentNode === loopField) {
			if(evt.target === loopRangeStart) {
				project.loop[0] = 0;
			} else {
				project.loop[1] = project.data.duration;
			}
			updateLoop();
		}
	}
}, capturePassive);
let scrollTimelineItems = true;
let scrollTimeRuler = true;
let scrollTimelines = true;
let timelineBoxScrollX = 0;
let timelineBoxScrollY = 0;
document.addEventListener("scroll", evt => {
	if(evt.target === timelineItems) {
		if(scrollTimelineItems) {
			if(timelineItems.scrollTop !== timelineBox.scrollTop) {
				scrollTimelines = false;
				timelineBox.scrollTop = timelineItems.scrollTop;
				updateTimelines();
			}
		} else {
			scrollTimelineItems = true;
		}
	} else if(evt.target === timeRuler) {
		if(scrollTimeRuler) {
			if(timeRuler.scrollLeft !== timelineBox.scrollLeft) {
				scrollTimelines = false;
				timelineBox.scrollLeft = timeRuler.scrollLeft;
			}
			updateTimeRuler();
		} else {
			scrollTimeRuler = true;
		}
	} else if(evt.target === timelineBox) {
		if(scrollTimelines) {
			const scrolledY = timelineBox.scrollTop !== timelineBoxScrollY;
			if(timelineBox.scrollLeft !== timeRuler.scrollLeft) {
				scrollTimeRuler = false;
				timeRuler.scrollLeft = timelineBox.scrollLeft;
				updateTimeRuler();
			} else if(timelineBox.scrollLeft !== timelineBoxScrollX) {
				timelineBoxScrollX = timelineBox.scrollLeft;
				updateTimeRuler();
			} else if(scrolledY) {
				updateTimelines();
			}
			if(timelineBox.scrollTop !== timelineItems.scrollTop) {
				scrollTimelineItems = false;
				timelineItems.scrollTop = timelineBox.scrollTop;
			}
			if(scrolledY) {
				timelineBoxScrollY = timelineBox.scrollTop;
			}
		} else {
			scrollTimelines = true;
		}
	}
}, capturePassive);
