"use strict";
class DynamicScene {
	constructor(proj) {
		if(!proj) {
			proj = project;
		}
		this.id = uid(proj.data.scenes.map(byID));
		this[_name] = proj.data.scenes.length ? `Scene ${proj.data.scenes.length + 1}` : "Scene";
		Object.assign(this, {
			duration: proj.data.fps * 2,
			objs: [],
			element: html`
				<div id="scene_${this.id}" class="scene${proj.data.scenes.length ? "" : " selected"}" title="$${this.name}">
					<div class="bar">
						<div class="icon material-icons"></div>
						<div class="label">$${this.name}</div>
						<div class="close material-icons"></div>
					</div>
				</div>
			`
		});
		this.element._scene = this;
		proj.data.scenes.push(this);
	}
	get name() {
		return this[_name];
	}
	set name(value) {
		this[_name] = this.element.querySelector(".label").textContent = this.element.title = value;
		if(this === project.root) {
			objChipText.textContent = objChip.title = this.name;
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
	if(sceneElem.classList.contains("selected")) {
		sibling.classList.add("selected");
	}
	if(project.root === sceneElem._scene) {
		setRoot(sibling._scene);
	}
	sceneElem.remove();
	storeScenes();
};
const confirmRemoveScene = sceneElem => {
	if(project.data.scenes.length > 1) {
		new Miro.Dialog("Remove Scene", html`
			Are you sure you want to remove <span class="bold">${sceneElem._scene.name}</span>?<br>
			Objects and other data inside the scene will also be removed.
		`, ["Yes", "No"]).then(value => {
			if(value === 0) {
				removeScene(sceneElem);
			}
		});
	} else {
		new Miro.Dialog("Error", "You must have at least one scene.");
	}
};
const selectScene = sceneElem => {
	const scene = sceneElem._scene;
	for(const otherScene of project.data.scenes) {
		otherScene.element.classList.remove("focus");
		otherScene.element.classList[scene === otherScene ? "add" : "remove"]("selected");
	}
};
let sceneDialog = null;
const openScenes = () => {
	for(const scene of project.data.scenes) {
		scenes.appendChild(scene.element);
	}
	sceneDialog = new Miro.Dialog("", sceneBox, ["Select", "Cancel"]).then(value => {
		if(value === 0) {
			setRoot(scenes.querySelector(".scene.selected")._scene);
		}
		while(scenes.lastElementChild) {
			scenes.lastElementChild.remove();
		}
		sceneDialog = null;
	});
	setTimeout(sceneDialog.buttons[0].focus.bind(sceneDialog.buttons[0]));
};
