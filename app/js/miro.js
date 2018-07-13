"use strict";
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
Miro.wait = delay => new Promise(resolve => {
	setTimeout(resolve, delay);
});
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
		hideFullPreview();
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
				surfaceElem.addEventListener("submit", evt => {
					evt.preventDefault();
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
			const dialogButton = async evt => {
				if(!submitted && evt.target.type === "submit") {
					await Miro.wait();
					if(!submitted) {
						return;
					}
				}
				dialog.close();
				close(buttons.indexOf(evt.target));
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
Miro.Dialog = MiroDialog;
Miro.prepare(document);
