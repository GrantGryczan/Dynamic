"use strict";
const updateOnionskin = () => {
	if(proj[sel].onionskin) {
		enableOnionskin.classList.add("hidden");
		disableOnionskin.classList.remove("hidden");
	} else {
		disableOnionskin.classList.add("hidden");
		enableOnionskin.classList.remove("hidden");
	}
};
