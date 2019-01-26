"use strict";
const DynamicScene = class DynamicScene {
	constructor(value) {
		if (!(value instanceof Object)) {
			value = {};
		}
		if (!(value.project instanceof DynamicProject)) {
			value.project = project;
		}
		if (typeof value.id !== "string") {
			value.id = uid(value.project.data.scenes.map(byID));
		}
		if (typeof value.name === "string") {
			value.name = value.name.trim();
		} else {
			const names = value.project.data.scenes.map(byName).map(insensitiveString);
			value.name = "Scene";
			for (let i = 2; names.includes(insensitiveString(value.name)); i++) {
				value.name = `Scene ${i}`;
			}
		}
		Object.assign(this, {
			id: value.id,
			[_name]: value.name,
			duration: isFinite(value.duration) && value.duration > 0 ? +value.duration : value.project.data.fps * 2,
			objs: [],
			element: html`
				<div class="scene${value.project.data.scenes.length ? "" : " selected"}" title="$${value.name}">
					<div class="bar">
						<div class="icon material-icons"></div>
						<div class="label">$${value.name}</div>
						<div class="close material-icons"></div>
					</div>
				</div>
			`
		});
		(this.element._scene = this).element._label = this.element.querySelector(".label");
		if (sceneDialog) {
			scenes.appendChild(this.element);
		}
		value.project.data.scenes.push(this);
	}
	get name() {
		return this[_name];
	}
	set name(value) {
		this[_name] = this.element._label.textContent = this.element.title = value;
		if (this === project.scene) {
			sceneChipText.textContent = sceneChip.title = this.name;
		}
	}
	toJSON() {
		const obj = {
			...this,
			name: this.name
		};
		delete obj.element;
		return obj;
	}
}
const byScene = sceneElem => sceneElem._scene;
const storeScenes = () => {
	project.data.scenes = Array.prototype.map.call(scenes.querySelectorAll(".scene"), byScene);
	project.saved = false;
};
const removeScene = sceneElem => {
	const sibling = sceneElem.previousElementSibling || sceneElem.nextElementSibling;
	if (sceneElem.classList.contains("selected")) {
		sibling.classList.add("selected");
	}
	if (project.sceneLoad) {
		delete project.sceneLoad;
	}
	if (project.root === sceneElem._scene) {
		setRoot(sibling._scene);
	}
	sceneElem.remove();
	storeScenes();
};
const confirmRemoveScene = sceneElem => {
	if (project.data.scenes.length !== 1) {
		new Miro.Dialog("Remove Scene", html`
			Are you sure you want to remove <b>$${sceneElem._scene.name}</b>?<br>
			Objects and other data inside the scene will also be removed.
		`, ["Yes", "No"]).then(value => {
			if (value === 0) {
				removeScene(sceneElem);
			}
		});
	} else {
		new Miro.Dialog("Error", "You must have at least one scene.");
	}
};
const removeSelectedScene = () => {
	confirmRemoveScene(scenes.querySelector(".scene.selected"));
};
const selectScene = sceneElem => {
	const scene = sceneElem._scene;
	for (const otherScene of project.data.scenes) {
		otherScene.element.classList.remove("focus");
		otherScene.element.classList[scene === otherScene ? "add" : "remove"]("selected");
	}
};
const renameScene = initialValue => {
	const scene = scenes.querySelector(".scene.selected")._scene;
	if (typeof initialValue !== "string") {
		initialValue = scene.name;
	}
	const input = new Miro.Dialog("Rename", html`
		Enter a new name for <b>$${scene.name}</b>.
		<div class="mdc-text-field">
			<input class="mdc-text-field__input" name="name" type="text" value="$${initialValue}" required>
			<div class="mdc-line-ripple"></div>
		</div>
	`, [{
		text: "Okay",
		type: "submit"
	}, "Cancel"]).then(value => {
		if (value === 0) {
			const trimmedValue = input.value.trim();
			const insensitiveValue = trimmedValue.toLowerCase();
			if (insensitiveString(scene.name) !== insensitiveValue) {
				if (project.data.scenes.map(byName).map(insensitiveString).includes(insensitiveValue)) {
					new Miro.Dialog("Error", "That name is already taken.").then(renameScene.bind(null, input.value));
				} else {
					scene.name = trimmedValue;
				}
			}
		}
	}).form.elements.name;
};
let sceneDialog = null;
const openScenes = () => {
	for (const scene of project.data.scenes) {
		scenes.appendChild(scene.element);
	}
	sceneDialog = new Miro.Dialog("", sceneBox, ["Select", "Cancel"]).then(value => {
		if (value === 0) {
			setRoot(scenes.querySelector(".scene.selected")._scene);
		}
		while (scenes.lastElementChild) {
			scenes.lastElementChild.remove();
		}
		sceneDialog = null;
	});
	setTimeout(sceneDialog.buttons[0].focus.bind(sceneDialog.buttons[0]));
};
