"use strict";
let playing = false;
let then;
const animate = now => {
	if(playing) {
		requestAnimationFrame(animate);
		const elapsed = now - then;
		const interval = 1000 / project.data.fps;
		const change = project.data.fps === 0 ? 1 : Math.floor(elapsed / interval);
		if(change > 0) {
			then = now - elapsed % interval;
			let value = project.time + change;
			for(const obj of project.root.objs) {
				if(obj.type === "audio") {
					let playTimeSet = false;
					let volumeSet = false;
					let loopSet = false;
					let speedSet = false;
					for(let i = project.time + 1; i <= value; i++) {
						const keyframe = obj.keyframes[i];
						if(keyframe) {
							if(keyframe.present || keyframe.time) {
								playTimeSet = true;
							}
							if(keyframe.volume) {
								volumeSet = true;
							}
							if(keyframe.loop) {
								loopSet = true;
							}
							if(keyframe.speed) {
								speedSet = true;
							}
						}
					}
					const playTimeSpeedLoopSet = playTimeSet || speedSet || loopSet;
					if(playTimeSpeedLoopSet || volumeSet) {
						const computed = computeDynamicAudio(obj, value);
						if(playTimeSpeedLoopSet) {
							if(playTimeSet) {
								const promise = obj.element[computed.play ? "play" : "pause"]();
								if(promise) {
									promise.catch(console.warn);
								}
							}
							obj.element.currentTime = computed.time;
							if(loopSet) {
								obj.element.loop = computed.loop;
							}
							if(speedSet) {
								obj.element.playbackRate = computed.speed;
							}
						}
						if(volumeSet) {
							obj.element.volume = computed.volume;
						}
					}
				}
			}
			const lastFrame = project.root.duration - 1;
			const reachedEnd = (project.time === lastFrame || value >= lastFrame) && project.root === project.data.scenes[project.data.scenes.length - 1];
			if(reachedEnd && !project.loop) {
				pause();
				value = lastFrame;
			}
			setTime(value, true);
		}
	}
};
const play = () => {
	if(!playing) {
		const onLastScene = project.root === project.data.scenes[project.data.scenes.length - 1];
		if(project.time === project.root.duration - 1 && (onLastScene || !(project.root instanceof DynamicScene))) {
			if(onLastScene && project.data.scenes.length !== 1) {
				setRoot(project.data.scenes[0]);
			}
			setTime(0, true);
		}
		then = performance.now();
		playing = true;
		foot.play.classList.add("hidden");
		foot.pause.classList.remove("hidden");
		updateLiveAudio();
		requestAnimationFrame(animate);
	}
};
const pause = () => {
	if(playing) {
		playing = false;
		foot.pause.classList.add("hidden");
		foot.play.classList.remove("hidden");
		killAudio();
	}
};
const playingAudio = [];
const updateLiveAudio = () => {
	for(const obj of project.root.objs) {
		if(obj.type === "audio") {
			if(!playingAudio.includes(obj.element)) {
				playingAudio.push(obj.element);
			}
			const computed = computeDynamicAudio(obj);
			const promise = obj.element[computed.play ? "play" : "pause"]();
			if(promise) {
				promise.catch(console.warn);
			}
			obj.element.currentTime = computed.time;
			obj.element.volume = computed.volume;
			obj.element.loop = computed.loop;
			obj.element.playbackRate = computed.speed;
		}
	}
};
const killAudio = () => {
	while(playingAudio.length) {
		playingAudio.pop().pause();
	}
};
window.addEventListener("visibilitychange", () => {
	if(document.hidden) {
		pause();
	}
});
const updateClipCanvas = () => {
	if(project.clipCanvas) {
		foot.clipCanvas.classList.remove("translucent");
		instances.classList.add("clip");
	} else {
		foot.clipCanvas.classList.add("translucent");
		instances.classList.remove("clip");
	}
};
const updateOnionskin = () => {
	foot.onionskin.classList[project.onionskin ? "remove" : "add"]("translucent");
};
