"use strict";
let playing = false;
let then;
const animate = () => {
	requestAnimationFrame(animate);
	if(playing) {
		const now = performance.now();
		const elapsed = now - then;
		const interval = 1000 / project.data.fps;
		const change = project.data.fps === 0 ? 1 : Math.floor(elapsed / interval);
		if(change > 0) {
			then = now - elapsed % interval;
			const lastFrame = project.data.duration - 1;
			let value = project.time + change;
			if((project.time === lastFrame || value >= lastFrame) && !project.loop) {
				pause();
				value = lastFrame;
			}
			setTime(value);
		}
	}
};
requestAnimationFrame(animate);
const play = () => {
	if(!playing) {
		if(project.time === project.data.duration - 1) {
			setTime(0);
		}
		then = performance.now();
		playing = true;
		foot.play.classList.add("hidden");
		foot.pause.classList.remove("hidden");
	}
};
const pause = () => {
	if(playing) {
		playing = false;
		foot.pause.classList.add("hidden");
		foot.play.classList.remove("hidden");
	}
};
const updateOnionskin = () => {
	if(project.onionskin) {
		foot.enableOnionskin.classList.add("hidden");
		foot.disableOnionskin.classList.remove("hidden");
	} else {
		foot.disableOnionskin.classList.add("hidden");
		foot.enableOnionskin.classList.remove("hidden");
	}
};
