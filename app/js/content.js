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
		playButton.classList.add("hidden");
		pauseButton.classList.remove("hidden");
	}
};
const pause = () => {
	if(playing) {
		playing = false;
		pauseButton.classList.add("hidden");
		playButton.classList.remove("hidden");
	}
};
const updateOnionskin = () => {
	if(project.onionskin) {
		enableOnionskin.classList.add("hidden");
		disableOnionskin.classList.remove("hidden");
	} else {
		disableOnionskin.classList.add("hidden");
		enableOnionskin.classList.remove("hidden");
	}
};
