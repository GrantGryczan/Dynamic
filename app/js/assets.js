"use strict";
const getAsset = id => project.data.assets.find(asset => asset.id === id);
const byObjArrays = asset => asset.objs;
class DynamicAsset {
	constructor(value) {
		if(!(value instanceof Object)) {
			throw new MiroError("The `value` parameter must be an object.");
		}
		this.id = value.id || uid(project.data.assets.map(byID));
		this.type = value.type;
		this[_name] = value.name;
		if(this.type === "group") {
			this.element = html`
				<div id="asset_${this.id}" class="asset typeGroup" title="$${this.name}">
					<div class="bar">
						<div class="icon material-icons"></div>
						<div class="label">$${this.name}</div>
						<div class="close material-icons"></div>
					</div>
					<div class="children"></div>
				</div>
			`;
		} else if(this.type === "file") {
			if(!value.mime.startsWith("image/") && !value.mime.startsWith("audio/")) {
				throw new MiroError("The `mime` value is invalid.");
			}
			this.mime = value.mime;
			this.data = value.data;
			this.element = html`
				<div id="asset_${this.id}" class="asset typeFile" title="$${this.name}" data-mime="$${this.mime}">
					<div class="bar">
						<div class="icon material-icons"></div>
						<div class="label">$${this.name}</div>
						<div class="close material-icons"></div>
					</div>
				</div>
			`;
		} else if(this.type === "obj") {
			this.objs = [];
			this.duration = 1;
			this.element = html`
				<div id="asset_${this.id}" class="asset typeObj" title="$${this.name}">
					<div class="bar">
						<div class="icon material-icons"></div>
						<div class="label">$${this.name}</div>
						<div class="close material-icons"></div>
					</div>
				</div>
			`;
		} else {
			throw new MiroError("The `type` value is invalid.");
		}
		project.data.assets.push(this);
		if(value.parent) {
			this.parent = getAsset(value.parent);
		}
		appendAsset(this.element._asset = this);
	}
	get name() {
		return this[_name];
	}
	set name(value) {
		this[_name] = value;
		if(this.element) {
			this.element.querySelector(".label").textContent = this.element.title = value;
		}
		for(const obj of this.objects) {
			obj.updateName();
		}
	}
	toJSON() {
		const obj = {
			...this,
			name: this.name
		};
		if(this.parent) {
			obj.parent = this.parent.id;
		}
		delete obj.element;
		return obj;
	}
	get url() {
		if(this.type === "file") {
			return `data:${this.mime};base64,${this.data}`;
		}
	}
	get presentObjects() {
		return project.root.objs.filter(obj => obj.asset === this);
	}
	get objects() {
		const objs = [...project.data.objs];
		for(const objArray of project.data.assets.map(byObjArrays)) {
			objs.push(...objArray);
		}
		return objs.filter(obj => obj.asset === this);
		// TODO (Chrome 69): return [...project.data.objs, ...project.data.assets.flatMap(byObjArrays)].filter(obj => obj.asset === this);
	}
}
const appendAsset = asset => {
	(asset.parent && asset.parent.type === "group" ? asset.parent.element.lastElementChild : assets).appendChild(asset.element);
};
const storeAssets = () => {
	project.data.assets = [];
	for(const assetElem of assets.querySelectorAll(".asset")) {
		if(assetElem.parentNode === assets) {
			delete assetElem._asset.parent;
		} else {
			assetElem._asset.parent = assetElem.parentNode.parentNode._asset;
		}
		project.data.assets.push(assetElem._asset);
	}
	project.saved = false;
};
const removeAsset = assetElem => {
	if(project.selectedAsset === assetElem.id) {
		project.selectedAsset = null;
	}
	if(assetElem._asset.type === "group") {
		while(assetElem.lastElementChild.firstElementChild) {
			assetElem.before(assetElem.lastElementChild.firstElementChild);
		}
	} else {
		if(project.setRoot === assetElem._asset) {
			setRoot();
		}
		for(const obj of assetElem._asset.objects) {
			removeObj(obj.timelineItem);
		}
		updateTimelines();
	}
	assetElem.remove();
};
const confirmRemoveAsset = assetElem => {
	const actuallyRemoveAsset = value => {
		if(value === 0) {
			removeAsset(assetElem);
			storeAssets();
			storeObjs();
			updateProperties();
		}
	};
	if(assetElem._asset.type === "file" || assetElem._asset.type === "obj") {
		new Miro.Dialog("Remove Asset", html`
			Are you sure you want to remove <span class="bold">${assetElem._asset.name}</span>?<br>
			Objects using the asset will also be removed.
		`, ["Yes", "No"]).then(actuallyRemoveAsset);
	} else if(assetElem._asset.type === "group") {
		new Miro.Dialog("Remove Group", html`
			Are you sure you want to remove <span class="bold">${assetElem._asset.name}</span>?<br>
			All assets inside the group will be taken out.
		`, ["Yes", "No"]).then(actuallyRemoveAsset);
	}
};
const confirmRemoveAssets = assetElems => {
	if(assetElems.length === 1) {
		confirmRemoveAsset(assetElems[0]);
	} else if(assetElems.length > 1) {
		new Miro.Dialog("Remove Assets", html`
			Are you sure you want to remove all those assets?<br>
			Objects using the assets will also be removed.
		`, ["Yes", "No"]).then(value => {
			if(value === 0) {
				assetElems.forEach(removeAsset);
				storeAssets();
				storeObjs();
				updateProperties();
			}
		});
	}
};
const removeSelectedAssets = () => {
	confirmRemoveAssets(assets.querySelectorAll(".asset.selected"));
};
const deselectAssets = () => {
	for(const assetElem of assets.querySelectorAll(".asset.selected")) {
		assetElem.classList.remove("selected");
		assetElem.classList.remove("focus");
	}
	project.selectedAsset = null;
};
const selectAllAssets = () => {
	for(const assetElem of assets.querySelectorAll(".asset:not(.selected)")) {
		assetElem.classList.add("selected");
	}
	updateProperties();
};
const selectAsset = (target, button) => {
	if(typeof button !== "number") {
		button = 0;
	}
	if(button === 2 && !(superKey || shiftKey)) {
		if(!target.classList.contains("selected")) {
			for(const assetElem of assets.querySelectorAll(".asset.selected")) {
				assetElem.classList.remove("selected");
			}
			target.classList.add("selected");
			project.selectedAsset = target.id;
		}
	} else if(shiftKey) {
		let selecting = !project.selectedAsset;
		const classListMethod = superKey && project.selectedAsset && !assets.querySelector(`#${project.selectedAsset}`).classList.contains("selected") ? "remove" : "add";
		for(const assetElem of assets.querySelectorAll(".asset")) {
			if(assetElem.id === project.selectedAsset || assetElem.id === target.id) {
				if(selecting) {
					assetElem.classList[classListMethod]("selected");
					selecting = false;
					continue;
				} else {
					assetElem.classList[classListMethod]("selected");
					if(project.selectedAsset !== target.id) {
						selecting = true;
					}
				}
			} else if(selecting) {
				assetElem.classList[classListMethod]("selected");
			} else if(!superKey) {
				assetElem.classList.remove("selected");
			}
		}
	} else {
		project.selectedAsset = target.id;
		if(superKey) {
			target.classList.toggle("selected");
		} else {
			let othersSelected = false;
			for(const assetElem of assets.querySelectorAll(".asset.selected")) {
				if(assetElem !== target) {
					othersSelected = true;
					assetElem.classList.remove("selected");
				}
			}
			if(target.classList[othersSelected ? "add" : "toggle"]("selected") === false) {
				project.selectedAsset = null;
				project.focusedAsset = target.id;
			}
		}
	}
	setActive(assetContainer);
};
const byID = asset => asset.id;
const addFiles = async files => {
	let assetParent = assets;
	if(ctxTarget && ctxTarget.classList.contains("bar") && ctxTarget.parentNode.classList.contains("asset")) {
		if(ctxTarget.parentNode._asset.type === "group") {
			assetParent = ctxTarget.parentNode.lastElementChild;
		} else if(ctxTarget.parentNode._asset.parent) {
			assetParent = ctxTarget.parentNode._asset.parent.element.lastElementChild;
		}
	}
	loadProgress(0);
	deselectAssets();
	for(let i = 0; i < files.length; i++) {
		loadProgress(i / files.length);
		let data;
		try {
			data = files[i].data || Buffer.from((await new Promise(resolve => {
				const reader = new FileReader();
				reader.addEventListener("loadend", resolve);
				reader.readAsArrayBuffer(files[i]);
			})).target.result).toString("base64");
		} catch(err) {
			console.warn(err);
			new Miro.Dialog("Error", html`
				An error occurred while encoding <span class="bold">${files[i].name}</span>.
			`);
			continue;
		}
		const names = project.data.assets.map(byInsensitiveName);
		let name = files[i].name;
		for(let j = 2; names.includes(name.toLowerCase()); j++) {
			name = `${files[i].name} ${j}`;
		}
		let asset;
		try {
			asset = new DynamicAsset({
				type: "file",
				name,
				mime: files[i].type,
				data
			});
			await new Promise((resolve, reject) => {
				const media = new (asset.mime.startsWith("image/") ? Image : Audio)();
				media.src = asset.url;
				media.addEventListener(media instanceof Image ? "load" : "canplay", resolve);
				media.addEventListener("error", reject);
			});
		} catch(err) {
			console.warn(err);
			new Miro.Dialog("Error", html`
				<span class="bold">${files[i].name}</span> is not a valid asset.
			`);
			continue;
		}
		assetParent.appendChild(asset.element);
		if(!assetParent.parentNode.classList.contains("open")) {
			assetParent.parentNode.classList.add("open");
		}
		asset.element.classList.add("selected");
		if(i === 0) {
			project.selectedAsset = asset.element.id;
		}
	}
	storeAssets();
	setActive(assetContainer);
	loadProgress(1);
};
const assetInput = document.createElement("input");
assetInput.type = "file";
assetInput.multiple = true;
assetInput.addEventListener("change", async () => {
	await addFiles(assetInput.files);
	assetInput.value = null;
});
const addFileFromURI = uri => {
	loadIndeterminate(true);
	const error = () => {
		loadIndeterminate(false);
		new Miro.Dialog("Error", html`
			An error occurred while fetching <span class="bold">${uri}</span>.
		`);
	};
	try {
		(uri.startsWith("https:") ? https : http).get(uri, res => {
			const chunks = [];
			res.on("data", chunks.push.bind(chunks));
			res.once("end", () => {
				loadIndeterminate(false);
				addFiles([{
					name: uri.slice(uri.lastIndexOf("/") + 1),
					type: res.headers["content-type"],
					data: Buffer.concat(chunks).toString("base64")
				}]);
			});
		}).once("error", error);
	} catch(err) {
		console.warn(err);
		error();
	}
};
