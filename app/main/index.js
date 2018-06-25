//(() => {
	const fs = require("fs-extra");
	const zlib = require("zlib");
	const electron = require("electron");
	let storage;
	try {
		storage = JSON.parse(localStorage.data);
	} catch(err) {
		storage = {};
	}
	const store = () => {
		try {
			localStorage.data = JSON.stringify(storage);
		} catch(err) {
			Miro.dialog("Error", "An error occurred while trying to save your user data.");
		}
	};
	const slashes = /[\\\/]/g;
	const win = electron.remote.getCurrentWindow();
	electron.webFrame.setVisualZoomLevelLimits(1, 1);
	const titleBar = document.querySelector("#titleBar");
	titleBar.querySelector(".label").textContent = `Miroware Dynamic ${navigator.userAgent.match(/ Dynamic\/([^ ]+) /)[1]}`;
	if(win.isFullScreen()) {
		titleBar.classList.add("hidden");
	}
	const windowActions = titleBar.querySelector("#windowActions");
	const minimizeWindow = windowActions.querySelector("#minimizeWindow");
	const maximizeWindow = windowActions.querySelector("#maximizeWindow");
	maximizeWindow.textContent = win.isMaximized() ? "fullscreen_exit" : "fullscreen";
	win.on("maximize", () => {
		maximizeWindow.textContent = "fullscreen_exit";
	});
	win.on("unmaximize", () => {
		maximizeWindow.textContent = "fullscreen";
	});
	const closeWindow = windowActions.querySelector("#closeWindow");
	const container = document.querySelector("#container");
	const tabs = container.querySelector("#tabs");
	const homeTab = tabs.querySelector("#homeTab");
	const toolbar = container.querySelector("#toolbar");
	const newProj = toolbar.querySelector("#newProj");
	const openProj = toolbar.querySelector("#openProj");
	const saveProj = toolbar.querySelector("#saveProj");
	const saveProjAs = toolbar.querySelector("#saveProjAs");
	const exportProj = toolbar.querySelector("#exportProj");
	const homePage = container.querySelector("#homePage");
	const projectPage = container.querySelector("#projectPage");
	const assetContainer = container.querySelector("#assetContainer");
	const propertyContainer = container.querySelector("#propertyContainer");
	const timelineContainer = container.querySelector("#timelineContainer");
	if(storage.containerSizes instanceof Object) {
		if(storage.containerSizes.assetContainer) {
			assetContainer.style.width = `${storage.containerSizes.assetContainer}px`;
		}
		if(storage.containerSizes.propertyContainer) {
			propertyContainer.style.width = `${storage.containerSizes.propertyContainer}px`;
		}
		if(storage.containerSizes.timelineContainer) {
			timelineContainer.style.height = `${storage.containerSizes.timelineContainer}px`;
		}
	} else {
		storage.containerSizes = {};
	}
	store();
	const proj = {}; // the object of projects, the probject
	let projID = 0;
	let sel;
	const baseData = {
		service: "Miroware Dynamic",
		version: 0
	};
	const _proj = Symbol("proj");
	const _saved = Symbol("saved");
	const _name = Symbol("name");
	const _location = Symbol("location");
	class Project {
		constructor(thisProject) {
			if(!(thisProject instanceof Object)) {
				thisProject = {};
			}
			const validLocation = typeof thisProject.location === "string";
			if(typeof thisProject.name === "string") {
				this[_name] = thisProject.name;
			} else if(!validLocation) {
				const projects = Object.values(proj);
				let i = 0;
				do {
					this[_name] = `Project ${++i}`;
				} while(projects.some(project => project.name === this[_name]));
			}
			tabs.appendChild(this.tab = html`
				<div class="tab${(this[_saved] = !!thisProject.saved) ? " saved" : ""}">
					<div class="label">$${this[_name]}</div>
					<div class="close material-icons"></div>
				</div>
			`);
			this.tab[_proj] = this;
			this.location = validLocation ? thisProject.location : null;
			this.data = thisProject.data || {
				...baseData
			};
			const id = String(++projID);
			(proj[id] = this).id = id;
			select(id);
		}
		get location() {
			return this[_location];
		}
		set location(value) {
			if(value) {
				this[_location] = this.tab.title = value;
				this.name = this[_location].slice(this[_location].replace(slashes, "/").lastIndexOf("/") + 1);
			}
		}
		get name() {
			return this[_name];
		}
		set name(value) {
			this[_name] = this.tab.querySelector(".label").textContent = value;
		}
		get saved() {
			return this[_saved];
		}
		set saved(value) {
			this.tab.classList[(saveProj.disabled = this[_saved] = !!value) ? "add" : "remove"]("saved");
		}
		async close() {
			if(!this.saved && await new Miro.dialog("Confirm", html`
				Are you sure you want to close <span class="bold">${this.name}</span>?<br>
				Your unsaved changes will be lost.
			`, ["Yes", "No"]) === 1) {
				return;
			}
			if(this.id === sel) {
				select("home");
			}
			this.tab.remove();
			delete proj[this.id];
		}
	}
	const select = id => {
		if(proj[sel]) {
			projectPage.classList.add("hidden");
		} else if(sel === "home") {
			homePage.classList.add("hidden");
		}
		sel = id;
		for(const tab of tabs.children) {
			tab.classList.remove("current");
		}
		if(saveProjAs.disabled = exportProj.disabled = id === "home") {
			saveProj.disabled = true;
			homeTab.classList.add("current");
			homePage.classList.remove("hidden");
		} else {
			saveProj.disabled = proj[id].saved;
			proj[id].tab.classList.add("current");
			projectPage.classList.remove("hidden");
		}
	};
	select("home");
	const fileOptions = {
		properties: ["openFile", "createDirectory"],
		filters: [{
			name: "Miroware Dynamic Files",
			extensions: ["mwd"]
		}, {
			name: "All Files",
			extensions: ["*"]
		}]
	};
	const loadIndeterminate = value => {
		if(value) {
			tabs.classList.add("disabled");
			toolbar.classList.add("disabled");
			if(proj[sel]) {
				proj[sel].page.classList.add("disabled");
			}
			document.body.classList.add("indeterminate");
			win.setProgressBar(0, {
				mode: "indeterminate"
			});
		} else {
			tabs.classList.remove("disabled");
			toolbar.classList.remove("disabled");
			if(proj[sel]) {
				proj[sel].page.classList.remove("disabled");
			}
			document.body.classList.remove("indeterminate");
			win.setProgressBar(-1);
		}
	};
	const zip = data => new Promise((resolve, reject) => {
		zlib.gzip(data, (err, result) => {
			if(err) {
				reject(err);
			} else {
				resolve(result);
			}
		});
	});
	const unzip = data => new Promise((resolve, reject) => {
		zlib.unzip(data, (err, result) => {
			if(err) {
				reject(err);
			} else {
				resolve(result);
			}
		});
	});
	const save = async as => {
		if(proj[sel] && (as || !proj[sel].saved) && (proj[sel].location = (!as && proj[sel].location) || electron.remote.dialog.showSaveDialog(win, fileOptions))) {
			loadIndeterminate(true);
			try {
				await fs.writeFile(proj[sel].location, await zip(JSON.stringify(proj[sel].data)));
			} catch(err) {
				new Miro.dialog("Error", `An error occurred while trying to save.\n${err.message}`);
				loadIndeterminate(false);
				return;
			}
			loadIndeterminate(false);
			proj[sel].saved = true;
		}
	};
	const open = async location => {
		if(!location) {
			location = electron.remote.dialog.showOpenDialog(win, fileOptions);
			if(location) {
				location = location[0];
			}
		}
		if(location) {
			loadIndeterminate(true);
			let data;
			try {
				if((data = JSON.parse(await unzip(await fs.readFile(location)))).service !== "Miroware Dynamic") {
					throw null;
				}
			} catch(err) {
				new Miro.dialog("Error", "That is not a valid MWD file.");
				loadIndeterminate(false);
				return false;
			}
			loadIndeterminate(false);
			return new Project({
				saved: true,
				location,
				data
			});
		} else {
			return false;
		}
	};
	electron.ipcRenderer.on("argv", (event, location) => {
		open(location);
	});
	let mouseTarget;
	let down = false;
	let initialTargetPos;
	let targetOffset;
	window.addEventListener("mousedown", event => {
		if(event.button === 0 && !down) {
			down = true;
			mouseTarget = event.target;
			if(mouseTarget.classList.contains("tab")) {
				if(mouseTarget === homeTab) {
					select("home");
				} else {
					select(mouseTarget[_proj].id);
					const prevTabPos = mouseTarget.offsetLeft;
					targetOffset = event.clientX - prevTabPos;
					mouseTarget.style.left = "";
					mouseTarget.style.left = `${prevTabPos - (initialTargetPos = mouseTarget.offsetLeft)}px`;
					for(let i = 1; i < tabs.children.length; i++) {
						tabs.children[i].classList[tabs.children[i] === mouseTarget ? "remove" : "add"]("smooth");
					}
				}
			} else if(mouseTarget.classList.contains("handle")) {
				initialTargetPos = mouseTarget.parentNode[mouseTarget.classList.contains("horizontal") ? "offsetWidth" : "offsetHeight"];
				if(mouseTarget.parentNode === assetContainer) {
					targetOffset = mouseTarget.parentNode.offsetWidth - event.clientX;
				} else if(mouseTarget.parentNode === propertyContainer) {
					targetOffset = event.clientX - mouseTarget.parentNode.offsetLeft;
				} else if(mouseTarget.parentNode === timelineContainer) {
					targetOffset = event.clientY - mouseTarget.parentNode.offsetTop;
				}
			}
		}
	});
	window.addEventListener("mousemove", event => {
		if(down) {
			if(mouseTarget.classList.contains("tab")) {
				if(mouseTarget !== homeTab) {
					mouseTarget.style.left = `${event.clientX - initialTargetPos - targetOffset}px`;
					const tabWidth = mouseTarget.offsetWidth + 1;
					let afterTarget = false;
					for(let i = 1; i < tabs.children.length; i++) {
						if(tabs.children[i] === mouseTarget) {
							afterTarget = true;
						} else {
							if(afterTarget) {
								if(mouseTarget.offsetLeft >= homeTab.offsetWidth + 1 + (i - 1.5) * tabWidth) {
									if(!tabs.children[i].style.left) {
										tabs.children[i].style.left = `-${tabWidth}px`;
									}
								} else if(tabs.children[i].style.left) {
									tabs.children[i].style.left = "";
								}
							} else {
								if(mouseTarget.offsetLeft <= homeTab.offsetWidth + 1 + (i - 0.5) * tabWidth) {
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
			} else if(mouseTarget.classList.contains("handle")) {
				let value = targetOffset;
				if(mouseTarget.parentNode === assetContainer) {
					value += event.clientX;
				} else if(mouseTarget.parentNode === propertyContainer) {
					value += document.body.offsetWidth - event.clientX;
				} else if(mouseTarget.parentNode === timelineContainer) {
					value += document.body.offsetHeight - event.clientY;
				}
				mouseTarget.parentNode.style[mouseTarget.classList.contains("horizontal") ? "width" : "height"] = `${storage.containerSizes[mouseTarget.parentNode.id] = Math.max(185, value)}px`;
			}
		}
	});
	const makeTabRough = () => {
		mouseTarget.classList.remove("smooth");
	};
	const resetTabPos = () => {
		mouseTarget.style.left = "";
		setTimeout(makeTabRough, 150);
	};
	window.addEventListener("mouseup", event => {
		if(event.button === 0) {
			if(mouseTarget) {
				if(mouseTarget.classList.contains("tab")) {
					if(mouseTarget !== homeTab) {
						let afterTarget = false;
						let shifted;
						let shiftedAfterTarget = 2;
						for(let i = 1; i < tabs.children.length; i++) {
							if(tabs.children[i] === mouseTarget) {
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
						const tabWidth = mouseTarget.offsetWidth + 1;
						if(shifted) {
							const newPos = homeTab.offsetWidth + 1 + (shifted - shiftedAfterTarget) * tabWidth;
							mouseTarget.style.left = `${mouseTarget.offsetLeft - newPos}px`;
							for(let i = 1; i < tabs.children.length; i++) {
								if(tabs.children[i] !== mouseTarget) {
									tabs.children[i].classList.remove("smooth");
									tabs.children[i].style.left = "";
								}
							}
							tabs.insertBefore(mouseTarget, tabs.children[shifted]);
						}
						mouseTarget.classList.add("smooth");
						setTimeout(resetTabPos);
					}
				} else if(mouseTarget.classList.contains("handle")) {
					store();
				} else if(event.target === mouseTarget) {
					if(mouseTarget.parentNode === windowActions) {
						if(mouseTarget === minimizeWindow) {
							win.minimize();
						} else if(mouseTarget === maximizeWindow) {
							if(win.isMaximized()) {
								win.unmaximize();
							} else {
								win.maximize();
							}
						} else if(mouseTarget === closeWindow) {
							win.close();
						}
					} else if(mouseTarget.parentNode === toolbar) {
						if(mouseTarget === newProj) {
							new Project();
						} else if(mouseTarget === openProj) {
							open();
						} else if(mouseTarget === saveProj) {
							save();
						} else if(mouseTarget === saveProjAs) {
							save(true);
						} else if(mouseTarget === exportProj) {
							
						}
					} else if(mouseTarget.classList.contains("close")) {
						if(mouseTarget.parentNode.classList.contains("tab")) {
							mouseTarget.parentNode[_proj].close();
						}
					}
				}
			}
			down = false;
		}
	});
	window.addEventListener("dblclick", event => {
		if(event.target.classList.contains("handle")) {
			event.target.parentNode.style.width = event.target.parentNode.style.height = "";
			delete storage.containerSizes[event.target.parentNode.id];
			store();
		}
	});
	window.addEventListener("keydown", event => {
		if(event.ctrlKey || event.metaKey) {
			if((event.shiftKey && event.keyCode === 9) || (!event.shiftKey && event.keyCode === 33)) { // ^`shift`+`tab` || ^`page up`
				if(sel === "home") {
					if(Object.keys(proj).length) {
						select(tabs.lastElementChild[_proj].id);
					}
				} else if(proj[sel].tab.previousElementSibling === homeTab) {
					select("home");
				} else {
					select(proj[sel].tab.previousElementSibling[_proj].id);
				}
			} else if(event.shiftKey) {
				if(event.keyCode === 73) { // ^`shift`+`I`
					win.toggleDevTools();
				} else if(event.keyCode === 83) { // ^`shift`+`S`
					save(true);
				}
			} else if(event.keyCode === 9 || event.keyCode === 34) { // ^`tab` || ^`page down`
				if(sel === "home") {
					if(Object.keys(proj).length) {
						select(homeTab.nextElementSibling[_proj].id);
					}
				} else if(proj[sel].tab.nextElementSibling) {
					select(proj[sel].tab.nextElementSibling[_proj].id);
				} else {
					select("home");
				}
			} else if(event.keyCode === 57) { // ^`9`
				if(Object.keys(proj).length) {
					select(tabs.lastElementChild[_proj].id);
				}
			} else if(event.keyCode === 78 || event.keyCode === 84) { // ^`N` || ^`T`
				new Project();
			} else if(event.keyCode === 79) { // ^`O`
				open();
			} else if(event.keyCode === 83) { // ^`S`
				save();
			} else if(event.keyCode === 87 || event.keyCode === 115) { // ^`W` || ^`F4`
				if(proj[sel]) {
					proj[sel].close();
				} else {
					win.close();
				}
			} else if(event.keyCode >= 49 && event.keyCode <= 56) { // ^`1`-`8`
				if(Object.keys(proj).length) {
					select((tabs.children[event.keyCode - 48] || tabs.lastElementChild)[_proj].id);
				}
			}
		} else if(event.altKey) {
			if(event.keyCode === 36) { // `alt`+`home`
				select("home");
			}
		} else {
			if(event.keyCode === 122) { // `F11`
				const fullScreen = !win.isFullScreen();
				win.setFullScreen(fullScreen);
				titleBar.classList[fullScreen ? "add" : "remove"]("hidden");
			}
		}
	});
//})();
