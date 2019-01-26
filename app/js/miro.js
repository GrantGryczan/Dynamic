"use strict";
const Miro = global.Miro = {};
Miro.magic = {};
Miro.magic.magic = Miro.magic;
console.log(Miro.magic);
const MiroError = class MiroError extends Error {
	constructor() {
		const err = super(...arguments);
		err.name = "MiroError";
		return err;
	}
}
Miro.wait = delay => new Promise(resolve => {
	setTimeout(resolve, delay);
});
Miro.prepare = node => {
	if (!(node instanceof Element || node instanceof Document)) {
		throw new MiroError("The `node` parameter must be an element or a document.");
	}
	for (const elem of node.querySelectorAll("input[type='email']")) {
		elem.maxLength = 254;
	}
	for (const elem of node.querySelectorAll("button:not([type])")) {
		elem.type = "button";
	}
	for (const elem of node.querySelectorAll(".mdc-ripple:not(.mdc-ripple-upgraded)")) {
		elem._mdc = mdc.ripple.MDCRipple.attachTo(elem);
	}
	for (const elem of node.querySelectorAll(".mdc-text-field:not(.mdc-text-field-upgraded)")) {
		elem._mdc = mdc.textField.MDCTextField.attachTo(elem);
	}
	for (const elem of node.querySelectorAll(".mdc-select")) {
		elem._mdc = mdc.select.MDCSelect.attachTo(elem);
	}
	for (const elem of node.querySelectorAll(".mdc-checkbox:not(.mdc-checkbox-upgraded)")) {
		elem.querySelector(".mdc-checkbox__background").appendChild(checkmark.cloneNode(true));
		elem._mdc = mdc.checkbox.MDCCheckbox.attachTo(elem);
	}
	for (const elem of node.querySelectorAll(".mdc-form-field")) {
		elem._mdc = mdc.formField.MDCFormField.attachTo(elem);
	}
};
const htmlReplacements = [[/&/g, "&amp;"], [/</g, "&lt;"], [/>/g, "&gt;"], [/"/g, "&quot;"], [/'/g, "&#39;"], [/`/g, "&#96;"]];
const html = global.html = (strs, ...exps) => {
	let str = strs[0];
	for (let i = 0; i < exps.length; i++) {
		let code = String(exps[i]);
		if (strs[i].slice(-1) === "$") {
			str = str.slice(0, -1);
			code = html.escape(code);
		}
		str += code + strs[i + 1];
	}
	const elem = document.createElement("span");
	elem.innerHTML = str.trim() || str;
	Miro.prepare(elem);
	return elem.childNodes.length === 1 ? elem.firstChild : elem;
};
html.escape = code => {
	if (typeof code !== "string") {
		throw new MiroError("The `code` parameter must be a string.");
	}
	for (const htmlReplacement of htmlReplacements) {
		code = code.replace(...htmlReplacement);
	}
	return code;
};
const mdcTypes = ["checkbox", "radio", "select", "slider", "text-field"];
const checkmark = html`
	<svg class="mdc-checkbox__checkmark" viewBox="0 0 24 24">
		<path class="mdc-checkbox__checkmark-path" fill="none" d="M1.73,12.91 8.1,19.28 22.79,4.59">
	</svg>
`;
Miro.formState = (form, state) => {
	if (!(form instanceof HTMLFormElement)) {
		throw new MiroError("The `form` parameter must be an HTML `form` element.");
	}
	state = !state;
	if (form._disabled !== state) {
		form._disabled = state;
		for (const elem of form.elements) {
			if (state) {
				elem._prevDisabled = elem.disabled;
				elem.disabled = true;
			} else if (!elem._prevDisabled) {
				elem.disabled = false;
			}
		}
		for (const mdcType of mdcTypes) {
			const mdcClass = `.mdc-${mdcType}`;
			const disabledClass = `mdc-${mdcType}--disabled`;
			for (const elem of form.querySelectorAll(mdcClass)) {
				if (state) {
					elem._prevDisabled = elem.classList.contains(disabledClass);
					elem.classList.add(disabledClass);
				} else if (!elem._prevDisabled) {
					elem.classList.remove(disabledClass);
				}
			}
		}
	}
};
const _dialog = Symbol("dialog");
const _promise = Symbol("promise");
const _close = Symbol("close");
Miro.Dialog = class MiroDialog {
	constructor(title, content, buttons) {
		if (!(typeof title === "string")) {
			throw new MiroError("The `title` parameter must be a string.");
		}
		if (buttons === undefined) {
			buttons = ["Okay"];
		} else if (!(buttons instanceof Array)) {
			throw new MiroError("The `buttons` parameter must be an array if it is defined.");
		}
		if (typeof content === "string") {
			const lines = content.split("\n");
			content = document.createElement("span");
			for (let i = 0; i < lines.length; i++) {
				if (i !== 0) {
					content.appendChild(document.createElement("br"));
				}
				content.appendChild(document.createTextNode(lines[i]));
			}
		} else if (!(content instanceof Node)) {
			throw new MiroError("The `content` parameter must be a string or a DOM node.");
		}
		this.ready = false;
		if (content instanceof HTMLElement) {
			Miro.prepare(content);
		}
		const dialogElem = html`
			<div class="mdc-dialog">
				<div class="mdc-dialog__container">
					<form class="mdc-dialog__surface">
						<h2 class="mdc-dialog__title">$${title}</h2>
						<div class="mdc-dialog__content"></div>
						<div class="mdc-dialog__actions"></div>
					</form>
				</div>
				<div class="mdc-dialog__scrim"></div>
			</div>
		`;
		dialogElem[_dialog] = this;
		const form = this.form = dialogElem.querySelector("form");
		const contentElem = dialogElem.querySelector(".mdc-dialog__content");
		contentElem.appendChild(content);
		const buttonsElem = dialogElem.querySelector(".mdc-dialog__actions");
		if (buttons.length) {
			buttons = buttons.map(item => {
				const button = document.createElement("button");
				if (typeof item === "string") {
					button.type = "button";
					button.textContent = item;
				} else if (item instanceof Object) {
					button.type = item.type;
					button.textContent = item.text;
				} else {
					throw new MiroError("The `buttons` parameter's array must only include strings and objects.");
				}
				button.classList.add("mdc-button");
				button.classList.add("mdc-dialog__button");
				buttonsElem.appendChild(button);
				return button;
			});
		}
		container.appendChild(dialogElem);
		const dialog = mdc.dialog.MDCDialog.attachTo(dialogElem);
		this[_promise] = new Promise(resolve => {
			let submitted = false;
			let formState = true;
			form.addEventListener("submit", (submitted = !buttonsElem.querySelector("button[type='submit']")) ? evt => {
				evt.preventDefault();
			} : evt => {
				evt.preventDefault();
				submitted = true;
				setTimeout(() => {
					formState = !form._disabled;
					Miro.formState(form, false);
				});
			});
			let canClose = true;
			this.value = null;
			const close = this[_close] = value => {
				if (canClose) {
					canClose = false;
					this.value = value;
					dialog.close();
					Miro.formState(form, formState);
					resolve(value);
				}
			};
			const click = async evt => {
				if (!submitted && evt.target.type === "submit") {
					await Miro.wait();
					if (!submitted) {
						return;
					}
				}
				close(buttons.indexOf(evt.target));
			};
			for (const elem of buttons) {
				elem.addEventListener("click", click);
			}
			dialog.listen("MDCDialog:closing", close.bind(this, -1));
			dialog.listen("MDCDialog:closed", () => {
				container.removeChild(dialogElem);
			});
			setTimeout(() => {
				dialog.open();
				this.ready = true;
			});
		});
		this[_dialog] = dialog;
		this.element = dialogElem;
		this.content = contentElem;
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
			if (this.ready) {
				this[_close](typeof value === "number" ? value : -1);
				return true;
			} else {
				throw new MiroError("The dialog has not finished instantiating and cannot be closed.");
			}
		});
	}
}
Miro.focused = () => !(container.querySelector(".mdc-dialog") || tabs.classList.contains("intangible"));
Miro.typing = () => container.querySelector("input:not([type='button']):not([type='submit']):not([type='reset']):focus, textarea:focus");
Miro.prepare(document);
