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
			let value = project.time + change;
			const lastFrame = project.root.duration - 1;
			const reachedEnd = (project.time === lastFrame || value >= lastFrame) && project.root === project.data.scenes[project.data.scenes.length - 1];
			if(reachedEnd && !project.loop) {
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
		const onLastScene = project.root === project.data.scenes[project.data.scenes.length - 1];
		if(project.time === project.root.duration - 1 && (onLastScene || !(project.root instanceof DynamicScene))) {
			if(onLastScene && project.data.scenes.length > 1) {
				setRoot(project.data.scenes[0]);
			}
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
