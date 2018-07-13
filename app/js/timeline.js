"use strict";
const assetLink = (asset, selected) => {
	if(selected) {
		const selectedElem = assetPath.querySelector(".assetLink .mdc-chip--selected");
		if(selectedElem) {
			selectedElem.classList.remove("mdc-chip--selected");
		}
	}
	const assetLinkElem = html`
		<span id="assetLink_${asset.id}" class="assetLink">
			<span class="material-icons">arrow_right</span>
			<div class="mdc-chip${selected ? " mdc-chip--selected" : ""}">
				<div class="mdc-chip__text">$${asset.name}</div>
			</div>
		</span>
	`;
	assetLinkElem[_asset] = asset;
	assetPath.appendChild(assetLinkElem);
};
const rootAsset = asset => {
	if(asset && proj[sel].rootAsset === asset.id) {
		return;
	}
	while(assetPath.children[1]) {
		assetPath.children[1].remove();
	}
	openAsset(asset, true, true);
	if(asset) {
		proj[sel].rootAsset = asset.id;
	} else {
		delete proj[sel].rootAsset;
	}
};
const openAsset = (asset, selected, finish) => {
	if(asset) {
		proj[sel].openAsset = asset.id;
		assetLink(asset, selected);
		if(finish) {
			// TODO
		}
	} else {
		assetPath.firstElementChild.firstElementChild.classList.add("mdc-chip--selected");
		delete proj[sel].openAsset;
	}
};
