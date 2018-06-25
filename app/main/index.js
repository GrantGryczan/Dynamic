//(() => {
	global.Miro = {};
	Miro.magic = {};
	Miro.magic.magic = Miro.magic;
	console.log(Miro.magic);
	class MiroError extends Error {
		constructor() {
			const err = super(...arguments);
			err.name = "MiroError";
			return err;
		}
	}
	Miro.mdc = Symbol("mdc");
	Miro.prepare = node => {
		if(!(node instanceof Element || node instanceof Document)) {
			throw new MiroError("The `node` parameter must be an element or a document.");
		}
		for(const elem of node.querySelectorAll("input[type='email']")) {
			elem.maxLength = 254;
		}
		for(const elem of node.querySelectorAll("button:not([type])")) {
			elem.type = "button";
		}
		for(const elem of node.querySelectorAll(".mdc-ripple:not(.mdc-ripple-upgraded)")) {
			elem[Miro.mdc] = new mdc.ripple.MDCRipple(elem);
		}
		for(const elem of node.querySelectorAll(".mdc-text-field:not(.mdc-text-field--upgraded)")) {
			elem[Miro.mdc] = new mdc.textField.MDCTextField(elem);
		}
		for(const elem of node.querySelectorAll(".mdc-checkbox:not(.mdc-checkbox--upgraded)")) {
			elem.querySelector(".mdc-checkbox__background").appendChild(checkmark.cloneNode(true));
			elem[Miro.mdc] = new mdc.checkbox.MDCCheckbox(elem);
		}
		for(const elem of node.querySelectorAll(".mdc-form-field")) {
			elem[Miro.mdc] = new mdc.formField.MDCFormField(elem);
		}
	};
	const htmlExps = ["$", "&"];
	const htmlReplacements = [[/&/g, "&amp;"], [/</g, "&lt;"], [/>/g, "&gt;"], [/"/g, "&quot;"], [/'/g, "&#39;"], [/`/g, "&#96;"]];
	global.html = (strs, ...exps) => {
		let str = strs[0];
		for(let i = 0; i < exps.length; i++) {
			let code = String(exps[i]);
			const expIndex = htmlExps.indexOf(strs[i].slice(-1));
			if(expIndex !== -1) {
				str = str.slice(0, -1);
				for(let j = expIndex; j < htmlReplacements.length; j++) {
					code = code.replace(...htmlReplacements[j]);
				}
			}
			str += code + strs[i + 1];
		}
		const elem = document.createElement("span");
		elem.innerHTML = str.trim() || str;
		Miro.prepare(elem);
		return elem.childNodes.length === 1 ? elem.firstChild : elem;
	};
	const mdcTypes = ["checkbox", "radio", "select", "slider", "text-field"];
	const _disabled = Symbol("disabled");
	const _prevDisabled = Symbol("prevDisabled");
	Miro.formState = (form, state) => {
		if(!(form instanceof HTMLFormElement)) {
			throw new MiroError("The `form` parameter must be an HTML `form` element.");
		}
		state = !state;
		if(form[_disabled] !== state) {
			form[_disabled] = state;
			for(const elem of form.elements) {
				if(state) {
					elem[_prevDisabled] = elem.disabled;
					elem.disabled = true;
				} else if(!elem[_prevDisabled]) {
					elem.disabled = false;
				}
			}
			for(const mdcType of mdcTypes) {
				const mdcClass = `.mdc-${mdcType}`;
				const disabledClass = `mdc-${mdcType}--disabled`;
				for(const elem of form.querySelectorAll(mdcClass)) {
					if(state) {
						elem[_prevDisabled] = elem.classList.contains(disabledClass);
						elem.classList.add(disabledClass);
					} else if(!elem[_prevDisabled]) {
						elem.classList.remove(disabledClass);
					}
				}
			}
		}
	};
	const _dialog = Symbol("dialog");
	const _promise = Symbol("promise");
	const _close = Symbol("close");
	class MiroDialog {
		constructor(title, body, buttons) {
			if(!(typeof title === "string")) {
				throw new MiroError("The `title` parameter must be a string.");
			}
			if(buttons === undefined) {
				buttons = ["Okay"];
			} else if(!(buttons instanceof Array)) {
				throw new MiroError("The `buttons` parameter must be an array if it is defined.");
			}
			if(typeof body === "string") {
				const lines = body.split("\n");
				body = document.createElement("span");
				for(let i = 0; i < lines.length; i++) {
					if(i !== 0) {
						body.appendChild(document.createElement("br"));
					}
					body.appendChild(document.createTextNode(lines[i]));
				}
			} else if(!(body instanceof Node)) {
				throw new MiroError("The `body` parameter must be a string or a DOM node.");
			}
			this.ready = false;
			if(body instanceof HTMLElement) {
				Miro.prepare(body);
			}
			const dialogElem = document.createElement("aside");
			dialogElem[_dialog] = this;
			dialogElem.classList.add("mdc-dialog");
			const surfaceElem = this.form = document.createElement("form");
			surfaceElem.classList.add("mdc-dialog__surface");
			const headerElem = document.createElement("header");
			headerElem.classList.add("mdc-dialog__header");
			const titleElem = document.createElement("h2");
			titleElem.classList.add("mdc-dialog__header__title");
			titleElem.textContent = title;
			headerElem.appendChild(titleElem);
			surfaceElem.appendChild(headerElem);
			const bodyElem = document.createElement("section");
			bodyElem.classList.add("mdc-dialog__body");
			bodyElem.appendChild(body);
			surfaceElem.appendChild(bodyElem);
			const footerElem = document.createElement("footer");
			footerElem.classList.add("mdc-dialog__footer");
			for(let i = 0; i < buttons.length; i++) {
				const item = buttons[i];
				buttons[i] = document.createElement("button");
				if(typeof item === "string") {
					buttons[i].type = "button";
					buttons[i].textContent = item;
				} else if(item instanceof Object) {
					buttons[i].type = item.type;
					buttons[i].textContent = item.text;
				} else {
					throw new MiroError("The `buttons` parameter's array must only include strings and objects.");
				}
				buttons[i].classList.add("mdc-button");
				buttons[i].classList.add("mdc-dialog__footer__button");
				footerElem.appendChild(buttons[i]);
			}
			surfaceElem.appendChild(footerElem);
			dialogElem.appendChild(surfaceElem);
			const backdropElem = document.createElement("div");
			backdropElem.classList.add("mdc-dialog__backdrop");
			dialogElem.appendChild(backdropElem);
			const dialog = new mdc.dialog.MDCDialog(dialogElem);
			container.appendChild(dialogElem);
			this[_promise] = new Promise(resolve => {
				let submitted = false;
				let formState = true;
				if(!(submitted = !footerElem.querySelector("button[type='submit']"))) {
					surfaceElem.addEventListener("submit", event => {
						event.preventDefault();
						submitted = true;
						setTimeout(() => {
							formState = !surfaceElem[_disabled];
							Miro.formState(surfaceElem, false);
						});
					});
				}
				this.value = null;
				const close = value => {
					this.closed = true;
					this.value = value;
					setTimeout(() => {
						container.removeChild(dialogElem);
						Miro.formState(surfaceElem, formState);
					}, 120);
					resolve(value);
				};
				this[_close] = close;
				const dialogButton = async event => {
					if(!submitted && event.target.type === "submit") {
						await Miro.wait();
						if(!submitted) {
							return;
						}
					}
					dialog.close();
					close(buttons.indexOf(event.target));
				};
				for(const elem of buttons) {
					elem.addEventListener("click", dialogButton);
				}
				dialog.listen("MDCDialog:cancel", () => {
					close(-1);
				});
				setTimeout(() => {
					dialog.show();
					this.ready = true;
				});
			});
			this[_dialog] = dialog;
			this.element = dialogElem;
			this.body = bodyElem;
			this.buttons = buttons;
		}
		then(onFulfilled) {
			this[_promise].then(onFulfilled);
			return this;
		}
		finally(onFinally) {
			this[_promise].finally(onFinally);
			return this;
		}
		close(value) {
			setTimeout(() => {
				if(this.ready) {
					this[_dialog].close();
					this[_close](typeof value === "number" ? value : -1);
					return true;
				} else {
					throw new MiroError("The dialog has not finished instantiating and cannot be closed.");
				}
			});
		}
	}
	Miro.dialog = MiroDialog;
	Miro.prepare(document);
	const fs = require("fs-extra");
	const zlib = require("zlib");
	const electron = require("electron");
	const slashes = /[\\\/]/g;
	const win = electron.remote.getCurrentWindow();
	electron.webFrame.setVisualZoomLevelLimits(1, 1);
	let riggedMaximize = false;
	const setRiggedMaximizeToFalse = () => {
		riggedMaximize = false;
	};
	win.on("maximize", () => {
		if(!riggedMaximize) {
			maximizeWindow.textContent = "fullscreen_exit";
			riggedMaximize = true;
			win.unmaximize();
			win.maximize();
			setTimeout(setRiggedMaximizeToFalse);
		}
	});
	win.on("unmaximize", () => {
		if(!riggedMaximize) {
			maximizeWindow.textContent = "fullscreen";
		}
	});
	const titleBar = document.querySelector("#titleBar");
	const windowActions = titleBar.querySelector("#windowActions");
	const minimizeWindow = windowActions.querySelector("#minimizeWindow");
	const maximizeWindow = windowActions.querySelector("#maximizeWindow");
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
	maximizeWindow.textContent = win.isMaximized() ? "fullscreen_exit" : "fullscreen";
	titleBar.querySelector(".label").textContent = `Miroware Dynamic ${navigator.userAgent.match(/ Dynamic\/([^ ]+) /)[1]}`;
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
			this.page = html`
				<div class="page">
					<div id="topPanels">
						<div id="assetContainer" class="panel">
							<div id="assetContents" class="contents">
								<div>
									<span class="label spaced">Assets</span><button id="createObj" class="mdc-fab spaced" title="Create Object" type="button">
										<span class="mdc-fab__icon material-icons">add</span>
									</button><button id="createGroup" class="mdc-fab spaced" title="Create Group" type="button">
										<span class="mdc-fab__icon material-icons">create_new_folder</span>
									</button><button id="importImage" class="mdc-fab spaced" title="Import Image" type="button">
										<span class="mdc-fab__icon material-icons">photo_library</span>
									</button><button id="importAudio" class="mdc-fab spaced" title="Import Audio" type="button">
										<span class="mdc-fab__icon material-icons">library_music</span>
									</button>
								</div>
								<div id="assets"></div>
							</div>
							<div id="assetHandle"></div>
						</div>
						<div id="contentContainer"></div>
						<div id="propertiesContainer" class="panel">
							<div id="propertiesContents" class="contents"></div>
							<div id="propertiesHandle"></div>
						</div>
					</div>
					<div id="timelineContainer" class="panel">
						<div id="timelineContents" class="contents"></div>
						<div id="timelineHandle"></div>
					</div>
				</div>
			`;
			this.data = thisProject.data || {
				...baseData
			};
			const id = String(++projID);
			(proj[id] = this).id = id;
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
			proj[sel].page.remove();
		} else if(sel === "home") {
			homePage.remove();
		}
		sel = id;
		for(const tab of tabs.children) {
			tab.classList.remove("current");
		}
		if(saveProjAs.disabled = exportProj.disabled = id === "home") {
			saveProj.disabled = true;
			homeTab.classList.add("current");
			container.appendChild(homePage);
		} else {
			saveProj.disabled = proj[id].saved;
			proj[id].tab.classList.add("current");
			container.appendChild(proj[id].page);
		}
	};
	select("home");
	const selectProject = project => {
		if(project) {
			select(project.id);
		}
	};
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
	let initialTabPos;
	let tabOffset;
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
					tabOffset = event.clientX - prevTabPos;
					mouseTarget.style.left = "";
					mouseTarget.style.left = `${prevTabPos - (initialTabPos = mouseTarget.offsetLeft)}px`;
					for(let i = 1; i < tabs.children.length; i++) {
						tabs.children[i].classList[tabs.children[i] === mouseTarget ? "remove" : "add"]("smooth");
					}
				}
			}
		}
	});
	window.addEventListener("mousemove", event => {
		if(down && mouseTarget.classList.contains("tab") && mouseTarget !== homeTab) {
			mouseTarget.style.left = `${event.clientX - initialTabPos - tabOffset}px`;
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
			if(mouseTarget && mouseTarget.classList.contains("tab")) {
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
						select(new Project().id);
					} else if(mouseTarget === openProj) {
						open().then(selectProject);
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
			down = false;
		}
	});
	window.addEventListener("keydown", event => {
		console.log(event.keyCode);
		if(event.ctrlKey || event.metaKey) {
			if(event.shiftKey) {
				if(event.keyCode === 73) { // ctrl+shift+I
					win.toggleDevTools();
				} else if(event.keyCode === 83) { // ctrl+shift+S
					save(true);
				}
			} else if(event.keyCode === 83) { // ctrl+S
				save();
			} else if(event.keyCode === 87) { // ctrl+W
				if(proj[sel]) {
					proj[sel].close();
				} else {
					win.close();
				}
			}
		}
	});
//})();
